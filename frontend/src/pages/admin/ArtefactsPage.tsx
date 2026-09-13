import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Artefact, ArtefactStatus } from "@/lib/types";
import { Plus, Search, Pencil, Trash2, Eye, QrCode, Package } from "lucide-react";

export default function ArtefactsPage() {
  const navigate = useNavigate();
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ArtefactStatus | "">("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteTitle, setDeleteTitle] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const data = await api.get<{ artefacts: Artefact[]; total: number }>(`/artefacts?${params}`);
      setArtefacts(data.artefacts);
      setTotal(data.total);
    } catch { toast("Failed to load artefacts", "error"); }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/artefacts/${deleteId}`);
      toast("Artefact deleted");
      setDeleteId(null);
      load();
    } catch { toast("Failed to delete", "error"); }
  };

  const pages = Math.ceil(total / 20);

  return (
    <div style={{ padding: "36px 36px", maxWidth: 1100 }} className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: "var(--text-primary)", marginBottom: 3 }}>Artefacts</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{total} artefact{total !== 1 ? "s" : ""} in the collection</p>
        </div>
        <Link to="/admin/artefacts/new" style={{
          display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px",
          background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
          color: "#fff", borderRadius: "var(--radius-md)", fontSize: 13.5, fontWeight: 600,
          textDecoration: "none", boxShadow: "0 2px 10px rgba(184,134,30,0.3)", transition: "all var(--transition)",
          whiteSpace: "nowrap",
        }}>
          <Plus size={15} strokeWidth={2.5} /> New artefact
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <Search size={14} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
          <input
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search artefacts…"
            style={{ width: "100%", padding: "8px 12px 8px 33px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 13.5, background: "var(--surface)", color: "var(--text-primary)", outline: "none", fontFamily: "inherit", transition: "border-color var(--transition)" }}
            onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
            onBlur={(e) => e.target.style.borderColor = "var(--border)"}
          />
        </div>
        <select
          value={status} onChange={(e) => { setStatus(e.target.value as ArtefactStatus | ""); setPage(1); }}
          style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 13.5, background: "var(--surface)", fontFamily: "inherit", outline: "none", color: "var(--text-secondary)", cursor: "pointer" }}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div style={{ padding: "60px 0", textAlign: "center", color: "var(--text-tertiary)" }}>
          <div style={{ width: 20, height: 20, border: "2px solid var(--border)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto 12px" }} />
          Loading artefacts…
        </div>
      ) : artefacts.length === 0 ? (
        <div style={{ padding: "60px 24px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-tertiary)" }}>
          <Package size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: 15, marginBottom: 4 }}>No artefacts found</p>
          <p style={{ fontSize: 13 }}>{search ? "Try a different search term" : "Add your first artefact to get started"}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hide-mobile" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
              <thead>
                <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
                  {["Artefact", "Category", "Location", "Status", ""].map((h) => (
                    <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.07em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {artefacts.map((a, i) => (
                  <tr key={a.id} style={{ borderBottom: i < artefacts.length - 1 ? "1px solid var(--border)" : "none", transition: "background var(--transition)" }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                        {a.images[0] ? (
                          <img src={a.images[0].imageUrl} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", border: "1px solid var(--border)", flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: 38, height: 38, borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Package size={14} color="var(--text-tertiary)" />
                          </div>
                        )}
                        <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>{a.title}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: 13 }}>{a.category?.name ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                    <td style={{ padding: "12px 16px", color: "var(--text-secondary)", fontSize: 13 }}>{a.location?.name ?? <span style={{ color: "var(--text-tertiary)" }}>—</span>}</td>
                    <td style={{ padding: "12px 16px" }}><Badge variant={a.status} /></td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                        {[
                          { onClick: () => navigate(`/admin/artefacts/${a.id}`), icon: <Eye size={13.5} />, title: "View" },
                          { onClick: () => navigate(`/admin/artefacts/${a.id}/edit`), icon: <Pencil size={13.5} />, title: "Edit" },
                          { onClick: () => navigate(`/admin/artefacts/${a.id}/qr`), icon: <QrCode size={13.5} />, title: "QR Code" },
                        ].map((btn) => (
                          <button key={btn.title} onClick={btn.onClick} title={btn.title} style={{ ...iconBtn }}>{btn.icon}</button>
                        ))}
                        <button onClick={() => { setDeleteId(a.id); setDeleteTitle(a.title); }} title="Delete" style={{ ...iconBtn, color: "var(--red)" }}><Trash2 size={13.5} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="hide-desktop" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {artefacts.map((a) => (
              <div key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: "14px", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  {a.images[0] ? (
                    <img src={a.images[0].imageUrl} alt="" style={{ width: 54, height: 54, borderRadius: 8, objectFit: "cover", flexShrink: 0, border: "1px solid var(--border)" }} />
                  ) : (
                    <div style={{ width: 54, height: 54, borderRadius: 8, background: "var(--surface-3)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Package size={18} color="var(--text-tertiary)" />
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 5 }}>{a.title}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                      <Badge variant={a.status} />
                      {a.category && <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{a.category.name}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                  {[
                    { label: "View", onClick: () => navigate(`/admin/artefacts/${a.id}`) },
                    { label: "Edit", onClick: () => navigate(`/admin/artefacts/${a.id}/edit`) },
                    { label: "QR", onClick: () => navigate(`/admin/artefacts/${a.id}/qr`) },
                  ].map((btn) => (
                    <button key={btn.label} onClick={btn.onClick} style={{ ...mobileBtn }}>{btn.label}</button>
                  ))}
                  <button onClick={() => { setDeleteId(a.id); setDeleteTitle(a.title); }} style={{ ...mobileBtn, color: "var(--red)", borderColor: "var(--red-border)", marginLeft: "auto" }}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
              <span style={{ fontSize: 13, color: "var(--text-tertiary)" }}>Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={paginBtn}>← Previous</button>
                <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} style={paginBtn}>Next →</button>
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={deleteId !== null}
        title="Delete artefact"
        description={<>Permanently delete <strong>{deleteTitle}</strong>? All images, audio and QR code data will be lost. This cannot be undone.</>}
        confirmLabel="Delete artefact"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

const iconBtn: React.CSSProperties = {
  width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
  border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
  background: "var(--surface)", cursor: "pointer", color: "var(--text-secondary)",
  transition: "all var(--transition)",
};
const mobileBtn: React.CSSProperties = {
  padding: "5px 13px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
  background: "var(--surface)", cursor: "pointer", fontSize: 12.5, fontFamily: "inherit", color: "var(--text-secondary)",
};
const paginBtn: React.CSSProperties = {
  padding: "7px 14px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)",
  background: "var(--surface)", cursor: "pointer", fontSize: 13, fontFamily: "inherit",
  color: "var(--text-secondary)", transition: "all var(--transition)",
};
