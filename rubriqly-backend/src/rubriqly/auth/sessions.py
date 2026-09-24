"""Sign-in sessions. The browser holds a random token; the database holds only its hash."""

import hashlib
import secrets
from datetime import datetime, timedelta

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from rubriqly.config import Settings
from rubriqly.db import utcnow
from rubriqly.models import AuthSession, User

COOKIE_NAME = "rubriqly_session"
COOKIE_PATH = "/api"
# Extend a session at most this often, so every request doesn't write to the database.
REFRESH_EVERY = timedelta(hours=1)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_session(db: Session, user: User, settings: Settings) -> str:
    """Start a session and return the raw token for the cookie. Commits."""
    now = utcnow()
    token = secrets.token_urlsafe(32)
    # Tidy up this user's expired sessions while we're here.
    db.execute(
        delete(AuthSession).where(AuthSession.user_id == user.id, AuthSession.expires_at < now)
    )
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash=hash_token(token),
            created_at=now,
            last_seen_at=now,
            expires_at=now + timedelta(days=settings.session_days),
        )
    )
    db.commit()
    return token


def find_session(
    db: Session, token: str, settings: Settings, now: datetime | None = None
) -> tuple[AuthSession | None, bool]:
    """The live session for a token, and whether it was just extended. Commits if extended."""
    now = now or utcnow()
    session = db.scalars(
        select(AuthSession).where(AuthSession.token_hash == hash_token(token))
    ).one_or_none()
    if session is None or session.expires_at <= now or not session.user.is_active:
        return None, False
    if now - session.last_seen_at < REFRESH_EVERY:
        return session, False
    session.last_seen_at = now
    session.expires_at = now + timedelta(days=settings.session_days)
    db.commit()
    return session, True


def end_session(db: Session, token: str) -> None:
    db.execute(delete(AuthSession).where(AuthSession.token_hash == hash_token(token)))
    db.commit()


def end_all_sessions(db: Session, user: User, keep: AuthSession | None = None) -> None:
    query = delete(AuthSession).where(AuthSession.user_id == user.id)
    if keep is not None:
        query = query.where(AuthSession.id != keep.id)
    db.execute(query)
    db.commit()
