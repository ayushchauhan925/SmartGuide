import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import type { AuditLog } from "@/lib/types";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const d = await api.get<{ logs: AuditLog[]; total: number }>(`/audit-logs?page=${page}&limit=50`);
      setLogs(d.logs);
      setTotal(d.total);
    } catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [page]);

  const formatChange = (changes: unknown) => {
    if (!changes || typeof changes !== "object") return "—";
    const entries = Object.entries(changes as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined);
    return entries.map(([k, v]) => `${k}: ${v}`).join(", ") || "—";
  };

  const actionColor: Record<string, string> = {
    create: "#065F46", update: "#1E40AF", delete: "#991B1B",
    deactivate: "#92400E", login: "#5B21B6", logout: "#374151",
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 400, color: "#1C1917" }}>Audit Logs</h1>
        <p style={{ fontSize: "13px", color: "#78716C", marginTop: "2px" }}>{total} events</p>
      </div>

      {loading ? (
        <p style={{ color: "#A8A29E" }}>Loading…</p>
      ) : logs.length === 0 ? (
        <p style={{ color: "#A8A29E" }}>No events yet</p>
      ) : (
        <>
          <div style={{ border: "1px solid #E7E5E0", borderRadius: "6px", overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#FAFAF9", borderBottom: "1px solid #E7E5E0" }}>
                  {["Time", "User", "Action", "Entity", "Changes"].map((h) => (
                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#78716C", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: "1px solid #F5F4F2" }}>
                    <td style={{ padding: "10px 14px", color: "#78716C", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#1C1917" }}>{log.user?.name ?? "System"}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em",
                        color: actionColor[log.action] ?? "#57534E",
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#57534E" }}>
                      {log.entityType}{log.entityId ? ` #${log.entityId}` : ""}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#78716C", maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {formatChange(log.changes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > 50 && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} style={paginBtn}>Previous</button>
              <span style={{ fontSize: "13px", color: "#57534E", padding: "6px 0" }}>Page {page} of {Math.ceil(total / 50)}</span>
              <button disabled={page >= Math.ceil(total / 50)} onClick={() => setPage((p) => p + 1)} style={paginBtn}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const paginBtn: React.CSSProperties = { padding: "6px 14px", border: "1px solid #E7E5E0", borderRadius: "5px", background: "#fff", cursor: "pointer", fontSize: "13px", fontFamily: "inherit", color: "#57534E" };
