from app.services.semantic_matcher import best_semantic_matches
from app.services.reference_phrases import ENGAGEMENT_BAIT_EXAMPLES

BAIT_PHRASES = [
    "comment interested", "drop your resume", "follow me for",
    "dm me for", "like and share", "send your details",
    "comment yes", "comment done",
]


def extract_engagement_bait(text: str) -> dict:
    text_lower = text.lower()
    keyword_hits = [p for p in BAIT_PHRASES if p in text_lower]

    semantic_hits = best_semantic_matches(text, ENGAGEMENT_BAIT_EXAMPLES)
    # Skip semantic hits that just restate something the keyword list already
    # caught, so the same line isn't counted twice
    new_semantic_hits = [
        h for h in semantic_hits if not any(kw in h["sentence"].lower() for kw in BAIT_PHRASES)
    ]
    semantic_phrases = [
        f'"{h["sentence"]}" — reads like known bait phrasing (similarity {h["similarity"]})'
        for h in new_semantic_hits
    ]

    total_hits = len(keyword_hits) + len(new_semantic_hits)
    score = min(100, total_hits * 25)
    return {"score": score, "matched_phrases": keyword_hits + semantic_phrases}