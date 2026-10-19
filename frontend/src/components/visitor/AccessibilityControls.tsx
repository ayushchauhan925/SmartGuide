import { useEffect, useState } from "react";
import { Accessibility, X } from "lucide-react";

const SCALES = [1, 1.15, 1.3, 1.5];

/** Font size and high-contrast toggles. Applies to <html> and persists in localStorage. */
export function AccessibilityControls() {
  const [open, setOpen] = useState(false);
  const [scaleIdx, setScaleIdx] = useState(0);
  const [contrast, setContrast] = useState(false);

  useEffect(() => {
    try {
      const s = parseInt(localStorage.getItem("sg-scale") ?? "0");
      if (s >= 0 && s < SCALES.length) setScaleIdx(s);
      setContrast(localStorage.getItem("sg-contrast") === "1");
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--sg-font-scale", String(SCALES[scaleIdx]));
    document.documentElement.dataset.sgContrast = contrast ? "high" : "normal";
    try {
      localStorage.setItem("sg-scale", String(scaleIdx));
      localStorage.setItem("sg-contrast", contrast ? "1" : "0");
    } catch {}
  }, [scaleIdx, contrast]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Accessibility options"
        className="flex h-9 w-9 items-center justify-center rounded-full border text-stone-200 transition-colors hover:text-white"
        style={{ borderColor: "rgba(255,255,255,0.14)", background: open ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.06)" }}
      >
        {open ? <X className="h-4 w-4" /> : <Accessibility className="h-4 w-4" />}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Accessibility options"
          className="sg-reveal absolute right-0 top-12 z-30 w-64 rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl shadow-black/20"
        >
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Text size</p>
          <div className="mb-3 flex gap-1">
            {SCALES.map((s, i) => (
              <button
                key={s}
                onClick={() => setScaleIdx(i)}
                aria-pressed={scaleIdx === i}
                aria-label={`Text size ${Math.round(s * 100)}%`}
                className="flex-1 rounded-lg border py-1.5 font-display font-bold text-stone-800 transition-colors"
                style={{
                  fontSize: 11 + i * 2,
                  borderColor: scaleIdx === i ? "#C0952C" : "#E7E5E0",
                  background: scaleIdx === i ? "rgba(192,149,44,0.12)" : "#fff",
                }}
              >
                A
              </button>
            ))}
          </div>
          <label className="flex cursor-pointer items-center justify-between text-sm text-stone-700">
            High contrast
            <input type="checkbox" checked={contrast} onChange={(e) => setContrast(e.target.checked)} className="h-4 w-4" />
          </label>
        </div>
      )}
    </div>
  );
}
