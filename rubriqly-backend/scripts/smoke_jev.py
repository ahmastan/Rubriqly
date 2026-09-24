"""Score one sample essay with the REAL Jev, to check results before or after a change.

⚠️ Costs money (about $0.0001 per run at list price). Without --yes it only shows what it would
send. Uses AI_GATEWAY_API_KEY from rubriqly-backend/.env; JEV_MODE in .env is not changed.
Doesn't touch the database.

    uv run python scripts/smoke_jev.py                 # dry run: shows the requests, free
    uv run python scripts/smoke_jev.py --yes           # real run
    uv run python scripts/smoke_jev.py --yes --rubric lab-report --text my_draft.txt
"""

import argparse
import asyncio
import json
import subprocess
import sys
from collections.abc import Mapping
from decimal import Decimal
from pathlib import Path

from rubriqly.config import Settings
from rubriqly.jev import EvaluateResult, GatewayJevClient, Question, State
from rubriqly.scoring.compile import (
    RubricIn,
    draft_state,
    paragraph_request,
    paragraph_role,
    rubric_questions,
)
from rubriqly.scoring.service import score_draft
from rubriqly.scoring.text import extract_title, split_paragraphs

FRONTEND_RUBRICS = (
    Path(__file__).resolve().parents[2] / "rubriqly-frontend/src/lib/starterRubrics.ts"
)
CONFIDENCE_THRESHOLD = 0.6  # same as the frontend's lib/scoring.ts

SAMPLE_PROMPT = "Did the printing press change Europe? Take a position and support it."
# Original example essay, written for this test. Paragraph 3 has evidence but little analysis,
# and paragraph 4 has almost no evidence, to see whether the tags notice.
SAMPLE_DRAFT = "\n\n".join(
    [
        "How Cheap Books Rewired Europe",
        (
            "This is an example essay written to test Rubriqly. The printing press changed Europe "
            "because it made books cheap enough for ordinary people to own, and cheap books spread "
            "new ideas faster than any authority could control them."
        ),
        (
            "Before Gutenberg's press in the 1450s, a single book could take a scribe months to "
            "copy. Within fifty years, presses in more than two hundred towns had produced millions"
            " of copies. This shows that the press did not just speed up copying; it changed who "
            "could afford to read, which meant arguments no longer had to pass through a small "
            "group of scholars."
        ),
        (
            "Martin Luther's writings are a clear example. His pamphlets were printed in large "
            "numbers in the 1520s and sold across the German states."
        ),
        (
            "Some people also started reading more for fun, and there were many different kinds of "
            "books. Printing was important in lots of ways and it affected many parts of life."
        ),
        (
            "In conclusion, the printing press changed Europe because it put ideas into many more "
            "hands. Once readers could compare arguments for themselves, it became much harder for "
            "any single institution to decide what people believed."
        ),
    ]
)


def load_rubric(rubric_id: str) -> dict:
    script = (
        f"import({json.dumps(FRONTEND_RUBRICS.as_uri())})"
        ".then(m => console.log(JSON.stringify(m.STARTER_RUBRICS)))"
    )
    output = subprocess.run(
        ["node", "-e", script], check=True, capture_output=True, text=True
    ).stdout
    rubrics = {r["id"]: r for r in json.loads(output)}
    if rubric_id not in rubrics:
        sys.exit(f"No built-in rubric {rubric_id!r}. Choose from: {', '.join(rubrics)}")
    return rubrics[rubric_id]


class Recording:
    """Wraps the real client to add up what each request cost."""

    def __init__(self, inner: GatewayJevClient) -> None:
        self.inner = inner
        self.results: list[EvaluateResult] = []

    async def evaluate(self, state: State, questions: Mapping[str, Question]) -> EvaluateResult:
        result = await self.inner.evaluate(state, questions)
        self.results.append(result)
        return result

    async def aclose(self) -> None:
        await self.inner.aclose()


