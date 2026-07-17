def compute_overall_score(
    engagement_score: int,
    scam_score: int,
    link_score: int,
    official_score: int,
    link_provided: bool,
    official_provided: bool,
    hard_scam_signal_count: int = 0,
) -> dict:
    weights = {"engagement": 0.25, "scam": 0.31, "link": 0.19, "official": 0.25}
    scores = {"engagement": engagement_score, "scam": scam_score, "link": link_score, "official": official_score}
    active = {"engagement": True, "scam": True, "link": link_provided, "official": official_provided}

    active_weight = sum(w for k, w in weights.items() if active[k])
    overall = round(sum(weights[k] * scores[k] for k in weights if active[k]) / active_weight)

    # Severity floor: a payment ask or an identity-document request is
    # disqualifying on its own — no blended average gets to call that "Low."
    # Bumping the score itself (not just the label) keeps the number and the
    # ring color honest with each other.
    if hard_scam_signal_count >= 2:
        overall = max(overall, 65)
    elif hard_scam_signal_count >= 1:
        overall = max(overall, 35)

    label = "Low" if overall < 35 else "Medium" if overall < 65 else "High"
    return {"score": overall, "label": label}