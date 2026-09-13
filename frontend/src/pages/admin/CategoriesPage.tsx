import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Category } from "@/lib/types";
import { Plus, Pencil, Trash2, Check, X, Tag } from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { const d = await api.get<{ categories: Category[] }>("/categories"); setCategories(d.categories); }
    catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancel = () => { setEditing(null); setForm({ name: "", description: "" }); };

  const save = async () => {
    if (!form.name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    try {
      if (editing === "new") { await api.post("/categories", form); toast("Category created"); }
      else { await api.put(`/categories/${editing}`, form); toast("Category updated"); }
      cancel(); load();
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Failed", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try { await api.delete(`/categories/${deleteId}`); toast("Category deleted"); setDeleteId(null); load(); }
    catch { toast("Failed to delete — it may have artefacts", "error"); }
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "36px 36px" }} className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: "var(--text-primary)", marginBottom: 3 }}>Categories</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{categories.length} categor{categories.length !== 1 ? "ies" : "y"}</p>
        </div>
        <button onClick={() => { setForm({ name: "", description: "" }); setEditing("new"); }} style={addBtn}>
          <Plus size={14} strokeWidth={2.5} /> Add category
        </button>
      </div>

      {editing === "new" && (
        <div style={{ marginBottom: 16 }}>
          <InlineForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-tertiary)" }}>Loading…</div>
      ) : categories.length === 0 && editing !== "new" ? (
        <div style={{ padding: "48px 24px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-tertiary)" }}>
          <Tag size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
          <p style={{ fontSize: 14 }}>No categories yet. Add one to get started.</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          {categories.map((cat, i) => (
            <div key={cat.id}>
              {editing === cat.id ? (
                <div style={{ padding: "14px 16px", background: "var(--surface-2)", borderBottom: i < categories.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <InlineForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: i < categories.length - 1 ? "1px solid var(--border)" : "none", transition: "background var(--transition)" }}
                  onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"}
                  onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(184,134,30,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Tag size={14} color="var(--gold)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{cat.name}</p>
                    {cat.description && <p style={{ fontSize: 12.5, color: "var(--text-tertiary)", marginTop: 1 }}>{cat.description}</p>}
                    {cat._count !== undefined && <p style={{ fontSize: 11.5, color: "var(--text-tertiary)", marginTop: 2 }}>{cat._count.artefacts} artefact{cat._count.artefacts !== 1 ? "s" : ""}</p>}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => { setForm({ name: cat.name, description: cat.description ?? "" }); setEditing(cat.id); }} style={iconBtn}><Pencil size={13} /></button>
                    <button onClick={() => { setDeleteId(cat.id); setDeleteName(cat.name); }} style={{ ...iconBtn, color: "var(--red)" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={deleteId !== null} title="Delete category" description={<>Delete <strong>{deleteName}</strong>? Artefacts in this category will become uncategorised.</>} confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function InlineForm({ form, setForm, onSave, onCancel, saving }: {
  form: { name: string; description: string }; setForm: (f: { name: string; description: string }) => void;
  onSave: () => void; onCancel: () => void; saving: boolean;
}) {
  return (
    <div style={{ background: "var(--gold-subtle)", border: "1px solid var(--gold-border)", borderRadius: "var(--radius-md)", padding: "16px" }}>
      <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Category name *"
        style={inlineInput} onKeyDown={(e) => { if (e.key === "Enter") onSave(); if (e.key === "Escape") onCancel(); }} />
      <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)"
        style={{ ...inlineInput, marginBottom: 12 }} />
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={onSave} disabled={saving} style={saveBtn}><Check size={13} /> {saving ? "Saving…" : "Save"}</button>
        <button onClick={onCancel} style={cancelBtn}><X size={13} /> Cancel</button>
      </div>
    </div>
  );
}

const addBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(184,134,30,0.25)", whiteSpace: "nowrap" };
const iconBtn: React.CSSProperties = { width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", cursor: "pointer", color: "var(--text-secondary)", transition: "all var(--transition)" };
const inlineInput: React.CSSProperties = { width: "100%", padding: "8px 11px", border: "1px solid var(--gold-border)", borderRadius: "var(--radius-sm)", fontSize: 14, marginBottom: 8, fontFamily: "inherit", outline: "none", background: "var(--surface)" };
const saveBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 16px", background: "var(--gold)", color: "#fff", border: "none", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit", fontWeight: 500 };
const cancelBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: "pointer", fontSize: 13.5, fontFamily: "inherit" };
