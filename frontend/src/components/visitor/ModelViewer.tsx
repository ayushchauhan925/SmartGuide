import { createElement, useEffect, useState } from "react";

const SCRIPT_SRC = "https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js";

/** Interactive 3D viewer with AR on supported phones, via Google's <model-viewer> web component. */
export function ModelViewer({ src, alt }: { src: string; alt: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (customElements.get("model-viewer")) { setReady(true); return; }
    let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      script.src = SCRIPT_SRC;
      document.head.appendChild(script);
    }
    customElements.whenDefined("model-viewer").then(() => setReady(true));
  }, []);

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-lg" style={{ background: "#EDEAE4" }}>
      {ready ? (
        createElement("model-viewer", {
          src,
          alt,
          "camera-controls": true,
          "auto-rotate": true,
          ar: true,
          "ar-modes": "webxr scene-viewer quick-look",
          "touch-action": "pan-y",
          style: { width: "100%", height: "100%" },
        })
      ) : (
        <p className="absolute inset-0 flex items-center justify-center text-xs text-stone-400">Loading 3D model…</p>
      )}
    </div>
  );
}
