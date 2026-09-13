import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { Copy, Check } from "lucide-react";

interface QrEntry {
  id: number;
  publicUrl: string;
  isActive: boolean;
  scanCount: number;
  lastScannedAt: string | null;
  artefact: { id: number; title: string; uniquePublicId: string; status: string };
}

function safeCopy(text: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const el = document.createElement("textarea");
  el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
  document.body.appendChild(el); el.select();
  document.execCommand("copy"); document.body.removeChild(el);
  return Promise.resolve();
}

export default function QrCodesPage() {
  const [entries, setEntries] = useState<QrEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    api.get<{ qrCodes: QrEntry[] }>("/qr-codes")
      .then((d) => setEntries(d.qrCodes))
      .catch(() => toast("Failed to load", "error"))
      .finally(() => setLoading(false));
  }, []);

  const copy = async (entry: QrEntry) => {
    try {
      await safeCopy(entry.publicUrl);
      setCopiedId(entry.id);
      setTimeout(() => setCopiedId(null), 2000);
      toast("URL copied");
    } catch { toast("Copy failed", "error"); }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 32px" }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 400, color: "#1C1917", marginBottom: "28px" }}>QR Codes</h1>

      {loading ? (
        <p style={{ color: "#A8A29E" }}>Loading…</p>
      ) : entries.length === 0 ? (
        <p style={{ color: "#A8A29E" }}>No QR codes generated yet</p>
      ) : (
        <div style={{ border: "1px solid #E7E5E0", borderRadius: "6px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <thead>
              <tr style={{ background: "#FAFAF9", borderBottom: "1px solid #E7E5E0" }}>
                {["Artefact", "Status", "Scans", "URL", "Actions"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#78716C", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid #F5F4F2" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <Link to={`/admin/artefacts/${entry.artefact.id}`} style={{ fontWeight: 500, color: "#1C1917" }}>{entry.artefact.title}</Link>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge variant={entry.isActive ? "active" : "inactive"} label={entry.isActive ? "Active" : "Inactive"} />
                  </td>
                  <td style={{ padding: "12px 16px", color: "#57534E" }}>{entry.scanCount}</td>
                  <td style={{ padding: "12px 16px", color: "#78716C", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entry.publicUrl}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => copy(entry)} style={iconBtn}>
                        {copiedId === entry.id ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                      </button>
                      <Link to={`/admin/artefacts/${entry.artefact.id}/qr`} style={{ ...iconBtn, textDecoration: "none", color: "#C0952C", fontSize: "12px", padding: "4px 10px" }}>
                        View
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  padding: "5px", border: "1px solid #E7E5E0", borderRadius: "4px", background: "#fff",
  cursor: "pointer", color: "#57534E", display: "flex", alignItems: "center", justifyContent: "center",
};
