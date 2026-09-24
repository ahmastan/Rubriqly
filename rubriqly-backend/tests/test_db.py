from datetime import UTC, datetime, timedelta
from decimal import Decimal

import pytest
from alembic.autogenerate import compare_metadata
from alembic.migration import MigrationContext
from fastapi.testclient import TestClient
from sqlalchemy import Engine, delete, func, select
from sqlalchemy.exc import IntegrityError, StatementError
from sqlalchemy.orm import Session

from rubriqly.config import Settings
from rubriqly.db import Base
from rubriqly.main import create_app
from rubriqly.models import AuthSession, CheckUsage, User


def make_user(email: str = "test1@rubriqly.com") -> User:
    return User(email=email, password_hash="$argon2id$fake", display_name="Test Student One")


def test_migrations_match_the_models(engine: Engine) -> None:
    with engine.connect() as connection:
        differences = compare_metadata(MigrationContext.configure(connection), Base.metadata)
    assert differences == []


def test_user_defaults_and_utc_timestamps(db: Session) -> None:
    db.add(make_user())
    db.commit()
    db.expire_all()

    user = db.scalars(select(User)).one()
    assert user.id.startswith("usr_")
    assert user.is_active is True
    assert user.email_verified is False
    assert user.created_at.tzinfo is not None
    assert user.created_at.utcoffset() == timedelta(0)


def test_email_must_be_unique(db: Session) -> None:
    db.add(make_user())
    db.commit()
    db.add(make_user())
    with pytest.raises(IntegrityError):
        db.commit()


def test_email_must_be_lowercase(db: Session) -> None:
    db.add(make_user("Test1@Rubriqly.com"))
    with pytest.raises(IntegrityError):
        db.commit()


def test_check_usage_status_is_restricted(db: Session) -> None:
    user = make_user()
    db.add(user)
    db.commit()
    db.add(CheckUsage(user_id=user.id, status="maybe"))
    with pytest.raises(IntegrityError):
        db.commit()


def test_naive_timestamps_are_refused(db: Session) -> None:
    user = make_user()
    user.last_login_at = datetime(2026, 9, 23, 12, 0)  # no time zone
    db.add(user)
    with pytest.raises(StatementError, match="timezone-aware"):
        db.commit()


def test_deleting_a_user_deletes_their_sessions_and_usage_in_the_database(db: Session) -> None:
    user = make_user()
    db.add(user)
    db.flush()
    db.add(
        AuthSession(
            user_id=user.id,
            token_hash="a" * 64,
            expires_at=datetime.now(UTC) + timedelta(days=30),
        )
    )
    db.add(
        CheckUsage(user_id=user.id, status="ok", input_tokens=395, cost_usd=Decimal("0.0000166"))
    )
    db.commit()

    # A plain SQL delete, so this tests the database's ON DELETE CASCADE, not Python code.
    db.execute(delete(User).where(User.id == user.id))
    db.commit()

    assert db.scalar(select(func.count()).select_from(AuthSession)) == 0
    assert db.scalar(select(func.count()).select_from(CheckUsage)) == 0


def test_cost_keeps_small_amounts_exactly(db: Session) -> None:
    user = make_user()
    db.add(user)
    db.flush()
    db.add(CheckUsage(user_id=user.id, status="ok", cost_usd=Decimal("0.00001659")))
    db.commit()
    db.expire_all()
    assert db.scalars(select(CheckUsage.cost_usd)).one() == Decimal("0.00001659")


def test_app_starts_without_connecting_to_the_database() -> None:
    # Nothing listens on port 1: this only passes because the health check never queries.
    settings = Settings(_env_file=None, database_url="postgresql://nobody:pw@127.0.0.1:1/none")
    client = TestClient(create_app(settings))
    assert client.get("/api/health").json() == {"status": "ok"}
