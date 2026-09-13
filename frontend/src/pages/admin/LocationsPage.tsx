import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Location } from "@/lib/types";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";

interface LocationForm { name: string; type: string; description: string; }

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<LocationForm>({ name: "", type: "", description: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const d = await api.get<{ locations: Location[] }>("/locations");
      setLocations(d.locations);
    } catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setForm({ name: "", type: "", description: "" }); setEditing("new"); };
  const startEdit = (l: Location) => { setForm({ name: l.name, type: l.type ?? "", description: l.description ?? "" }); setEditing(l.id); };
  const cancel = () => { setEditing(null); };

  const save = async () => {
    if (!form.name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    try {
      const body = { name: form.name, type: form.type || null, description: form.description || null };
      if (editing === "new") { await api.post("/locations", body); toast("Location created"); }
      else { await api.put(`/locations/${editing}`, body); toast("Location updated"); }
      cancel(); load();
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Failed", "error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await api.delete(`/locations/${deleteId}`);
      toast("Location deleted");
      setDeleteId(null); load();
    } catch { toast("Failed to delete", "error"); }
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 400, color: "#1C1917" }}>Locations</h1>
        <button onClick={startNew} style={addBtn}><Plus size={14} /> Add location</button>
      </div>

      {editing === "new" && (
        <InlineForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} isNew />
      )}

      {loading ? (
        <p style={{ color: "#A8A29E" }}>Loading…</p>
      ) : locations.length === 0 ? (
        <p style={{ color: "#A8A29E", padding: "24px 0" }}>No locations yet</p>
      ) : (
        <div style={{ border: "1px solid #E7E5E0", borderRadius: "6px", overflow: "hidden" }}>
          {locations.map((loc, i) => (
            <div key={loc.id}>
              {editing === loc.id ? (
                <div style={{ padding: "14px 16px", background: "#FAFAF9" }}>
                  <InlineForm form={form} setForm={setForm} onSave={save} onCancel={cancel} saving={saving} />
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", background: "#fff", borderBottom: i < locations.length - 1 ? "1px solid #F5F4F2" : "none" }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "14px", fontWeight: 500, color: "#1C1917" }}>{loc.name}</p>
                    {loc.type && <p style={{ fontSize: "12px", color: "#78716C" }}>{loc.type}</p>}
                    {loc._count && <p style={{ fontSize: "11px", color: "#A8A29E", marginTop: "2px" }}>{loc._count.artefacts} artefact{loc._count.artefacts !== 1 ? "s" : ""}</p>}
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button onClick={() => startEdit(loc)} style={iconBtn}><Pencil size={13} /></button>
                    <button onClick={() => setDeleteId(loc.id)} style={{ ...iconBtn, color: "#DC2626" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={deleteId !== null} title="Delete location" description="This will permanently delete the location." confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}

function InlineForm({ form, setForm, onSave, onCancel, saving, isNew }: {
  form: LocationForm; setForm: (f: LocationForm) => void;
  onSave: () => void; onCancel: () => void; saving: boolean; isNew?: boolean;
}) {
  return (
    <div style={{ background: "#F9F8F6", border: "1px solid #E7E5E0", borderRadius: "5px", padding: "14px 16px", marginBottom: isNew ? "16px" : 0 }}>
      <input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Location name" style={inputStyle} onKeyDown={(e) => { if (e.key === "Escape") onCancel(); }} />
      <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Type (e.g. Gallery, Wing)" style={inputStyle} />
      <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" style={{ ...inputStyle, marginBottom: "10px" }} />
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={onSave} disabled={saving} style={saveBtn}><Check size={12} /> {saving ? "Saving…" : "Save"}</button>
        <button onClick={onCancel} style={cancelBtn}><X size={12} /> Cancel</button>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: "100%", padding: "7px 10px", border: "1px solid #D6D3D1", borderRadius: "4px", fontSize: "13.5px", marginBottom: "8px", fontFamily: "inherit", outline: "none" };
const addBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", background: "#C0952C", color: "#fff", border: "none", borderRadius: "5px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" };
const iconBtn: React.CSSProperties = { padding: "5px", border: "1px solid #E7E5E0", borderRadius: "4px", background: "#fff", cursor: "pointer", color: "#57534E", display: "flex", alignItems: "center" };
const saveBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "#C0952C", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit" };
const cancelBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", background: "#fff", color: "#57534E", border: "1px solid #E7E5E0", borderRadius: "4px", cursor: "pointer", fontSize: "12.5px", fontFamily: "inherit" };
