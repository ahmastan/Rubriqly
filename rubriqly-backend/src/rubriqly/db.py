"""Database connection: the engine, the table base class and a request-scoped session."""

from collections.abc import Iterator
from datetime import UTC, datetime

from fastapi import Request
from sqlalchemy import DateTime, Engine, MetaData, create_engine, event
from sqlalchemy.engine import Dialect
from sqlalchemy.orm import DeclarativeBase, Session
from sqlalchemy.types import TypeDecorator

# Fixed constraint names, so migrations can refer to them on every database.
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


def utcnow() -> datetime:
    return datetime.now(UTC)


class UTCDateTime(TypeDecorator[datetime]):
    """A timestamp that is always timezone-aware UTC in Python.

    Postgres stores the time zone; SQLite doesn't, so values read back from SQLite are
    marked as UTC here. That keeps comparisons like `expires_at < utcnow()` safe on both.
    """

    impl = DateTime(timezone=True)
    cache_ok = True

    def process_bind_param(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            raise ValueError("Timestamps must be timezone-aware")
        return value.astimezone(UTC)

    def process_result_value(self, value: datetime | None, dialect: Dialect) -> datetime | None:
        if value is None:
            return None
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value.astimezone(UTC)


def make_engine(database_url: str) -> Engine:
    """Create the engine. Nothing connects until the first query."""
    if database_url.startswith("sqlite"):
        engine = create_engine(database_url, connect_args={"check_same_thread": False})

        @event.listens_for(engine, "connect")
        def _enable_foreign_keys(dbapi_connection, _record) -> None:  # type: ignore[no-untyped-def]
            # SQLite ignores ON DELETE CASCADE unless this is switched on per connection.
            dbapi_connection.execute("PRAGMA foreign_keys = ON")

        return engine
    # Neon closes idle connections when the database sleeps: test each one before use.
    return create_engine(database_url, pool_pre_ping=True, pool_recycle=300)


def get_db(request: Request) -> Iterator[Session]:
    """FastAPI dependency: one database session per request."""
    with request.app.state.sessionmaker() as session:
        yield session
