"""FastAPI dependencies: settings, and the signed-in user."""

from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends, Request, Response
from sqlalchemy.orm import Session

from rubriqly.api.errors import api_error
from rubriqly.auth.sessions import COOKIE_NAME, COOKIE_PATH, find_session
from rubriqly.config import Settings
from rubriqly.db import get_db
from rubriqly.models import AuthSession, User


def get_app_settings(request: Request) -> Settings:
    return request.app.state.settings


def set_session_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        COOKIE_NAME,
        token,
        max_age=settings.session_days * 24 * 60 * 60,
        path=COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    response.delete_cookie(
        COOKIE_NAME,
        path=COOKIE_PATH,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )


@dataclass
class SignedIn:
    user: User
    session: AuthSession
    token: str


def require_signed_in(
    request: Request,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    settings: Annotated[Settings, Depends(get_app_settings)],
) -> SignedIn:
    """The signed-in user, or a 401. Extends the session (and cookie) while it's in use."""
    token = request.cookies.get(COOKIE_NAME)
    if token:
        session, extended = find_session(db, token, settings)
        if session is not None:
            if extended:
                set_session_cookie(response, token, settings)
            return SignedIn(user=session.user, session=session, token=token)
    raise api_error(401, "not_signed_in", "Please sign in to continue.")


DbSession = Annotated[Session, Depends(get_db)]
AppSettings = Annotated[Settings, Depends(get_app_settings)]
CurrentUser = Annotated[SignedIn, Depends(require_signed_in)]
