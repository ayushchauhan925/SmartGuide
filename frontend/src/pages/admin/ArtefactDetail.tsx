import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ArtefactCover } from "@/components/visitor/ArtefactCover";
import {
  ChevronLeft, Pencil, QrCode, Image as ImageIcon, Music,
  ExternalLink, Trash2, Package, Eye, EyeOff, Languages, History,
  Check, Circle, MapPin, Tag, ChevronRight,
} from "lucide-react";

interface Artefact {
  id: number;
  uniquePublicId: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  category: { name: string } | null;
  location: { name: string } | null;
  videoUrl?: string | null;
  modelUrl?: string | null;
  images: Array<{ id: number; imageUrl: string; altText: string | null; displayOrder: number }>;
  audio: { audioUrl: string; duration: number | null } | null;
  qrCode: { publicUrl: string; isActive: boolean } | null;
}

export default function ArtefactDetailPage() {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artefact, setArtefact] = useState<Artefact | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/artefacts/${id}`)
      .then((r) => r.json())
      .then((d) => { setArtefact(d.artefact); setLoading(false); });
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/v1/artefacts/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Artefact deleted");
      navigate("/admin/artefacts");
    } else {
      toast("Delete failed", "error");
      setDeleting(false);
    }
  };

  const toggleStatus = async () => {
    if (!artefact) return;
    setToggling(true);
    const newStatus = artefact.status === "active" ? "inactive" : "active";
    const res = await fetch(`/api/v1/artefacts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setArtefact(data.artefact);
      toast(`Artefact ${newStatus === "active" ? "published" : "unpublished"}`);
    }
    setToggling(false);
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="space-y-4 max-w-2xl">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
            <Skeleton className="h-12 rounded-lg" />
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!artefact) {
    return (
      <AdminShell>
        <div className="flex flex-col items-center justify-center py-20 text-stone-500">
          <Package className="h-10 w-10 text-stone-300 mb-3" strokeWidth={1} />
          <p className="text-sm font-semibold text-stone-700 mb-3">Artefact not found</p>
          <Link to="/admin/artefacts">
            <Button variant="secondary" size="sm">Back to artefacts</Button>
          </Link>
        </div>
      </AdminShell>
    );
  }

  const heroImage = artefact.images[0];
  const checks = [
    { label: "Description written", done: !!artefact.description?.trim(), href: `/admin/artefacts/${id}/edit` },
    { label: "At least one image", done: artefact.images.length > 0, href: `/admin/artefacts/${id}/media` },
    { label: "Audio guide recorded", done: !!artefact.audio, href: `/admin/artefacts/${id}/audio`, optional: true },
    { label: "Location assigned", done: !!artefact.location, href: `/admin/artefacts/${id}/edit` },
    { label: "QR code generated", done: !!artefact.qrCode, href: `/admin/artefacts/${id}/qr` },
  ];
  const score = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  const ActionRow = ({ href, icon: Icon, label, hint, external }: { href: string; icon: typeof Pencil; label: string; hint?: string; external?: boolean }) => {
    const inner = (
      <>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-stone-600 transition-colors group-hover:bg-gold-50 group-hover:text-gold-700">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-stone-800">{label}</span>
          {hint && <span className="block truncate text-xs text-stone-400">{hint}</span>}
        </span>
        {external ? <ExternalLink className="h-3.5 w-3.5 text-stone-300" /> : <ChevronRight className="h-4 w-4 text-stone-300 transition-transform group-hover:translate-x-0.5 group-hover:text-stone-500" />}
      </>
    );
    const cls = "group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-stone-50";
    return external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
    ) : (
      <Link to={href} className={cls}>{inner}</Link>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <button
          onClick={() => navigate("/admin/artefacts")}
          className="group inline-flex items-center gap-1.5 text-sm text-stone-500 transition-colors hover:text-stone-900"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> All artefacts
        </button>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* ── Main column ─────────────────────────────── */}
          <div className="min-w-0 space-y-6">
            {/* Cover banner */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-stone-900 shadow-[0_24px_60px_-30px_rgba(28,25,23,0.6)]">
              <ArtefactCover title={artefact.title} imageUrl={heroImage?.imageUrl} alt={heroImage?.altText} sizes="(max-width: 1024px) 100vw, 800px" hero />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge label={artefact.status} className="bg-white/90" />
                  {artefact.category && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                      <Tag className="h-3 w-3" /> {artefact.category.name}
                    </span>
                  )}
                  {artefact.location && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
                      <MapPin className="h-3 w-3" /> {artefact.location.name}
                    </span>
                  )}
                </div>
                <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{artefact.title}</h1>
              </div>
              {!heroImage && (
                <Link
                  to={`/admin/artefacts/${id}/media`}
                  className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/25"
                >
                  <ImageIcon className="h-3.5 w-3.5" /> Add photos
                </Link>
              )}
            </div>

            {/* Description */}
            <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-stone-900">Description</h2>
                <Link to={`/admin/artefacts/${id}/edit`} className="text-xs font-semibold text-gold-700 hover:text-gold-800">Edit</Link>
              </div>
              {artefact.description ? (
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-stone-600">{artefact.description}</p>
              ) : (
                <p className="text-sm italic text-stone-400">No description yet. Visitors will see only the title.</p>
              )}
              <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-5 sm:grid-cols-4">
                {[
                  { label: "Images", value: artefact.images.length },
                  { label: "Audio guide", value: artefact.audio ? "Uploaded" : "None" },
                  { label: "QR code", value: artefact.qrCode ? (artefact.qrCode.isActive ? "Active" : "Inactive") : "Not yet" },
                  { label: "Created", value: new Date(artefact.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs text-stone-400">{label}</dt>
                    <dd className="mt-0.5 text-sm font-semibold text-stone-800">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Gallery */}
            {artefact.images.length > 1 && (
              <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-stone-900">Gallery</h2>
                  <Link to={`/admin/artefacts/${id}/media`} className="text-xs font-semibold text-gold-700 hover:text-gold-800">Manage</Link>
                </div>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {artefact.images.map((img) => (
                    <div key={img.id} className="aspect-square overflow-hidden rounded-xl bg-stone-100">
                      <img src={img.imageUrl} alt={img.altText ?? ""} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── Side panel ──────────────────────────────── */}
          <aside className="space-y-5 lg:sticky lg:top-0 lg:self-start">
            <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
              <div className="grid grid-cols-2 gap-2">
                <Link to={`/admin/artefacts/${id}/edit`} className="col-span-2">
                  <Button variant="gold" className="w-full justify-center" icon={<Pencil className="h-3.5 w-3.5" />}>Edit artefact</Button>
                </Link>
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  loading={toggling}
                  icon={artefact.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  onClick={toggleStatus}
                >
                  {artefact.status === "active" ? "Unpublish" : "Publish"}
                </Button>
                <a href={`/a/${artefact.uniquePublicId}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" className="w-full justify-center" icon={<ExternalLink className="h-3.5 w-3.5" />}>Preview</Button>
                </a>
              </div>

              <p className="mb-1 mt-5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Content</p>
              <ActionRow href={`/admin/artefacts/${id}/media`} icon={ImageIcon} label="Media" hint={`${artefact.images.length} image${artefact.images.length === 1 ? "" : "s"}`} />
              <ActionRow href={`/admin/artefacts/${id}/audio`} icon={Music} label="Audio guide" hint={artefact.audio ? "Recorded" : "Not recorded"} />
              <ActionRow href={`/admin/artefacts/${id}/translations`} icon={Languages} label="Translations" hint="10 languages available" />

              <p className="mb-1 mt-4 px-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">Publishing</p>
              <ActionRow href={`/admin/artefacts/${id}/qr`} icon={QrCode} label="QR code" hint={artefact.qrCode ? "Ready to print" : "Generate a code"} />
              <ActionRow href={`/admin/artefacts/${id}/history`} icon={History} label="Version history" hint="Restore earlier edits" />

              <button
                onClick={() => setDeleteOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-red-200/70 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete artefact
              </button>
            </div>

            {/* Readiness */}
            <div className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-800">Guide readiness</h2>
                <span className="text-sm font-semibold tabular-nums text-stone-900">{score}%</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-100">
                <div className="h-full rounded-full bg-[#C9A04A] transition-[width] duration-700" style={{ width: `${score}%` }} />
              </div>
              <ul className="mt-4 space-y-1">
                {checks.map((c) => (
                  <li key={c.label}>
                    <Link to={c.href} className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-stone-50">
                      {c.done ? (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      ) : (
                        <Circle className="h-5 w-5 text-stone-300" />
                      )}
                      <span className={c.done ? "text-stone-500 line-through decoration-stone-300" : "text-stone-800"}>{c.label}</span>
                      {c.optional && !c.done && <span className="ml-auto text-[10px] text-stone-400">optional</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Artefact"
        message={`Permanently delete "${artefact.title}"? This will remove all associated images, audio, and QR codes.`}
        loading={deleting}
      />
    </AdminShell>
  );
}
