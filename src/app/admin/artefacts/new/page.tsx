"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { FileUpload } from "@/components/ui/FileUpload";
import { useToast } from "@/components/ui/Toast";
import { ChevronLeft, ImageIcon, Info, Layers, X } from "lucide-react";

const METADATA_FIELDS: { key: string; label: string; placeholder: string }[] = [
  { key: "period",       label: "Period / Era",       placeholder: "e.g. 5th century BC" },
  { key: "material",     label: "Material",            placeholder: "e.g. Terracotta, Bronze" },
  { key: "dimensions",   label: "Dimensions",          placeholder: "e.g. 42 × 18 cm" },
  { key: "discovered_at", label: "Discovered At",      placeholder: "e.g. Athens, Greece" },
];

export default function NewArtefactPage() {
  const router = useRouter();
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

      toast(status === "active" ? "Artefact published!" : "Draft saved");
      router.push(`/admin/artefacts/${artefactId}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell>
      <div className="max-w-2xl space-y-6">
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <Link href="/admin/artefacts">
            <button className="h-8 w-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors shadow-sm">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-stone-900">Add Artefact</h1>
            <p className="text-xs text-stone-500">Create a new exhibit entry</p>
          </div>
        </div>

        {/* ── Core details ────────────────────────────── */}
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
              placeholder="e.g. Ancient Greek Amphora, c. 490 BC"
            />
            <Textarea
              label="Description"
              showCount
              maxLength={2000}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Provide a detailed description of this artefact…"
              rows={5}
            />
            <div className="grid grid-cols-2 gap-4">
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
        </section>

        {/* ── Metadata ────────────────────────────────── */}
        <section className="rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-stone-100 bg-stone-50">
            <Layers className="h-3.5 w-3.5 text-stone-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Provenance & Details
              <span className="ml-2 text-stone-400 normal-case font-normal tracking-normal">(optional)</span>
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
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
        </section>

        {/* ── Images ──────────────────────────────────── */}
        <section className="rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-4 border-b border-stone-100 bg-stone-50">
            <ImageIcon className="h-3.5 w-3.5 text-stone-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Images
              <span className="ml-2 text-stone-400 normal-case font-normal tracking-normal">(optional)</span>
            </h2>
          </div>
          <div className="p-5 space-y-4">
            <FileUpload
              accept="image/jpeg,image/png,image/webp"
              multiple
              onFiles={(files) => setImages((prev) => [...prev, ...files])}
              label="Upload images"
              hint="JPEG, PNG, WebP — up to 10MB each"
            />
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {images.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      className="h-20 w-20 rounded-lg object-cover border border-stone-200"
                    />
                    <button
                      onClick={() => setImages((imgs) => imgs.filter((_, j) => j !== i))}
                      aria-label="Remove image"
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-stone-800 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ── Actions ─────────────────────────────────── */}
        <div className="flex items-center justify-between pt-1 pb-4">
          <Button
            variant="secondary"
            onClick={() => save("draft")}
            loading={saving}
            disabled={saving}
          >
            Save as Draft
          </Button>
          <Button
            onClick={() => save("active")}
            loading={saving}
            disabled={saving}
          >
            Save & Publish
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}
