from app.services.semantic_matcher import best_semantic_matches
from app.services.reference_phrases import SCAM_PRESSURE_EXAMPLES

PAYMENT_PATTERNS = [
    "registration fee", "refundable deposit", "security deposit",
    "processing fee", "training fee", "pay to apply", "one-time payment",
    "pay fee", "small fee", "nominal fee", "applicable fee", "deposit required",
]

URGENCY_PATTERNS = [
    "immediate joining", "limited seats", "apply within 24 hours",
    "hurry up", "only few slots left", "urgent requirement", "joining today",
]

OFF_PLATFORM_PATTERNS = [
    "whatsapp", "telegram", "contact us on", "personal gmail",
    "call this number", "dm your number",
]

IDENTITY_REQUEST_PATTERNS = [
    "aadhaar", "pan card", "bank account number",
    "share your password", "otp", "upi pin",
]

ALL_KEYWORD_PATTERNS = PAYMENT_PATTERNS + URGENCY_PATTERNS + OFF_PLATFORM_PATTERNS + IDENTITY_REQUEST_PATTERNS


def extract_scam_signals(text: str) -> dict:
    text_lower = text.lower()
    payment_hits = [p for p in PAYMENT_PATTERNS if p in text_lower]
    urgency_hits = [p for p in URGENCY_PATTERNS if p in text_lower]
    off_platform_hits = [p for p in OFF_PLATFORM_PATTERNS if p in text_lower]
    identity_hits = [p for p in IDENTITY_REQUEST_PATTERNS if p in text_lower]

    keyword_score = min(100,
        len(payment_hits) * 35 + len(identity_hits) * 30 +
        len(urgency_hits) * 15 + len(off_platform_hits) * 15
    )
    keyword_matched = payment_hits + urgency_hits + off_platform_hits + identity_hits

    # Lower threshold than engagement-bait (0.55) — scam signals are the
    # safety-critical category, worth catching more borderline phrasing
    # even at the cost of an occasional false positive
    semantic_hits = best_semantic_matches(text, SCAM_PRESSURE_EXAMPLES, threshold=0.45)
    new_semantic_hits = [
        h for h in semantic_hits if not any(kw in h["sentence"].lower() for kw in ALL_KEYWORD_PATTERNS)
    ]
    semantic_phrases = [
        f'"{h["sentence"]}" — reads like known scam-pressure phrasing (similarity {h["similarity"]})'
        for h in new_semantic_hits
    ]

    score = min(100, keyword_score + len(new_semantic_hits) * 20)
    # Payment and identity-document requests are the two most serious sub-
    # categories — this count feeds the severity floor in scoring_engine.py
    hard_signal_count = len(payment_hits) + len(identity_hits)
    return {"score": score, "matched_phrases": keyword_matched + semantic_phrases, "hard_signal_count": hard_signal_count}