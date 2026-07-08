export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">🛡️ OfferGuard AI</h1>
      <p className="text-slate-400 text-lg max-w-xl text-center mb-8">
        Paste a job post and get an authenticity score, risk signals, and evidence — before you apply.
      </p>
      <textarea
        className="w-full max-w-xl h-40 p-4 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500"
        placeholder="Paste a LinkedIn job post here..."
      />
      <button className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition">
        Analyze Job Post
      </button>
    </main>
  );
}