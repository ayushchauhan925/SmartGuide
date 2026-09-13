import { useState, useEffect, FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import type { Artefact, Category, Location } from "@/lib/types";
import { Field, Input, Textarea, Select } from "@/components/ui/FormField";

const sectionTitle: React.CSSProperties = {
  fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#A8A29E",
  marginBottom: "16px", paddingBottom: "10px", borderBottom: "1px solid #E7E5E0",
};

export default function ArtefactEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    title: "", description: "", categoryId: "", locationId: "", status: "draft",
    material: "", period: "", dimensions: "", acquisition: "",
  });

  useEffect(() => {
    Promise.all([
      api.get<{ artefact: Artefact }>(`/artefacts/${id}`),
      api.get<{ categories: Category[] }>("/categories"),
      api.get<{ locations: Location[] }>("/locations"),
    ]).then(([{ artefact }, { categories: cats }, { locations: locs }]) => {
      setCategories(cats);
      setLocations(locs);
      const meta = (artefact.metadata as Record<string, string> | null) ?? {};
      setForm({
        title: artefact.title,
        description: artefact.description ?? "",
        categoryId: artefact.categoryId ? String(artefact.categoryId) : "",
        locationId: artefact.locationId ? String(artefact.locationId) : "",
        status: artefact.status,
        material: meta.material ?? "",
        period: meta.period ?? "",
        dimensions: meta.dimensions ?? "",
        acquisition: meta.acquisition ?? "",
      });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast("Title is required", "error"); return; }
    setSaving(true);
    try {
      const metadata: Record<string, string> = {};
      if (form.material) metadata.material = form.material;
      if (form.period) metadata.period = form.period;
      if (form.dimensions) metadata.dimensions = form.dimensions;
      if (form.acquisition) metadata.acquisition = form.acquisition;

      await api.put(`/artefacts/${id}`, {
        title: form.title, description: form.description || null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        locationId: form.locationId ? parseInt(form.locationId) : null,
        status: form.status,
        metadata: Object.keys(metadata).length ? metadata : null,
      });
      toast("Saved");
      navigate(`/admin/artefacts/${id}`);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally { setSaving(false); }
  };

  if (loading) return <div style={{ padding: "48px 32px", color: "#A8A29E" }}>Loading…</div>;

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 32px" }}>
      <p style={{ fontSize: "12px", color: "#A8A29E", marginBottom: "20px" }}>
        <Link to={`/admin/artefacts/${id}`} style={{ color: "#A8A29E" }}>Artefact</Link> / Edit
      </p>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 400, color: "#1C1917", marginBottom: "32px" }}>Edit artefact</h1>

      <form onSubmit={submit}>
        {/* Identity */}
        <section style={{ marginBottom: "32px" }}>
          <p style={sectionTitle}>Identity</p>
          <Field label="Title" required><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Category">
            <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Location">
            <Select value={form.locationId} onChange={(e) => set("locationId", e.target.value)}>
              <option value="">No location</option>
              {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </Select>
          </Field>
        </section>

        {/* Description */}
        <section style={{ marginBottom: "32px" }}>
          <p style={sectionTitle}>Description</p>
          <Field label="Description"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} /></Field>
        </section>

        {/* Provenance */}
        <section style={{ marginBottom: "32px" }}>
          <p style={sectionTitle}>Provenance & details</p>
          <Field label="Material"><Input value={form.material} onChange={(e) => set("material", e.target.value)} /></Field>
          <Field label="Period"><Input value={form.period} onChange={(e) => set("period", e.target.value)} /></Field>
          <Field label="Dimensions"><Input value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} /></Field>
          <Field label="Acquisition"><Input value={form.acquisition} onChange={(e) => set("acquisition", e.target.value)} /></Field>
        </section>

        {/* Publishing */}
        <section style={{ marginBottom: "32px" }}>
          <p style={sectionTitle}>Publishing status</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {(["draft", "active", "inactive"] as const).map((s) => (
              <label key={s} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#1C1917" }}>
                <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set("status", s)} style={{ accentColor: "#C0952C" }} />
                <span style={{ textTransform: "capitalize" }}>{s}</span>
                <span style={{ fontSize: "12px", color: "#A8A29E" }}>
                  {s === "draft" ? "— not visible to visitors" : s === "active" ? "— visible via QR code" : "— hidden but not deleted"}
                </span>
              </label>
            ))}
          </div>
        </section>

        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" onClick={() => navigate(`/admin/artefacts/${id}`)} style={{ padding: "10px 20px", border: "1px solid #E7E5E0", borderRadius: "5px", background: "#fff", fontSize: "14px", cursor: "pointer", color: "#57534E", fontFamily: "inherit" }}>Cancel</button>
          <button type="submit" disabled={saving} style={{ padding: "10px 24px", background: "#C0952C", color: "#fff", border: "none", borderRadius: "5px", fontSize: "14px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1, fontFamily: "inherit" }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
