from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.services.engagement_bait_detector import extract_engagement_bait
from app.services.scam_signal_extractor import extract_scam_signals
from app.services.scoring_engine import compute_overall_score

app = FastAPI(title="OfferGuard AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    raw_text: str

@app.get("/")
def root():
    return {"status": "OfferGuard AI backend is running"}

@app.post("/api/analyze/text")
def analyze_text(request: AnalyzeRequest):
    bait = extract_engagement_bait(request.raw_text)
    scam = extract_scam_signals(request.raw_text)
    overall = compute_overall_score(bait["score"], scam["score"])

    return {
        "risk_score": overall["score"],
        "risk_label": overall["label"],
        "category_scores": {
            "engagement_bait": bait["score"],
            "scam_pressure": scam["score"],
        },
        "matched_phrases": bait["matched_phrases"] + scam["matched_phrases"],
    }