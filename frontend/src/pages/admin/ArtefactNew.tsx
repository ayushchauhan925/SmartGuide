import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { useToast } from "@/components/ui/Toast";
import { ChevronLeft, X } from "lucide-react";

const METADATA_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "period",       label: "Period / Era",   placeholder: "e.g. 5th century BC" },
  { key: "material",     label: "Material",        placeholder: "e.g. Terracotta, Bronze" },
  { key: "dimensions",   label: "Dimensions",      placeholder: "e.g. 42 × 18 cm" },
  { key: "discovered_at", label: "Discovered at",  placeholder: "e.g. Athens, Greece" },
];

function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="pt-8 first:pt-0">
      <div className="mb-5" style={{ borderBottom: "1px solid #E7E5E0", paddingBottom: "12px" }}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{title}</h2>
        {hint && <p className="text-xs text-stone-400 mt-1">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function NewArtefactPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    locationId: "",
    status: "draft",
    metadata: { period: "", material: "", dimensions: "", discovered_at: "" },
  });

  useEffect(() => {
    Promise.all([fetch("/api/v1/categories"), fetch("/api/v1/locations")]).then(
      async ([cRes, lRes]) => {
        const [cData, lData] = await Promise.all([cRes.json(), lRes.json()]);
        setCategories(cData.categories ?? []);
        setLocations(lData.locations ?? []);
      }
    );
  }, []);

  const save = async (status: "draft" | "active") => {
    if (!form.title.trim()) { toast("Title is required", "error"); return; }
    setSaving(true);
    try {
      const meta = Object.fromEntries(
        Object.entries(form.metadata).filter(([, v]) => v.trim())
      );
      const body = {
        title: form.title,
        description: form.description || null,
        categoryId: form.categoryId ? parseInt(form.categoryId) : null,
        locationId: form.locationId ? parseInt(form.locationId) : null,
        status,
        metadata: Object.keys(meta).length ? meta : null,
      };
      const res = await fetch("/api/v1/artefacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error?.message ?? "Save failed", "error"); return; }

      const artefactId = data.artefact.id;
      if (images.length) {
        const fd = new FormData();
        images.forEach((f) => fd.append("images", f));
        await fetch(`/api/v1/artefacts/${artefactId}/images`, { method: "POST", body: fd });
      }

      toast(status === "active" ? "Artefact published" : "Draft saved");
      navigate(`/admin/artefacts/${artefactId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-xl">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/admin/artefacts">
            <button
              className="h-7 w-7 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
              style={{ border: "1px solid #E7E5E0", borderRadius: "5px", background: "#fff" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-stone-900 leading-none">Add artefact</h1>
            <p className="text-xs text-stone-400 mt-1">Catalogue a new exhibit</p>
          </div>
        </div>

        {/* ── Identity ──────────────────────────────────── */}
        <FormSection title="Identity">
          <div className="space-y-4">
            <Input
              label="Title"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Ancient Greek Amphora, c. 490 BC"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
              />
              <Select
                label="Location"
                value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                options={locations.map((l) => ({ value: l.id, label: l.name }))}
                placeholder="Select location"
              />
            </div>
          </div>
        </FormSection>

        {/* ── Description ───────────────────────────────── */}
        <FormSection title="Description">
          <Textarea
            label=""
            showCount
            maxLength={2000}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Describe the artefact — its appearance, significance, and historical context…"
            rows={6}
          />
        </FormSection>

        {/* ── Provenance & details ──────────────────────── */}
        <FormSection title="Provenance & details" hint="Optional — adds to the visitor's record">
          <div className="grid grid-cols-2 gap-3">
            {METADATA_FIELDS.map(({ key, label, placeholder }) => (
              <Input
                key={key}
                label={label}
                placeholder={placeholder}
                value={form.metadata[key as keyof typeof form.metadata]}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    metadata: { ...f.metadata, [key]: e.target.value },
                  }))
                }
              />
            ))}
          </div>
        </FormSection>

        {/* ── Images ────────────────────────────────────── */}
        <FormSection title="Images" hint="Optional — JPEG, PNG, WebP up to 10 MB each">
          <FileUpload
            accept="image/jpeg,image/png,image/webp"
            multiple
            onFiles={(files) => setImages((prev) => [...prev, ...files])}
            label="Upload images"
            hint="Drag and drop or click to browse"
          />
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {images.map((f, i) => (
                <div key={i} className="relative group">
                  <img
                    src={URL.createObjectURL(f)}
                    alt=""
                    className="h-20 w-20 object-cover"
                    style={{ borderRadius: "4px", border: "1px solid #E7E5E0" }}
                  />
                  <button
                    onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                    aria-label="Remove image"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#1C1917", color: "#fff" }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormSection>

        {/* ── Publishing ────────────────────────────────── */}
        <div
          className="mt-8 pt-6 flex items-center justify-between gap-3"
          style={{ borderTop: "1px solid #E7E5E0" }}
        >
          <Button
            variant="secondary"
            onClick={() => save("draft")}
            loading={saving}
            disabled={saving}
          >
            Save as draft
          </Button>
          <Button
            onClick={() => save("active")}
            loading={saving}
            disabled={saving}
          >
            Publish artefact
          </Button>
        </div>

      </div>
    </AdminShell>
  );
}
