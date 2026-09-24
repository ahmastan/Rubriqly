"""Sample data shared by the tests. Original, made-up content."""

RUBRIC = {
    "id": "argumentative-essay",
    "version": 2,
    "title": "Argumentative essay",
    "source": "builtin",
    "levels": ["Beginning", "Developing", "Proficient", "Exemplary"],
    "criteria": [
        {
            "id": "thesis",
            "name": "Thesis",
            "type": "score",
            "weight": 2,
            "question": "How clear and arguable is the thesis?",
            "descriptors": ["No thesis", "Vague thesis", "Clear thesis", "Precise thesis"],
            "tips": ["SECRET TIP 1", "SECRET TIP 2", "SECRET TIP 3", "SECRET TIP 4"],
        }
    ],
    "checklist": [{"id": "has-title", "name": "Has a title", "question": "Is there a title?"}],
    "summaries": {"thesis": "clear, arguable"},
}
