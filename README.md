# 🛡️ OfferGuard AI

**Know before you apply.** A full-stack tool that reads a job post and tells you what's really behind it — engagement-bait patterns, scam-pressure signals, suspicious application links, and whether the role can be verified against a real company listing — before you hand over a resume or any personal data.

Built as an advanced portfolio project: Next.js + FastAPI + a hybrid rules/AI scoring engine, running entirely on a laptop, no paid APIs.

## The problem

Fake and bait job posts are common on LinkedIn and elsewhere — posts designed to farm comments and follows, harvest resumes through unofficial forms, or pressure applicants into paying "registration fees." They're often hard to distinguish from real postings at a glance. OfferGuard AI checks a post across four independent signal categories and explains exactly why it scored the way it did — risk-based language throughout, never a direct accusation.

## Features

- **Engagement-bait detection** — catches comment/follow/DM/tag-farming patterns, both exact phrasing and reworded variants (e.g. "smash that follow button" ≈ "follow our page"), using sentence embeddings on top of keyword matching
- **Scam-pressure detection** — payment requests, urgency language, off-platform contact pushes, identity-data requests (Aadhaar, bank details, OTP), same hybrid keyword + semantic approach
- **Link & domain risk** — flags URL shorteners, missing HTTPS, and apply-link domains that don't match the claimed company
- **Official Verifier** — paste in the real listing from a company's careers page, and the post gets compared against it by meaning (not exact text), returning MATCH_FOUND / POSSIBLE_MATCH / NOT_FOUND / CANNOT_VERIFY
- Explainable scoring throughout — every score comes with the specific evidence behind it, shown as an animated risk ring plus a per-category breakdown

## Architecture
Browser (localhost:3000)
│  paste job post + optional company / link / official listing
▼
Next.js frontend ──POST /api/analyze/text──▶ FastAPI backend
│
┌───────────────┬───────────────┬────────────────────┐
▼               ▼               ▼                    ▼
engagement_bait_   scam_signal_     link_analyzer.py    official_verifier.py
detector.py        extractor.py     (URL/domain rules)  (semantic match vs.
(keywords +        (keywords +                          pasted listing)
semantic_matcher)  semantic_matcher)
└───────────────┴───────────────┴────────────────────┘
▼
scoring_engine.py blends
the 4 category scores
▼
JSON response → rendered as
the trust ring + evidence panel

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI, Pydantic, Uvicorn |
| AI / NLP | sentence-transformers (`all-MiniLM-L6-v2`), running locally on CPU |
| Detection | Hybrid: keyword/regex rules + sentence-embedding similarity |

## How the AI actually works

Two layers, not one. A keyword pass catches obvious, exact phrasing instantly and for free. On top of that, every sentence in the post is converted into a vector (via `all-MiniLM-L6-v2`) and compared by *meaning* against a small library of example phrases per risk category (`services/reference_phrases.py`). A sentence doesn't need to share a single word with the examples to be caught — "smash that follow button" and "follow our page for job alerts" land close together in that vector space because they mean the same thing. The same technique, applied to whole paragraphs instead of single sentences, powers the Official Verifier: comparing a submitted post's overall meaning against a real pasted listing rather than requiring exact text.

## Evaluation

Seven hand-picked test cases, each exercising a different part of the pipeline, run through `POST /api/analyze/text`:

| # | What it tests | Bait | Scam | Link | Official | Overall |
|---|---|---|---|---|---|---|
| 1 | Clean, legitimate post | 0 | 0 | 0 | — | **0 · Low** |
| 2 | Engagement bait, exact keywords | 50 | 0 | — | — | **22 · Low** |
| 3 | Engagement bait, reworded (AI-only catch) | * | 0 | — | — | *(fill in)* |
| 4 | Scam-pressure combo | 0 | 80 | — | — | **44 · Medium** |
| 5 | Link/domain risk (shortener + mismatch) | 0 | 0 | 65 | — | **16 · Low** |
| 6 | Official Verifier — genuine match | 0 | 0 | 0 | * (MATCH_FOUND expected) | *(fill in)* |
| 7 | Official Verifier — clear mismatch | 25 | * | — | 70 | **~29 · Low** |
| 8 | Payment ask + bait, fragmented phrasing (found via manual testing) | 25 | 35 | — | — | **35 · Medium** |