def dry_run(rubric: RubricIn, prompt: str, text: str) -> None:
    paragraphs = extract_title(split_paragraphs(text)).paragraphs
    print("DRY RUN: nothing sent, nothing spent. Add --yes to run it for real.\n")
    print(f"Request 1 (whole draft): {len(rubric_questions(rubric))} questions")
    print(json.dumps(draft_state(prompt, text), indent=2)[:300] + " ...")
    for index, paragraph in enumerate(paragraphs):
        _, questions = paragraph_request(paragraph, paragraph_role(index, len(paragraphs)))
        print(f"Request {index + 2} (¶{index + 1}): {', '.join(questions)}")
    print(f"\n{1 + len(paragraphs)} requests in total.")


async def real_run(
    settings: Settings, raw_rubric: dict, rubric: RubricIn, prompt: str, text: str
) -> None:
    client = Recording(GatewayJevClient(settings))
    try:
        check, spend = await score_draft(client, rubric, prompt, text, settings.jev_max_parallel)
    finally:
        await client.aclose()

    levels = rubric.levels
    names = {c["id"]: c["name"] for c in raw_rubric["criteria"]}
    print(f"Model: {check.model}   Words: {check.word_count}   Title: {check.title!r}\n")
    print("CRITERIA (estimated level, not a grade)")
    for criterion in check.criteria:
        rounded = min(len(levels), max(1, round(criterion.level)))
        flag = (
            "  ⚠ low confidence: check this yourself"
            if criterion.confidence < CONFIDENCE_THRESHOLD
            else ""
        )
        spread = " ".join(f"{p:.2f}" for p in criterion.probabilities)
        print(
            f"  {names[criterion.id]:<14} {criterion.level:>4.2f} → {levels[rounded - 1]:<11}"
            f" confidence {criterion.confidence:.2f}  [{spread}]{flag}"
        )
    print("\nCHECKLIST")
    items = {i["id"]: i["name"] for i in raw_rubric["checklist"]}
    for item in check.checklist:
        mark = "✓" if item.probability >= 0.5 else "✗"
        print(f"  {mark} {items[item.id]:<45} yes {item.probability:.2f}")
    print("\nPARAGRAPHS")
    paragraphs = extract_title(split_paragraphs(text)).paragraphs
    for paragraph in check.paragraphs:
        tags = "  ".join(
            f"{'✓' if t.present else '✗'}{t.label} {t.probability:.2f}" for t in paragraph.tags
        )
        weak = "  ← weak" if paragraph.weak else ""
        preview = paragraphs[paragraph.n - 1][:48]
        print(f"  ¶{paragraph.n} {preview!r:<52} {tags}{weak}")

    charged = sum((r.cost_usd for r in client.results), Decimal(0))
    print(
        f"\n{len(client.results)} requests, {spend.input_tokens} input tokens, "
        f"list price ${spend.cost_usd:.6f}, charged ${charged:.6f}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument("--yes", action="store_true", help="really call Jev (costs money)")
    parser.add_argument("--rubric", default="argumentative-essay", help="built-in rubric id")
    parser.add_argument("--text", type=Path, help="a draft file (default: the sample essay)")
    parser.add_argument("--prompt", default=None, help="the assignment prompt")
    args = parser.parse_args()

    raw_rubric = load_rubric(args.rubric)
    rubric = RubricIn.model_validate(raw_rubric)
    text = args.text.read_text() if args.text else SAMPLE_DRAFT
    prompt = args.prompt if args.prompt is not None else ("" if args.text else SAMPLE_PROMPT)

    if not args.yes:
        dry_run(rubric, prompt, text)
        return
    settings = Settings()
    if not settings.ai_gateway_api_key.get_secret_value():
        sys.exit("AI_GATEWAY_API_KEY is empty in rubriqly-backend/.env")
    settings = settings.model_copy(update={"jev_mode": "live"})
    asyncio.run(real_run(settings, raw_rubric, rubric, prompt, text))


if __name__ == "__main__":
    main()
