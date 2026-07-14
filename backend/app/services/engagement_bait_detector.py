BAIT_PHRASES = [
    "comment interested", "drop your resume", "follow me for",
    "dm me for", "like and share", "send your details",
    "comment yes", "comment done",
]

def extract_engagement_bait(text: str) -> dict:
    text_lower = text.lower()
    matched = [p for p in BAIT_PHRASES if p in text_lower]
    score = min(100, len(matched) * 25)
    return {"score": score, "matched_phrases": matched}