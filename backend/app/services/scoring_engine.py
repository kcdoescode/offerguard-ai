def compute_overall_score(engagement_score: int, scam_score: int, link_score: int) -> dict:
    # Covers 3 of the blueprint's 6 categories so far — engagement bait (20%),
    # scam pressure (25%), link/domain risk (15%) — re-weighted proportionally
    # (0.33 / 0.42 / 0.25) until official-verifier, recruiter-trust, and
    # reputation-reports exist too and the full 6-way formula can be restored.
    overall = round(0.33 * engagement_score + 0.42 * scam_score + 0.25 * link_score)
    label = "Low" if overall < 35 else "Medium" if overall < 65 else "High"
    return {"score": overall, "label": label}