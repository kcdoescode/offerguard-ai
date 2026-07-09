from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="OfferGuard AI")

# Lets your Next.js frontend (localhost:3000) call this API (localhost:8000)
# without the browser blocking the request
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    raw_text: str

BAIT_PHRASES = ["comment interested", "drop your resume", "follow me for", "dm me for"]

@app.get("/")
def root():
    return {"status": "OfferGuard AI backend is running"}

@app.post("/api/analyze/text")
def analyze_text(request: AnalyzeRequest):
    text_lower = request.raw_text.lower()
    matched = [p for p in BAIT_PHRASES if p in text_lower]
    risk_score = min(100, len(matched) * 25)
    label = "Low" if risk_score < 35 else "Medium" if risk_score < 65 else "High"
    return {
        "risk_score": risk_score,
        "risk_label": label,
        "matched_phrases": matched,
    }