Row 8 surfaced a real bug: a payment-fee post initially scored 11/Low — the phrase
was short enough to slip both the keyword list and the semantic threshold, and the
one signal that *did* fire got diluted by categories with nothing to check. Fixed by
widening the payment keyword list, lowering the scam-pressure similarity threshold,
and adding a severity floor: any payment or identity-document request now forces
the label to at least Medium (two or more, at least High) independent of the
blended average.

— = category not evaluated (no link / no listing given), excluded from the average rather than counted as "safe."
\* = depends on the live similarity model, confirmed by running the case rather than computed by hand.

<details>
<summary>Full test inputs</summary>

**1 — Clean post**
```json
{"raw_text": "We are hiring a Frontend Developer to join our Mumbai office. 2+ years of React experience required. Apply through our official careers page.", "company_name": "Zoho", "apply_url": "https://www.zoho.com/careers/frontend-developer"}
```

**2 — Exact-keyword bait**
```json
{"raw_text": "Comment interested and drop your resume below to be considered for this opening."}
```

**3 — Reworded bait (semantic-only)**
```json
{"raw_text": "If this role interests you, smash that follow button on our page and we will reach out with next steps."}
```

**4 — Scam-pressure combo**
```json
{"raw_text": "Immediate joining required, no interview needed! Contact us on WhatsApp for details. Pay a small registration fee to confirm your seat."}
```

**5 — Link/domain risk**
```json
{"raw_text": "Exciting opportunity to join our team, apply now!", "company_name": "Infosys", "apply_url": "https://bit.ly/3xyzjob"}
```

**6 — Official Verifier, genuine match**
```json
{"raw_text": "We are hiring a Backend Software Engineer to join our Bangalore team. Experience with Python and cloud infrastructure required. Apply through our official careers portal.", "official_listing_text": "Backend Software Engineer - Bangalore. We're looking for an engineer experienced in Python and cloud infrastructure to join our growing team. Apply via the official careers portal.", "company_name": "Infosys", "apply_url": "https://apply.workday.com/infosys/job/backend-engineer-bangalore"}
```

**7 — Official Verifier, clear mismatch**
```json
{"raw_text": "Urgent hiring! Data entry work from home, earn 50000 per month, no experience needed, comment interested now!", "official_listing_text": "Backend Software Engineer - Bangalore. We're looking for an engineer experienced in Python and cloud infrastructure to join our growing team.", "company_name": "Infosys"}
```

</details>

## Known limitations

- **Scoring blends categories rather than flooring on the worst one.** A single severe signal (test 4's scam-pressure score of 80/100) can still land the *overall* label at Medium — or lower — if the other evaluated categories are clean, since categories are weight-averaged rather than "worst signal wins." This is exactly why the UI always shows per-category bars alongside the headline number — they tell the real story even when the blended score undersells one of them. A natural next step: a severity floor for specific hard signals (e.g., any request for a password, OTP, or bank PIN forces at least a High label, independent of everything else).
- **Reference phrase libraries are hand-written**, not learned from labeled data — they'll miss slang and phrasing nobody's added yet. Meant to be grown over time.
- **Official Verifier needs a pasted listing** — by design it doesn't fetch pages itself (see Safety Notes), so it can't independently confirm a role exists without one.
- **No persistence** — nothing submitted is saved, so there's no history, no cross-user duplicate-post detection, and no reputation/report aggregation yet.
- **7 test cases is a demonstration set, not a validation set** — good for showing range, not a statistically meaningful precision/recall claim.

## Safety & privacy notes

- Nothing submitted is stored anywhere — there's no database yet. Results exist only in the API response.
- No scraping, ever — every input is manually pasted by the user; nothing is fetched from LinkedIn or any other site automatically.
- Output is phrased as risk signals ("High risk signals detected"), never as a direct accusation — no company or individual is called a scammer without independent, confirmed evidence.
- This tool is a decision aid, not proof of fraud. Always independently verify a role before applying or sharing personal information.

## Run it locally

```bash
git clone https://github.com/kcdoescode/offerguard-ai.git
cd offerguard-ai
```

**Frontend** (terminal 1):
```bash
cd frontend
npm install
npm run dev
```
→ http://localhost:3000

**Backend** (terminal 2):
```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1      # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
→ http://localhost:8000/docs

## Roadmap

- [ ] Recruiter-trust scoring (manual recruiter profile fields)
- [ ] Reputation/report engine (user-submitted reports, aggregated per domain)
- [ ] Duplicate/template detection via FAISS across submitted posts
- [ ] Small supervised classifier once enough labeled examples exist
- [ ] Deployment (Vercel + a free-tier backend host)