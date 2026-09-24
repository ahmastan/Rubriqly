"""`POST /api/checks`: score a draft against a rubric (docs/architecture.md, "Scoring").

The draft is scored and forgotten: its text is never stored or logged. Each check leaves one
`check_usage` row (status, tokens, list-price cost) for the daily limits and `rubriqly usage`.
"""

from typing import Annotated

import anyio.from_thread
from fastapi import APIRouter, Request
from pydantic import BaseModel, StringConstraints
from sqlalchemy import func, select

from rubriqly.api.errors import api_error
from rubriqly.auth.deps import AppSettings, CurrentUser, DbSession
from rubriqly.auth.limits import start_of_utc_day
from rubriqly.db import utcnow
from rubriqly.jev import JevClient
from rubriqly.models import CheckUsage
from rubriqly.scoring.compile import RubricIn
from rubriqly.scoring.service import CheckOut, ScoringFailed, Spend, score_draft
from rubriqly.scoring.text import count_words, extract_title, split_paragraphs

router = APIRouter(tags=["checks"])


class CheckIn(BaseModel):
    rubric: RubricIn
    prompt: Annotated[str, StringConstraints(max_length=5000)] = ""
    # Generous here; the real limit is MAX_WORDS, checked below with a friendly message.
    text: Annotated[str, StringConstraints(max_length=200_000)]


def checks_today(db: DbSession, *where: object) -> int:
    today = start_of_utc_day(utcnow())
    query = select(func.count()).select_from(CheckUsage).where(CheckUsage.created_at >= today)
    return db.scalar(query.where(*where)) or 0


def record(db: DbSession, user_id: str, status: str, spend: Spend | None = None) -> None:
    spend = spend or Spend()
    db.add(
        CheckUsage(
            user_id=user_id,
            status=status,
            input_tokens=spend.input_tokens,
            cost_usd=spend.cost_usd,
        )
    )
    db.commit()


@router.post("/checks")
def create_check(
    body: CheckIn, request: Request, current: CurrentUser, db: DbSession, settings: AppSettings
) -> CheckOut:
    # Cheap checks first, before any limit is used or any money is spent.
    words = count_words(body.text)
    if words == 0:
        raise api_error(400, "empty_draft", "Paste your draft first.")
    if words > settings.max_words:
        raise api_error(
            400,
            "draft_too_long",
            f"Drafts can be up to {settings.max_words:,} words. This one has {words:,}.",
        )
    paragraphs = extract_title(split_paragraphs(body.text)).paragraphs
    if len(paragraphs) > settings.max_paragraphs:
        raise api_error(
            400,
            "too_many_paragraphs",
            f"Drafts can have up to {settings.max_paragraphs} paragraphs. "
            f"This one has {len(paragraphs)}. Check for extra blank lines.",
        )

    user = current.user
    # Only successful checks count against a student's own limit: failures aren't their fault.
    if checks_today(db, CheckUsage.user_id == user.id, CheckUsage.status == "ok") >= (
        settings.checks_per_user_per_day
    ):
        record(db, user.id, "rate_limited")
        raise api_error(
            429,
            "daily_limit_user",
            f"You've used today's {settings.checks_per_user_per_day} checks. "
            "They reset at midnight UTC.",
        )
    # Everything that reached Jev counts against the site-wide limit (it's what costs money).
    if checks_today(db, CheckUsage.status.in_(("ok", "failed"))) >= settings.checks_per_day:
        record(db, user.id, "rate_limited")
        raise api_error(
            429,
            "daily_limit_site",
            "Rubriqly has reached today's checking limit. Please try again tomorrow.",
        )

    jev: JevClient = request.app.state.jev
    try:
        check, spend = anyio.from_thread.run(
            score_draft, jev, body.rubric, body.prompt, body.text, settings.jev_max_parallel
        )
    except ScoringFailed as failed:
        record(db, user.id, "failed", failed.spend)
        raise api_error(503, f"scoring_{failed.error.kind}", failed.error.message) from None

    record(db, user.id, "ok", spend)
    return check
