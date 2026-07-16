def compute_overall_score(engagement_score: int, scam_score: int, link_score: int, official_score: int) -> dict:
    # 4 of the blueprint's 6 categories now — engagement bait (20%), scam
    # pressure (25%), link/domain risk (15%), official-source mismatch (20%)
    # — re-weighted proportionally (0.25 / 0.31 / 0.19 / 0.25) until
    # recruiter-trust and reputation-reports exist too.
    overall = round(
        0.25 * engagement_score +
        0.31 * scam_score +
        0.19 * link_score +
        0.25 * official_score
    )
    label = "Low" if overall < 35 else "Medium" if overall < 65 else "High"
    return {"score": overall, "label": label}