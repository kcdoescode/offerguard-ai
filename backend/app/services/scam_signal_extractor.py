PAYMENT_PATTERNS = [
    "registration fee", "refundable deposit", "security deposit",
    "processing fee", "training fee", "pay to apply", "one-time payment",
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

def extract_scam_signals(text: str) -> dict:
    text_lower = text.lower()
    payment_hits = [p for p in PAYMENT_PATTERNS if p in text_lower]
    urgency_hits = [p for p in URGENCY_PATTERNS if p in text_lower]
    off_platform_hits = [p for p in OFF_PLATFORM_PATTERNS if p in text_lower]
    identity_hits = [p for p in IDENTITY_REQUEST_PATTERNS if p in text_lower]

    # Payment asks and identity requests are the most serious — weighted higher
    score = min(100,
        len(payment_hits) * 35 +
        len(identity_hits) * 30 +
        len(urgency_hits) * 15 +
        len(off_platform_hits) * 15
    )
    matched = payment_hits + urgency_hits + off_platform_hits + identity_hits
    return {"score": score, "matched_phrases": matched}