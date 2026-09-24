from fastapi import HTTPException


def api_error(status: int, code: str, message: str) -> HTTPException:
    """An error the frontend can act on (`code`) and show as-is (`message`)."""
    return HTTPException(status_code=status, detail={"code": code, "message": message})
