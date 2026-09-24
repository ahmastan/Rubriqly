import copy
from decimal import Decimal

import pytest
from samples import RUBRIC

from rubriqly.jev import BooleanAnswer, EvaluateResult, ScoreAnswer
from rubriqly.scoring.compile import (
    RubricIn,
    paragraph_request,
    paragraph_role,
    rubric_questions,
)
from rubriqly.scoring.service import concentration, criterion_out, paragraph_out
from rubriqly.scoring.text import count_words, extract_title, split_paragraphs

# Same behaviour as rubriqly-frontend/src/lib/text.ts: paragraph numbers must match.


def test_count_words() -> None:
    assert count_words("  one two\nthree\t four  ") == 4
    assert count_words("   ") == 0


def test_split_paragraphs_like_the_frontend() -> None:
    text = "Title line\r\n\r\nFirst paragraph\nwraps here.\n  \n\nSecond one.\n\n\n"
    assert split_paragraphs(text) == ["Title line", "First paragraph wraps here.", "Second one."]
    assert split_paragraphs("\n\n  \n") == []


@pytest.mark.parametrize(
    ("paragraphs", "title"),
    [
        (
            ["Why the 1918 Flu Changed Public Health", "Body."],
            "Why the 1918 Flu Changed Public Health",
        ),
        (["This first line ends with a period.", "Body."], None),
        (["Only one short line"], None),
        ([" ".join(["word"] * 15), "Body."], None),
        (["Ends with a colon:", "Body."], None),
    ],
)
def test_extract_title_like_the_frontend(paragraphs: list[str], title: str | None) -> None:
    draft = extract_title(paragraphs)
    assert draft.title == title
    assert draft.paragraphs == (paragraphs[1:] if title else paragraphs)


def test_rubric_questions_never_include_tips() -> None:
    questions = rubric_questions(RubricIn.model_validate(RUBRIC))
    dumped = {key: q.model_dump() for key, q in questions.items()}
    assert dumped == {
        "criterion_0": {
            "type": "score",
            "instructions": "How clear and arguable is the thesis?",
            "criteria": ["No thesis", "Vague thesis", "Clear thesis", "Precise thesis"],
        },
        "check_0": {"type": "boolean", "instructions": "Is there a title?"},
    }
    assert "SECRET TIP" not in str(dumped)


@pytest.mark.parametrize(
    ("change", "message"),
    [
        (
            lambda r: r["criteria"][0].update(descriptors=["a", "b", "c"]),
            "one descriptor per level",
        ),
        (lambda r: r["checklist"][0].update(id="thesis"), "unique"),
        (lambda r: r.update(criteria=[]), "at least 1"),
        (lambda r: r["criteria"][0].update(id="bad id!"), "pattern"),
    ],
)
def test_rubric_validation(change, message: str) -> None:
    rubric = copy.deepcopy(RUBRIC)
    change(rubric)
    with pytest.raises(ValueError, match=message):
        RubricIn.model_validate(rubric)


def test_paragraph_questions() -> None:
    state, questions = paragraph_request("An intro.", "introduction")
    assert state == {"role": "introduction", "paragraph": "An intro."}
    assert set(questions) == {"claim", "context"}
    _, body = paragraph_request("A body paragraph.", "body paragraph")
    assert set(body) == {"claim", "evidence", "analysis"}
    _, conclusion = paragraph_request("In conclusion.", "conclusion")
    assert set(conclusion) == {"claim", "significance"}


@pytest.mark.parametrize(
    ("count", "roles"),
    [
        (1, ["introduction"]),
        (2, ["introduction", "body paragraph"]),
        (3, ["introduction", "body paragraph", "conclusion"]),
        (5, ["introduction"] + ["body paragraph"] * 3 + ["conclusion"]),
    ],
)
def test_paragraph_roles(count: int, roles: list[str]) -> None:
    assert [paragraph_role(i, count) for i in range(count)] == roles


def test_levels_become_1_based_with_their_probabilities() -> None:
    answer = ScoreAnswer(
        type="score",
        score=2.65,
        probabilities={"0": 0, "1": 0.02, "2": 0.3, "3": 0.68},
        confidence=0.65,
    )
    result = criterion_out("thesis", answer, levels=4)
    assert result.level == 3.65
    assert result.confidence == 0.65
    assert result.probabilities == [0, 0.02, 0.3, 0.68]


def test_confidence_is_worked_out_when_jev_leaves_it_out() -> None:
    answer = ScoreAnswer(type="score", score=3, probabilities={"3": 1.0})
    assert criterion_out("thesis", answer, levels=4).confidence == 1.0
    assert concentration({"0": 0.25, "1": 0.25, "2": 0.25, "3": 0.25}, 4) == 0.0
    assert 0 < concentration({"0": 0, "1": 0.02, "2": 0.3, "3": 0.68}, 4) < 1
    assert concentration({}, 4) == 0.0


def tags_result(**probabilities: float) -> EvaluateResult:
    return EvaluateResult(
        model="mock",
        answers={k: BooleanAnswer(type="boolean", probability=p) for k, p in probabilities.items()},
        input_tokens=0,
        cost_usd=Decimal(0),
        market_cost_usd=Decimal(0),
    )


def test_body_paragraph_is_weak_without_evidence_or_analysis() -> None:
    strong = paragraph_out(2, "body paragraph", tags_result(claim=0.9, evidence=0.8, analysis=0.7))
    no_analysis = paragraph_out(
        3, "body paragraph", tags_result(claim=0.9, evidence=0.8, analysis=0.2)
    )
    intro = paragraph_out(1, "introduction", tags_result(claim=0.2, context=0.1))
    conclusion = paragraph_out(4, "conclusion", tags_result(claim=0.9, significance=0.1))
    assert strong.weak is False
    assert [t.label for t in strong.tags] == ["Claim", "Evidence", "Analysis"]
    assert no_analysis.weak is True
    assert intro.weak is False  # the intro is never highlighted
    assert intro.tags[0].present is False
    assert conclusion.weak is False  # nor the conclusion, which needs no new evidence
    assert conclusion.is_conclusion is True
    assert [t.label for t in conclusion.tags] == ["Claim", "Significance"]
