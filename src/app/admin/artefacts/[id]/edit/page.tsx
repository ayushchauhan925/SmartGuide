"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ChevronLeft, Info, Layers } from "lucide-react";

const METADATA_FIELDS: { key: string; label: string }[] = [
  { key: "period",        label: "Period / Era" },
  { key: "material",      label: "Material" },
  { key: "dimensions",    label: "Dimensions" },
  { key: "discovered_at", label: "Discovered At" },
];

export default function EditArtefactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
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
            period:       meta.period ?? "",
            material:     meta.material ?? "",
            dimensions:   meta.dimensions ?? "",
            discovered_at: meta.discovered_at ?? "",
          },
        });
      }
      setLoading(false);
    });
  }, [id]);

  const save = async () => {
    if (!form.title.trim()) { toast("Title is required", "error"); return; }
    setSaving(true);
    try {
      const meta = Object.fromEntries(Object.entries(form.metadata).filter(([, v]) => v.trim()));
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
        }),
      });
      if (res.ok) {
        toast("Artefact updated");
        router.push(`/admin/artefacts/${id}`);
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
        <div className="max-w-2xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="rounded-xl border border-stone-200 bg-white p-5 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href={`/admin/artefacts/${id}`}>
            <button className="h-8 w-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-stone-900">Edit Artefact</h1>
            <p className="text-xs text-stone-500">Update exhibit information</p>
          </div>
        </div>

        {/* Core details */}
        <section className="rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-stone-100 bg-stone-50">
            <Info className="h-3.5 w-3.5 text-stone-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">Core Details</h2>
          </div>
          <div className="p-5 space-y-4">
            <Input
              label="Title"
              required
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              label="Description"
              showCount
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={5}
            />
            <div className="grid grid-cols-2 gap-4">
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
            {/* Status */}
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Status</p>
              <div className="flex gap-4">
                {["draft", "active", "inactive"].map((s) => (
                  <label key={s} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={form.status === s}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="accent-[#c0952c]"
                    />
                    <span className="capitalize text-stone-700 font-medium">{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Metadata */}
        <section className="rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-stone-100 bg-stone-50">
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Provenance & Details
              <span className="ml-2 normal-case font-normal tracking-normal text-stone-400">(optional)</span>
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
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
        </section>

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 pb-4">
          <Button variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            Save Changes
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}
