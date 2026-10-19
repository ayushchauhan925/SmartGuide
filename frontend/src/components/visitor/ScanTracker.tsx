import { useEffect } from "react";

/** Records one scan per browser session per artefact. */
export function ScanTracker({ publicId, language }: { publicId: string; language: string }) {
  useEffect(() => {
    const key = `sg-scan-${publicId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    let referrer = "";
    try { referrer = document.referrer ? new URL(document.referrer).hostname : ""; } catch {}
    fetch(`/api/v1/public/artefacts/${publicId}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, referrer }),
      keepalive: true,
    }).catch(() => {});
  }, [publicId, language]);
  return null;
}
