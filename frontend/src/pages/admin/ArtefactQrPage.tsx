import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import type { Artefact, QrCode } from "@/lib/types";
import { Copy, Check, RefreshCw } from "lucide-react";

function safeCopy(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const el = document.createElement("textarea");
  el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
  document.body.appendChild(el); el.select();
  document.execCommand("copy"); document.body.removeChild(el);
  return Promise.resolve();
}

export default function ArtefactQrPage() {
  const { id } = useParams<{ id: string }>();
  const [artefact, setArtefact] = useState<Artefact | null>(null);
  const [qrCode, setQrCode] = useState<QrCode | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get<{ artefact: Artefact; qrCode: QrCode | null; qrDataUrl: string | null }>(`/artefacts/${id}/qr`)
      .then((d) => { setArtefact(d.artefact); setQrCode(d.qrCode); setQrDataUrl(d.qrDataUrl); })
      .catch(() => toast("Failed to load", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const generate = async () => {
    setGenerating(true);
    try {
      const data = await api.post<{ qrCode: QrCode; qrDataUrl: string }>(`/artefacts/${id}/qr`);
      setQrCode(data.qrCode);
      setQrDataUrl(data.qrDataUrl);
      toast("QR code generated");
    } catch { toast("Failed to generate", "error"); }
    finally { setGenerating(false); }
  };

  const copyUrl = async () => {
    if (!qrCode) return;
    try {
      await safeCopy(qrCode.publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast("URL copied to clipboard");
    } catch { toast("Copy failed — please copy manually", "error"); }
  };

  if (loading) return <div style={{ padding: "48px 32px", color: "#A8A29E" }}>Loading…</div>;
  if (!artefact) return <div style={{ padding: "48px 32px", color: "#A8A29E" }}>Not found</div>;

  return (
    <div style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 32px" }}>
      <p style={{ fontSize: "12px", color: "#A8A29E", marginBottom: "20px" }}>
        <Link to={`/admin/artefacts/${id}`} style={{ color: "#A8A29E" }}>{artefact.title}</Link> / QR Code
      </p>

      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 400, color: "#1C1917", marginBottom: "8px" }}>QR Code</h1>
      <p style={{ fontSize: "13px", color: "#78716C", marginBottom: "32px" }}>{artefact.title}</p>

      {(qrCode && (qrDataUrl ?? qrCode.publicUrl)) ? (
        <div>
          {qrDataUrl && (
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
              <img src={qrDataUrl} alt="QR Code" style={{ width: 220, height: 220, borderRadius: "6px", border: "1px solid #E7E5E0" }} />
            </div>
          )}

          <div style={{ marginBottom: "20px", padding: "12px 14px", background: "#F9F8F6", border: "1px solid #E7E5E0", borderRadius: "5px" }}>
            <p style={{ fontSize: "11px", color: "#A8A29E", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Public URL</p>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "13px", color: "#1C1917", flex: 1, wordBreak: "break-all" }}>{qrCode.publicUrl}</span>
              <button onClick={copyUrl} style={{ padding: "5px 10px", border: "1px solid #E7E5E0", borderRadius: "4px", background: "#fff", cursor: "pointer", color: "#57534E", display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", fontFamily: "inherit", flexShrink: 0 }}>
                {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`qr-${artefact.title.toLowerCase().replace(/\s+/g, "-")}.png`}
                style={{ padding: "9px 18px", border: "1px solid #C0952C", borderRadius: "5px", color: "#C0952C", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}
              >
                Download PNG
              </a>
            )}
            <button
              onClick={generate} disabled={generating}
              style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", border: "1px solid #E7E5E0", borderRadius: "5px", background: "#fff", cursor: "pointer", fontSize: "13px", color: "#57534E", fontFamily: "inherit" }}
            >
              <RefreshCw size={13} /> {generating ? "Regenerating…" : "Regenerate"}
            </button>
          </div>

          <p style={{ fontSize: "12px", color: "#A8A29E" }}>
            {qrCode.scanCount} scan{qrCode.scanCount !== 1 ? "s" : ""} total
            {qrCode.lastScannedAt && ` · Last scanned ${new Date(qrCode.lastScannedAt).toLocaleDateString()}`}
          </p>
        </div>
      ) : (
        <div style={{ textAlign: "center", padding: "48px 24px", border: "1px dashed #D6D3D1", borderRadius: "8px" }}>
          <p style={{ fontSize: "14px", color: "#78716C", marginBottom: "20px" }}>No QR code generated yet</p>
          <button
            onClick={generate} disabled={generating}
            style={{ padding: "10px 24px", background: "#C0952C", color: "#fff", border: "none", borderRadius: "5px", fontSize: "14px", fontWeight: 500, cursor: generating ? "not-allowed" : "pointer", opacity: generating ? 0.7 : 1, fontFamily: "inherit" }}
          >
            {generating ? "Generating…" : "Generate QR code"}
          </button>
        </div>
      )}
    </div>
  );
}
