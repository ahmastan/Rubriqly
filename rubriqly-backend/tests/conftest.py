import os
from collections.abc import Iterator
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import Engine
from sqlalchemy.orm import Session, sessionmaker

from rubriqly.config import Settings
from rubriqly.db import make_engine
from rubriqly.main import create_app

BACKEND_DIR = Path(__file__).resolve().parents[1]


def alembic_config() -> Config:
    return Config(str(BACKEND_DIR / "alembic.ini"))


@pytest.fixture
def database_url(tmp_path: Path) -> str:
    """A throw-away database: Postgres when CI sets TEST_DATABASE_URL, otherwise a temp SQLite file.

    Never Neon: tests must not touch the dev or production data.
    """
    url = os.environ.get("TEST_DATABASE_URL") or f"sqlite:///{tmp_path / 'test.db'}"
    return Settings(_env_file=None, database_url=url).database_url


@pytest.fixture
def engine(database_url: str) -> Iterator[Engine]:
    """The database built by the real migrations, and torn down again afterwards."""
    engine = make_engine(database_url)
    config = alembic_config()
    with engine.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")
    try:
        yield engine
    finally:
        with engine.begin() as connection:
            config.attributes["connection"] = connection
            command.downgrade(config, "base")
        engine.dispose()


@pytest.fixture
def db(engine: Engine) -> Iterator[Session]:
    with sessionmaker(engine, expire_on_commit=False)() as session:
        yield session


@pytest.fixture
def settings(database_url: str) -> Settings:
    return Settings(_env_file=None, environment="test", database_url=database_url)


@pytest.fixture
def app(engine: Engine, settings: Settings) -> Iterator[FastAPI]:
    """The app on the migrated test database."""
    app = create_app(settings)
    yield app
    app.state.engine.dispose()


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    return TestClient(app)
