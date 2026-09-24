from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    """Liveness check used by the hosting provider.

    Deliberately doesn't touch the database: Render calls this often, and a query here would
    keep Neon awake around the clock and use up its free compute hours.
    """
    return {"status": "ok"}
