import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ChevronLeft } from "lucide-react";

const METADATA_FIELDS: { key: string; label: string }[] = [
  { key: "period",        label: "Period / Era" },
  { key: "material",      label: "Material" },
  { key: "dimensions",    label: "Dimensions" },
  { key: "discovered_at", label: "Discovered at" },
];

function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="pt-7 first:pt-0">
      <div className="mb-5" style={{ borderBottom: "1px solid #E7E5E0", paddingBottom: "10px" }}>
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">{title}</h2>
        {hint && <p className="text-xs text-stone-400 mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function EditArtefactPage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string; floorPlanUrl?: string | null }[]>([]);
  const [extraMeta, setExtraMeta] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    categoryId: "",
    locationId: "",
    status: "draft",
    metadata: { period: "", material: "", dimensions: "", discovered_at: "" },
    videoUrl: "",
    modelUrl: "",
    mapX: null as number | null,
    mapY: null as number | null,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/artefacts/${id}`),
      fetch("/api/v1/categories"),
      fetch("/api/v1/locations"),
    ]).then(async ([aRes, cRes, lRes]) => {
      const [aData, cData, lData] = await Promise.all([aRes.json(), cRes.json(), lRes.json()]);
      setCategories(cData.categories ?? []);
      setLocations(lData.locations ?? []);
      const a = aData.artefact;
      if (a) {
        const meta = (a.metadata as Record<string, string>) ?? {};
        setForm({
          title: a.title,
          description: a.description ?? "",
          categoryId: a.categoryId?.toString() ?? "",
          locationId: a.locationId?.toString() ?? "",
          status: a.status,
          metadata: {
            period:        meta.period ?? "",
            material:      meta.material ?? "",
            dimensions:    meta.dimensions ?? "",
            discovered_at: meta.discovered_at ?? "",
          },
          videoUrl: a.videoUrl ?? "",
          modelUrl: a.modelUrl ?? "",
          mapX: a.mapX ?? null,
          mapY: a.mapY ?? null,
        });
        // Keep metadata keys this form doesn't edit (e.g. artist, origin) so saving doesn't drop them
        const known = new Set(METADATA_FIELDS.map((m) => m.key));
        setExtraMeta(Object.fromEntries(Object.entries(meta).filter(([k]) => !known.has(k))));
      }
      setLoading(false);
    });
  }, [id]);

  const save = async () => {
    if (!form.title.trim()) { toast("Title is required", "error"); return; }
    setSaving(true);
    try {
      const meta = Object.fromEntries(
        Object.entries({ ...extraMeta, ...form.metadata }).filter(([, v]) => typeof v === "string" && v.trim())
      );
      const res = await fetch(`/api/v1/artefacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || null,
          categoryId: form.categoryId ? parseInt(form.categoryId) : null,
          locationId: form.locationId ? parseInt(form.locationId) : null,
          status: form.status,
          metadata: Object.keys(meta).length ? meta : null,
          videoUrl: form.videoUrl.trim() || null,
          modelUrl: form.modelUrl.trim() || null,
          mapX: form.mapX,
          mapY: form.mapY,
        }),
      });
      if (res.ok) {
        toast("Artefact updated");
        navigate(`/admin/artefacts/${id}`);
      } else {
        const data = await res.json();
        toast(data.error?.message ?? "Update failed", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="max-w-xl space-y-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-xl">

        {/* ── Header ────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <Link to={`/admin/artefacts/${id}`}>
            <button
              className="h-7 w-7 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
              style={{ border: "1px solid #E7E5E0", borderRadius: "5px", background: "#fff" }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-stone-900 leading-none">Edit artefact</h1>
            <p className="text-xs text-stone-400 mt-1">Update catalogue record</p>
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
            />
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="No category"
              />
              <Select
                label="Location"
                value={form.locationId}
                onChange={(e) => setForm((f) => ({ ...f, locationId: e.target.value }))}
                options={locations.map((l) => ({ value: l.id, label: l.name }))}
                placeholder="No location"
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
            rows={6}
            placeholder="Describe the artefact…"
          />
        </FormSection>

        {/* ── Provenance ────────────────────────────────── */}
        <FormSection title="Provenance & details" hint="Optional">
          <div className="grid grid-cols-2 gap-3">
            {METADATA_FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={label}
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

        {/* ── Rich media ────────────────────────────────── */}
        <FormSection title="Video & 3D" hint="Optional: YouTube/Vimeo/MP4 link and a .glb/.gltf 3D model link">
          <div className="space-y-4">
            <Input
              label="Video URL"
              type="url"
              placeholder="https://www.youtube.com/watch?v=…"
              value={form.videoUrl}
              onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
            />
            <Input
              label="3D model URL (.glb)"
              type="url"
              placeholder="https://…/model.glb"
              value={form.modelUrl}
              onChange={(e) => setForm((f) => ({ ...f, modelUrl: e.target.value }))}
            />
          </div>
        </FormSection>

        {/* ── Floor plan position ───────────────────────── */}
        {(() => {
          const plan = locations.find((l) => l.id.toString() === form.locationId)?.floorPlanUrl;
          if (!plan) return null;
          return (
            <FormSection title="Position on floor plan" hint="Click the plan to place this artefact">
              <div
                className="relative w-full cursor-crosshair overflow-hidden rounded-lg border border-stone-200"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  const x = Math.round(((e.clientX - r.left) / r.width) * 1000) / 10;
                  const y = Math.round(((e.clientY - r.top) / r.height) * 1000) / 10;
                  setForm((f) => ({ ...f, mapX: x, mapY: y }));
                }}
              >
                <img src={plan} alt="Floor plan" className="block w-full select-none" draggable={false} />
                {form.mapX !== null && form.mapY !== null && (
                  <span
                    className="absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#C0952C] shadow"
                    style={{ left: `${form.mapX}%`, top: `${form.mapY}%` }}
                  />
                )}
              </div>
              {form.mapX !== null && (
                <button type="button" onClick={() => setForm((f) => ({ ...f, mapX: null, mapY: null }))} className="mt-2 text-xs text-stone-500 underline">
                  Remove position
                </button>
              )}
            </FormSection>
          );
        })()}

        {/* ── Status ────────────────────────────────────── */}
        <FormSection title="Publishing status">
          <div className="flex gap-5">
            {(["draft", "active", "inactive"] as const).map((s) => (
              <label key={s} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={form.status === s}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="accent-[#c0952c]"
                />
                <span className="text-sm capitalize text-stone-700 font-medium">{s}</span>
              </label>
            ))}
          </div>
        </FormSection>

        {/* ── Actions ───────────────────────────────────── */}
        <div
          className="mt-8 pt-6 flex items-center justify-between"
          style={{ borderTop: "1px solid #E7E5E0" }}
        >
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save changes
          </Button>
        </div>

      </div>
    </AdminShell>
  );
}
