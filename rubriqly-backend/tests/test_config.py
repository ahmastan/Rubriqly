import pytest
from pydantic import ValidationError

from rubriqly.config import Settings

# `_env_file=None` keeps a developer's real .env file out of these tests.


def test_defaults_are_safe_for_development() -> None:
    settings = Settings(_env_file=None)
    assert settings.jev_mode == "mock"
    assert settings.jev_model == "typesafe-ai/jev"
    assert settings.jev_base_url == "https://ai-gateway.vercel.sh/v1"
    assert settings.checks_per_user_per_day == 30
    assert settings.checks_per_day == 500


@pytest.mark.parametrize(
    ("given", "expected"),
    [
        (
            "postgresql://user:pw@ep-x.neon.tech/neondb?sslmode=require",
            "postgresql+psycopg://user:pw@ep-x.neon.tech/neondb?sslmode=require",
        ),
        ("postgres://user:pw@host/db", "postgresql+psycopg://user:pw@host/db"),
        ("postgresql+psycopg://user:pw@host/db", "postgresql+psycopg://user:pw@host/db"),
        ("  sqlite:///./rubriqly.db ", "sqlite:///./rubriqly.db"),
    ],
)
def test_database_url_accepts_neon_string_as_pasted(given: str, expected: str) -> None:
    assert Settings(_env_file=None, database_url=given).database_url == expected


def test_live_mode_requires_api_key() -> None:
    with pytest.raises(ValidationError, match="AI_GATEWAY_API_KEY"):
        Settings(_env_file=None, jev_mode="live")
    assert Settings(_env_file=None, jev_mode="live", ai_gateway_api_key="key").jev_mode == "live"


NEON = "postgresql://user:pw@ep-x.neon.tech/neondb?sslmode=require"


def test_production_requires_real_secret_key() -> None:
    with pytest.raises(ValidationError, match="SECRET_KEY"):
        Settings(_env_file=None, environment="production", database_url=NEON)
    settings = Settings(
        _env_file=None, environment="production", secret_key="x" * 48, database_url=NEON
    )
    assert settings.environment == "production"


def test_production_refuses_to_run_without_the_real_database() -> None:
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(_env_file=None, environment="production", secret_key="x" * 48)


def test_limits_must_be_positive() -> None:
    with pytest.raises(ValidationError):
        Settings(_env_file=None, checks_per_day=0)


def test_limits_read_from_environment(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("CHECKS_PER_USER_PER_DAY", "10")
    monkeypatch.setenv("MAX_WORDS", "5000")
    settings = Settings(_env_file=None)
    assert settings.checks_per_user_per_day == 10
    assert settings.max_words == 5000


def test_secrets_are_hidden_when_printed() -> None:
    settings = Settings(_env_file=None, ai_gateway_api_key="super-secret")
    assert "super-secret" not in repr(settings)
