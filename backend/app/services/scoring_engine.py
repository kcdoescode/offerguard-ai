def compute_overall_score(engagement_score: int, scam_score: int) -> dict:
    # The blueprint's full formula also weighs in official-source mismatch,
    # link/domain risk, recruiter credibility, and reputation reports — all 0
    # for now, since we haven't built those yet. Until they exist, we weight
    # only these two, roughly matching the blueprint's ratio (bait 20% : scam 25%).
    overall = round(0.45 * engagement_score + 0.55 * scam_score)
    label = "Low" if overall < 35 else "Medium" if overall < 65 else "High"
    return {"score": overall, "label": label}