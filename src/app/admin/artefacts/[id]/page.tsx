"use client";
import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import {
  ChevronLeft, Pencil, QrCode, Image as ImageIcon, Music, ExternalLink, Trash2,
  Package, Eye, EyeOff,
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
  images: Array<{ id: number; imageUrl: string; altText: string | null; displayOrder: number }>;
  audio: { audioUrl: string; duration: number | null } | null;
  qrCode: { publicUrl: string; isActive: boolean } | null;
}

export default function ArtefactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
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
      router.push("/admin/artefacts");
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
        <div className="max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid md:grid-cols-3 gap-6">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (!artefact) {
    return (
      <AdminShell>
        <div className="flex flex-col items-center justify-center py-20 text-stone-500">
          <Package className="h-10 w-10 text-stone-300 mb-3" />
          <p className="text-sm font-semibold text-stone-700">Artefact not found</p>
          <Link href="/admin/artefacts" className="mt-3">
            <Button variant="secondary" size="sm">Back to artefacts</Button>
          </Link>
        </div>
      </AdminShell>
    );
  }

  const heroImage = artefact.images[0];

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="h-8 w-8 rounded-lg border border-stone-200 bg-white flex items-center justify-center text-stone-500 hover:text-stone-800 hover:bg-stone-50 transition-colors shadow-sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-stone-900 truncate">{artefact.title}</h1>
          </div>
          <Badge label={artefact.status} />
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Hero image */}
          <div className="md:col-span-1">
            <div className="aspect-square rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
              {heroImage ? (
                <img
                  src={heroImage.imageUrl}
                  alt={heroImage.altText ?? artefact.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-stone-400">
                  <Package className="h-10 w-10" strokeWidth={1} />
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="md:col-span-2 rounded-xl bg-white border border-stone-200 shadow-sm p-5 space-y-4">
            {/* Meta row */}
            {(artefact.category || artefact.location) && (
              <div className="flex flex-wrap items-center gap-2">
                {artefact.category && (
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                    {artefact.category.name}
                  </span>
                )}
                {artefact.location && (
                  <span className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600">
                    {artefact.location.name}
                  </span>
                )}
              </div>
            )}

            {artefact.description && (
              <p className="text-sm text-stone-600 leading-relaxed">{artefact.description}</p>
            )}

            {/* Info grid */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs border-t border-stone-100 pt-4">
              {[
                { label: "Public ID", value: <code className="font-mono text-stone-700 text-[11px]">{artefact.uniquePublicId.slice(0, 12)}…</code> },
                { label: "Created", value: new Date(artefact.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) },
                { label: "Images", value: `${artefact.images.length} file${artefact.images.length !== 1 ? "s" : ""}` },
                { label: "Audio guide", value: artefact.audio ? "Uploaded" : "None" },
                { label: "QR code", value: artefact.qrCode ? (artefact.qrCode.isActive ? "Active" : "Inactive") : "Not generated" },
                { label: "Last updated", value: new Date(artefact.updatedAt).toLocaleDateString() },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-stone-400 mb-0.5">{label}</dt>
                  <dd className="text-stone-700">{value}</dd>
                </div>
              ))}
            </dl>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-3 border-t border-stone-100">
              <Link href={`/admin/artefacts/${id}/edit`}>
                <Button size="sm" icon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>
              </Link>
              <Link href={`/admin/artefacts/${id}/qr`}>
                <Button variant="secondary" size="sm" icon={<QrCode className="h-3.5 w-3.5" />}>QR Code</Button>
              </Link>
              <Link href={`/admin/artefacts/${id}/media`}>
                <Button variant="secondary" size="sm" icon={<ImageIcon className="h-3.5 w-3.5" />}>Media</Button>
              </Link>
              <Link href={`/admin/artefacts/${id}/audio`}>
                <Button variant="secondary" size="sm" icon={<Music className="h-3.5 w-3.5" />}>Audio</Button>
              </Link>
              <Button
                variant="secondary"
                size="sm"
                loading={toggling}
                icon={artefact.status === "active" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                onClick={toggleStatus}
              >
                {artefact.status === "active" ? "Unpublish" : "Publish"}
              </Button>
              <a href={`/a/${artefact.uniquePublicId}`} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" icon={<ExternalLink className="h-3.5 w-3.5" />}>
                  Public page
                </Button>
              </a>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Image gallery preview */}
        {artefact.images.length > 1 && (
          <div className="rounded-xl bg-white border border-stone-200 shadow-sm p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3">
              All Images ({artefact.images.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {artefact.images.map((img) => (
                <div key={img.id} className="h-16 w-16 rounded-lg overflow-hidden bg-stone-100 border border-stone-200">
                  <img src={img.imageUrl} alt={img.altText ?? ""} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
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
