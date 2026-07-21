"use client";

import { useState, useEffect } from "react";

type RiskLabel = "Low" | "Medium" | "High";
type VerificationStatus = "MATCH_FOUND" | "POSSIBLE_MATCH" | "NOT_FOUND" | "CANNOT_VERIFY";

type AnalysisResult = {
  risk_score: number;
  risk_label: RiskLabel;
  category_scores: Record<string, number>;
  matched_phrases: string[];
  evidence: string[];
  verification: {
    status: VerificationStatus;
    similarity: number | null;
    message: string;
  };
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
  link_domain_risk: "Link & domain risk",
  official_mismatch: "Official-source mismatch",
};

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  MATCH_FOUND: "Verified",
  POSSIBLE_MATCH: "Partial match",
  NOT_FOUND: "Not found",
  CANNOT_VERIFY: "Unverified",
};

const VERIFICATION_BG: Record<VerificationStatus, string> = {
  MATCH_FOUND: "var(--sage-soft)",
  POSSIBLE_MATCH: "var(--honey-soft)",
  NOT_FOUND: "var(--rose-soft)",
  CANNOT_VERIFY: "var(--surface)",
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

function buildSecondOpinionPrompt(
  jobText: string,
  companyName: string,
  applyUrl: string,
  result: AnalysisResult
): string {
  const lines: string[] = [];
  lines.push(
    "I'm evaluating whether a job posting is legitimate or a scam/engagement-bait post. Please give me your honest, direct assessment - I'd rather hear that something looks off than be reassured unnecessarily."
  );
  lines.push("");
  lines.push("JOB POST:");
  lines.push('"""');
  lines.push(jobText);
  lines.push('"""');
  if (companyName || applyUrl) {
    lines.push("");
    if (companyName) lines.push("Claimed company: " + companyName);
    if (applyUrl) lines.push("Apply link given: " + applyUrl);
  }
  lines.push("");
  lines.push(
    "An automated screening tool (OfferGuard AI) already checked this and flagged the following - feel free to agree, disagree, or add anything it may have missed:"
  );
  lines.push("- Overall: " + result.risk_label + " risk (" + result.risk_score + "/100)");
  Object.entries(result.category_scores).forEach(([key, value]) => {
    lines.push("- " + (CATEGORY_LABEL[key] ?? key) + ": " + value + "/100");
  });
  if (result.matched_phrases.length > 0) {
    lines.push("- Flagged phrases: " + result.matched_phrases.join("; "));
  }
  if (result.evidence.length > 0) {
    lines.push("- Link/domain notes: " + result.evidence.join("; "));
  }
  lines.push("");
  lines.push("Please answer:");
  lines.push("1. Does this look like a genuine job posting? Why or why not?");
  lines.push(
    "2. Any red flags the automated tool might have missed - unrealistic salary, vague company details, pressure tactics, requests for personal or financial information?"
  );
  lines.push("3. What would you do before applying or sharing any personal information here?");
  return lines.join("\n");
}

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
  const [companyName, setCompanyName] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [officialListingText, setOfficialListingText] = useState("");
  const [showVerifier, setShowVerifier] = useState(false);
  const [showSecondOpinion, setShowSecondOpinion] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);
    setShowSecondOpinion(false);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze/text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: jobText,
          apply_url: applyUrl || null,
          company_name: companyName || null,
          official_listing_text: officialListingText || null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Couldn't reach the backend - make sure FastAPI is running on localhost:8000.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyPrompt(promptText: string) {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be blocked in some browser contexts - the textarea
      // below still has the full text, ready to select and copy manually
    }
  }

  const secondOpinionPrompt = result ? buildSecondOpinionPrompt(jobText, companyName, applyUrl, result) : "";

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
          className="relative rounded-3xl p-2 mb-3"
          style={{ background: "var(--surface)", border: "1px solid var(--line)", boxShadow: "0 1px 2px rgba(54,50,40,0.04), 0 16px 32px rgba(54,50,40,0.06)" }}
        >
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            placeholder="Paste a LinkedIn job post here..."
            rows={6}
            className="oga-input w-full resize-none rounded-2xl px-5 py-4 bg-transparent"
          />
          {loading && (
            <div className="absolute inset-x-2 top-2 bottom-2 rounded-2xl overflow-hidden pointer-events-none">
              <div className="scan-sweep-line" />
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company name (optional)"
            className="oga-input flex-1 rounded-xl px-4 py-2.5 text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          />
          <input
            type="text"
            value={applyUrl}
            onChange={(e) => setApplyUrl(e.target.value)}
            placeholder="Apply link (optional)"
            className="oga-input flex-1 rounded-xl px-4 py-2.5 text-sm"
            style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
          />
        </div>

        {!showVerifier ? (
          <button
            type="button"
            onClick={() => setShowVerifier(true)}
            className="text-sm mb-4 underline underline-offset-2"
            style={{ color: "var(--sage-deep)" }}
          >
            + Check against the real listing (optional)
          </button>
        ) : (
          <div className="mb-4">
            <label className="text-xs mb-1 block" style={{ color: "var(--ink-soft)" }}>
              Paste the listing from the company&apos;s actual careers page
            </label>
            <textarea
              value={officialListingText}
              onChange={(e) => setOfficialListingText(e.target.value)}
              placeholder="Paste the official job listing text here..."
              rows={4}
              className="oga-input w-full resize-none rounded-xl px-4 py-3 text-sm"
              style={{ background: "var(--surface)", border: "1px solid var(--line)" }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4 mb-2">
          <button
            onClick={handleAnalyze}
            disabled={loading || !jobText.trim()}
            className="px-6 py-2.5 rounded-full font-medium text-white transition hover:brightness-105 active:brightness-95 disabled:opacity-40"
            style={{ background: "var(--sage-deep)" }}
          >
            {loading ? "Reading..." : "Check this post"}
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
            <div className="flex-1 min-w-0 w-full">
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

              {result.verification && (
                <div
                  className="mb-4 rounded-xl px-4 py-3 text-sm text-center sm:text-left"
                  style={{ background: VERIFICATION_BG[result.verification.status], border: "1px solid var(--line)" }}
                >
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}>
                    {VERIFICATION_LABEL[result.verification.status]}
                  </span>
                  <span style={{ color: "var(--ink-soft)" }}> - {result.verification.message}</span>
                </div>
              )}

              {result.evidence.length > 0 && (
                <ul className="text-sm mb-3 space-y-1 list-disc list-inside" style={{ color: "var(--ink-soft)" }}>
                  {result.evidence.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}

              {result.matched_phrases.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start mb-1">
                  {result.matched_phrases.map((phrase) => (
                    <span key={phrase} className="text-xs px-3 py-1 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--line)" }}>
                      "{phrase}"
                    </span>
                  ))}
                </div>
              )}

              {!showSecondOpinion ? (
                <button
                  type="button"
                  onClick={() => setShowSecondOpinion(true)}
                  className="text-sm mt-4 underline underline-offset-2"
                  style={{ color: "var(--sage-deep)" }}
                >
                  Still not sure? Get a second opinion
                </button>
              ) : (
                <div className="mt-5 pt-5" style={{ borderTop: "1px solid var(--line)" }}>
                  <p className="text-sm mb-2" style={{ color: "var(--ink-soft)" }}>
                    This includes what OfferGuard found so far. Copy it, then paste it into any AI chat - nothing is sent automatically.
                  </p>
                  <textarea
                    readOnly
                    value={secondOpinionPrompt}
                    rows={6}
                    onClick={(e) => e.currentTarget.select()}
                    className="oga-input w-full resize-none rounded-xl px-4 py-3 text-xs mb-3"
                    style={{ background: "var(--surface)", border: "1px solid var(--line)", color: "var(--ink-soft)" }}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyPrompt(secondOpinionPrompt)}
                      className="px-4 py-2 rounded-full text-sm font-medium text-white transition hover:brightness-105"
                      style={{ background: "var(--sage-deep)" }}
                    >
                      {copied ? "Copied!" : "Copy prompt"}
                    </button>
                    
                      <a href="https://chatgpt.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-sm"
                      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
                    >
                      Open ChatGPT
                    </a>
                    
                     <a href="https://claude.ai/new"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-sm"
                      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
                    >
                      Open Claude
                    </a>
                    
                     <a href="https://gemini.google.com/app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 rounded-full text-sm"
                      style={{ border: "1px solid var(--line)", background: "var(--surface)" }}
                    >
                      Open Gemini
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}