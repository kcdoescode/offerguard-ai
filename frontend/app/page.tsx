"use client";

import { useState, useEffect } from "react";

type RiskLabel = "Low" | "Medium" | "High";

type AnalysisResult = {
  risk_score: number;
  risk_label: RiskLabel;
  category_scores: Record<string, number>;
  matched_phrases: string[];
};

const TIER_COLOR: Record<RiskLabel, string> = {
  Low: "var(--sage)",
  Medium: "var(--honey)",
  High: "var(--rose)",
};

function tierFromScore(score: number): RiskLabel {
  if (score < 35) return "Low";
  if (score < 65) return "Medium";
  return "High";
}

const CATEGORY_LABEL: Record<string, string> = {
  engagement_bait: "Engagement bait",
  scam_pressure: "Scam pressure",
};

const TIER_SOFT: Record<RiskLabel, string> = {
  Low: "var(--sage-soft)",
  Medium: "var(--honey-soft)",
  High: "var(--rose-soft)",
};

const TIER_NOTE: Record<RiskLabel, string> = {
  Low: "Nothing in our checklist stood out. Still worth verifying the company yourself.",
  Medium: "A couple of patterns showed up that are worth a second look.",
  High: "Several patterns common in bait or scam posts showed up here.",
};

function ShieldMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2.5c2.6 1.6 5 2.2 7.5 2.3.3 5.9-1.6 11.2-7.5 14.2C6.1 16 4.2 10.7 4.5 4.8c2.5-.1 4.9-.7 7.5-2.3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 12.2l2.3 2.3L15.8 9.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustRing({ score, tier }: { score: number; tier: RiskLabel }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    setAnimated(0);
    const t = setTimeout(() => setAnimated(score), 80);
    return () => clearTimeout(t);
  }, [score]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;

  return (
    <svg width="132" height="132" viewBox="0 0 132 132" className="shrink-0">
      <circle cx="66" cy="66" r={radius} fill="none" stroke="var(--line)" strokeWidth="11" />
      <circle
        cx="66"
        cy="66"
        r={radius}
        fill="none"
        stroke={TIER_COLOR[tier]}
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 66 66)"
        style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1), stroke .3s" }}
      />
      <text x="66" y="62" textAnchor="middle" style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 600, fill: "var(--ink)" }}>
        {score}
      </text>
      <text x="66" y="82" textAnchor="middle" style={{ fontFamily: "var(--font-body)", fontSize: 11, fill: "var(--ink-soft)" }}>
        out of 100
      </text>
    </svg>
  );
}

export default function Home() {
  const [jobText, setJobText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("http://localhost:8000/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: jobText }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't reach the backend — make sure FastAPI is running on localhost:8000.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <div className="flex items-center gap-2 mb-14" style={{ color: "var(--sage-deep)" }}>
          <ShieldMark className="w-5 h-5" />
          <span className="text-sm font-medium tracking-wide">OfferGuard AI</span>
        </div>

        <h1 className="text-4xl md:text-5xl leading-tight mb-4" style={{ fontFamily: "var(--font-display)", fontWeight: 500 }}>
          Know before you <em style={{ color: "var(--sage-deep)", fontStyle: "italic" }}>apply</em>.
        </h1>
        <p className="text-lg mb-10 max-w-md" style={{ color: "var(--ink-soft)" }}>
          Paste any job post and see what's really behind it, before you hand over a resume.
        </p>

        <div
          className="relative rounded-3xl p-2 mb-4"
          style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 1px 2px rgba(54,50,40,0.04), 0 16px 32px rgba(54,50,40,0.06)" }}
        >
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste a LinkedIn job post here…"
            rows={6}
            className="oga-input w-full resize-none rounded-2xl px-5 py-4 bg-transparent"
          />
          {loading && (
            <div className="absolute inset-x-2 top-2 bottom-2 rounded-2xl overflow-hidden pointer-events-none">
              <div className="scan-sweep-line" />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || !jobText.trim()}
            className="px-6 py-2.5 rounded-full font-medium text-white transition hover:brightness-105 active:brightness-95 disabled:opacity-40"
            style={{ background: "var(--sage-deep)" }}
          >
            {loading ? "Reading…" : "Check this post"}
          </button>
          <span className="text-xs" style={{ color: "var(--ink-soft)" }}>
            Takes a couple seconds. Nothing you paste is stored.
          </span>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl px-5 py-4 text-sm fade-up" style={{ background: "var(--rose-soft)", border: "1px solid var(--rose)" }}>
            {error}
          </div>
        )}

        {result && (
          <div
            className="mt-8 rounded-3xl p-7 flex flex-col sm:flex-row gap-6 items-center sm:items-start fade-up"
            style={{ background: TIER_SOFT[result.risk_label], border: "1px solid var(--line)" }}
          >
            <TrustRing score={result.risk_score} tier={result.risk_label} />
            <div className="flex-1 min-w-0">
              <p className="text-xl mb-1 flex items-center gap-2 justify-center sm:justify-start" style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: TIER_COLOR[result.risk_label] }} />
                {result.risk_label} risk
              </p>
              <p className="text-sm mb-4 text-center sm:text-left" style={{ color: "var(--ink-soft)" }}>
                {TIER_NOTE[result.risk_label]}
              </p>

              <div className="mb-4 space-y-2">
                {Object.entries(result.category_scores).map(([key, value]) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: "var(--ink-soft)" }}>
                      <span>{CATEGORY_LABEL[key] ?? key}</span>
                      <span>{value}/100</span>
                    </div>
                    <div className="h-1.5 rounded-full" style={{ background: "var(--line)" }}>
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${value}%`, background: TIER_COLOR[tierFromScore(value)] }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {result.matched_phrases.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  {result.matched_phrases.map((phrase) => (
                    <span key={phrase} className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                      "{phrase}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}