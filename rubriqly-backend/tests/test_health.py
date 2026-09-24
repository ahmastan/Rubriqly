from fastapi.testclient import TestClient

from rubriqly.config import Settings
from rubriqly.main import create_app


def test_health_returns_ok() -> None:
    client = TestClient(create_app(Settings(_env_file=None)))
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_cors_allows_configured_origin_only() -> None:
    client = TestClient(
        create_app(Settings(_env_file=None, allowed_origins=["http://allowed.test"]))
    )
    allowed = client.get("/api/health", headers={"Origin": "http://allowed.test"})
    blocked = client.get("/api/health", headers={"Origin": "http://evil.test"})
    assert allowed.headers.get("access-control-allow-origin") == "http://allowed.test"
    assert "access-control-allow-origin" not in blocked.headers


def test_allowed_origins_parsed_from_comma_separated_env(monkeypatch) -> None:
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://a.test, http://b.test")
    assert Settings(_env_file=None).allowed_origins == ["http://a.test", "http://b.test"]
