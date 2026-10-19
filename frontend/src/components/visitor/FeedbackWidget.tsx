import { useEffect, useState } from "react";
import { ThumbsUp, ThumbsDown, Check } from "lucide-react";

interface Summary {
  up: number;
  down: number;
  comments: { id: number; rating: number; comment: string | null; createdAt: string }[];
}

export function FeedbackWidget({ publicId }: { publicId: string }) {
  const storageKey = `sg-feedback-${publicId}`;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try { if (localStorage.getItem(storageKey)) setDone(true); } catch {}
    fetch(`/api/v1/public/artefacts/${publicId}/feedback`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSummary(d))
      .catch(() => {});
  }, [publicId, storageKey]);

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/v1/public/artefacts/${publicId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      if (!res.ok) throw new Error();
      try { localStorage.setItem(storageKey, "1"); } catch {}
      setDone(true);
    } catch {
      setError("Could not send feedback. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const total = (summary?.up ?? 0) + (summary?.down ?? 0);

  const pct = total > 0 ? Math.round(((summary?.up ?? 0) / total) * 100) : 0;

  return (
    <section
      className="mt-14 overflow-hidden rounded-3xl border bg-white p-6 sm:p-8"
      style={{ borderColor: "var(--sg-line)" }}
      aria-labelledby="feedback-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="sg-eyebrow text-[10px]" style={{ color: "var(--sg-gold-deep)" }}>Your thoughts</p>
          <h2 id="feedback-heading" className="mt-1.5 font-display text-2xl font-bold text-stone-900">
            {done ? "Thank you!" : "Was this guide helpful?"}
          </h2>
        </div>
        {total > 0 && (
          <div className="text-right">
            <p className="font-display text-3xl font-bold text-stone-900">{pct}%</p>
            <p className="text-xs text-stone-500">of {total} visitors liked it</p>
          </div>
        )}
      </div>

      {done ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-stone-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: "rgba(201,160,74,0.15)" }}>
            <Check className="h-3.5 w-3.5" style={{ color: "#9A7424" }} />
          </span>
          Your feedback helps our curators improve every guide.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="flex gap-3">
            {([1, -1] as const).map((v) => {
              const on = rating === v;
              return (
                <button
                  key={v}
                  onClick={() => setRating(v)}
                  aria-pressed={on}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition-all active:scale-[0.98]"
                  style={{
                    borderColor: on ? "#C9A04A" : "var(--sg-line)",
                    background: on ? "linear-gradient(135deg, rgba(240,213,143,0.35), rgba(201,160,74,0.18))" : "#FBFAF7",
                    color: on ? "#6F5317" : "#57534E",
                    boxShadow: on ? "0 10px 24px -14px rgba(201,160,74,0.9)" : "none",
                  }}
                >
                  {v === 1 ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                  {v === 1 ? "Yes, loved it" : "Not really"}
                </button>
              );
            })}
          </div>
          {rating && (
            <div className="sg-reveal space-y-3">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                rows={3}
                placeholder={rating === 1 ? "What did you enjoy? (optional)" : "What could be better? (optional)"}
                className="w-full rounded-2xl border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A04A]/40"
                style={{ borderColor: "var(--sg-line)", background: "#FBFAF7" }}
              />
              <button onClick={submit} disabled={busy} className="sg-btn-gold w-full disabled:opacity-60 sm:w-auto">
                {busy ? "Sending…" : "Send feedback"}
              </button>
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>
          )}
        </div>
      )}

      {summary && summary.comments.length > 0 && (
        <ul className="mt-6 space-y-3 border-t pt-6" style={{ borderColor: "var(--sg-line)" }}>
          {summary.comments.map((c) => (
            <li key={c.id} className="relative rounded-2xl p-4 pl-10 text-sm leading-relaxed text-stone-600" style={{ background: "#F7F4EE" }}>
              <span className="absolute left-4 top-2 font-display text-3xl leading-none" style={{ color: "#C9A04A" }}>&ldquo;</span>
              {c.comment}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
