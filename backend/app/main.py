from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.engagement_bait_detector import extract_engagement_bait
from app.services.scam_signal_extractor import extract_scam_signals
from app.services.link_analyzer import analyze_link
from app.services.official_verifier import verify_official_listing
from app.services.scoring_engine import compute_overall_score

app = FastAPI(title="OfferGuard AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://offerguard-ai.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    raw_text: str
    apply_url: str | None = None
    company_name: str | None = None
    official_listing_text: str | None = None


@app.get("/")
def root():
    return {"status": "OfferGuard AI backend is running"}


@app.post("/api/analyze/text")
def analyze_text(request: AnalyzeRequest):
    bait = extract_engagement_bait(request.raw_text)
    scam = extract_scam_signals(request.raw_text)
    verification = verify_official_listing(request.raw_text, request.official_listing_text)
    link = analyze_link(
        request.apply_url or "",
        request.company_name,
        skip_domain_check=(verification["status"] == "MATCH_FOUND"),
    )
    overall = compute_overall_score(
        bait["score"],
        scam["score"],
        link["score"],
        verification["score"],
        link_provided=bool(request.apply_url),
        official_provided=bool(request.official_listing_text),
        hard_scam_signal_count=scam["hard_signal_count"],
    )

    return {
        "risk_score": overall["score"],
        "risk_label": overall["label"],
        "category_scores": {
            "engagement_bait": bait["score"],
            "scam_pressure": scam["score"],
            "link_domain_risk": link["score"],
            "official_mismatch": verification["score"],
        },
        "matched_phrases": bait["matched_phrases"] + scam["matched_phrases"],
        "evidence": link["evidence"],
        "verification": {
            "status": verification["status"],
            "similarity": verification["similarity"],
            "message": verification["message"],
        },
    }