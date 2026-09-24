"""Alembic migration runner.

The database comes from, in order:
1. a connection handed over by the tests (`config.attributes["connection"]`)
2. DATABASE_URL (the environment or rubriqly-backend/.env): Neon `dev` on your Mac,
   Neon `production` on Render
"""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import Connection

from rubriqly import models  # noqa: F401  (registers the tables on Base.metadata)
from rubriqly.config import Settings
from rubriqly.db import Base, make_engine

config = context.config
# Log progress ("Running upgrade ...") when run from the command line; tests keep their own logging.
if config.config_file_name and "connection" not in config.attributes:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata


def run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        # SQLite can't alter tables in place; batch mode rebuilds them when needed.
        render_as_batch=connection.dialect.name == "sqlite",
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connection = config.attributes.get("connection")
    if connection is not None:
        run_migrations(connection)
        return
    engine = make_engine(Settings().database_url)
    try:
        with engine.connect() as connection:
            run_migrations(connection)
    finally:
        engine.dispose()


if context.is_offline_mode():
    raise SystemExit("Offline (--sql) mode isn't used in Rubriqly; run migrations online.")
run_migrations_online()
