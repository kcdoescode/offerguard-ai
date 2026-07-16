from app.services.semantic_matcher import text_similarity

MATCH_FOUND_THRESHOLD = 0.75
POSSIBLE_MATCH_THRESHOLD = 0.5


def verify_official_listing(job_post_text: str, official_listing_text: str | None) -> dict:
    if not official_listing_text or not official_listing_text.strip():
        return {
            "status": "CANNOT_VERIFY",
            "similarity": None,
            "score": 15,
            "message": "No official listing provided, so this couldn't be checked against a real source.",
        }

    similarity = text_similarity(job_post_text, official_listing_text)

    if similarity >= MATCH_FOUND_THRESHOLD:
        status, score = "MATCH_FOUND", 0
        message = f"Closely matches the official listing you provided (similarity {round(similarity, 2)})."
    elif similarity >= POSSIBLE_MATCH_THRESHOLD:
        status, score = "POSSIBLE_MATCH", 35
        message = f"Some overlap with the official listing, but enough differs to double-check (similarity {round(similarity, 2)})."
    else:
        status, score = "NOT_FOUND", 70
        message = f"Doesn't look like it matches the official listing you provided (similarity {round(similarity, 2)})."

    return {"status": status, "similarity": round(similarity, 2), "score": score, "message": message}