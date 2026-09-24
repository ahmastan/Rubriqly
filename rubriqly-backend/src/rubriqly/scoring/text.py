"""Splitting a draft, exactly like the frontend's `lib/text.ts`.

Paragraph numbers in results must match what the browser shows, so keep these in sync.
"""

import re
from dataclasses import dataclass

_BLANK_LINE = re.compile(r"\n\s*\n")
_LINE_BREAK = re.compile(r"\s*\n\s*")
_ENDS_LIKE_SENTENCE = re.compile(r"[.!?:;,]$")


def count_words(text: str) -> int:
    return len(text.split())


def split_paragraphs(text: str) -> list[str]:
    """Split on blank lines; single line breaks inside a paragraph become a space."""
    normalized = text.replace("\r\n", "\n").replace("\r", "\n")
    blocks = (_LINE_BREAK.sub(" ", block).strip() for block in _BLANK_LINE.split(normalized))
    return [block for block in blocks if block]


@dataclass
class Draft:
    title: str | None
    paragraphs: list[str]


def extract_title(paragraphs: list[str]) -> Draft:
    """A short first line with no closing punctuation is the draft's title."""
    if len(paragraphs) > 1:
        first = paragraphs[0]
        if count_words(first) <= 14 and not _ENDS_LIKE_SENTENCE.search(first):
            return Draft(title=first, paragraphs=paragraphs[1:])
    return Draft(title=None, paragraphs=paragraphs)
