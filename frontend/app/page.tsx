"use client";

import { useState } from "react";

type AnalysisResult = {
  risk_score: number;
  risk_label: string;
  matched_phrases: string[];
};

export default function Home() {
  const [jobText, setJobText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/analyze/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_text: jobText }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      alert("Couldn't reach the backend. Is it running on localhost:8000?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">🛡️ OfferGuard AI</h1>
      <p className="text-slate-400 text-lg max-w-xl text-center mb-8">
        Paste a job post and get an authenticity score, risk signals, and evidence — before you apply.
      </p>
      <textarea
        className="w-full max-w-xl h-40 p-4 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
        placeholder="Paste a LinkedIn job post here..."
        value={jobText}
        onChange={(e) => setJobText(e.target.value)}
      />
      <button
        onClick={handleAnalyze}
        disabled={loading || !jobText}
        className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg font-medium transition"
      >
        {loading ? "Analyzing..." : "Analyze Job Post"}
      </button>

      {result && (
        <div className="mt-8 w-full max-w-xl p-6 rounded-lg bg-slate-900 border border-slate-700">
          <p className="text-2xl font-bold">
            Risk: {result.risk_label} ({result.risk_score}/100)
          </p>
          {result.matched_phrases.length > 0 && (
            <ul className="mt-3 text-slate-400 list-disc list-inside">
              {result.matched_phrases.map((phrase) => (
                <li key={phrase}>Found: "{phrase}"</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </main>
  );
}