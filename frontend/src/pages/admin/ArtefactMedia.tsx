import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface ArtefactImage {
  id: number;
  imageUrl: string;
  altText: string | null;
  displayOrder: number;
}

export default function MediaPage() {
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const navigate = useNavigate();
  const [images, setImages] = useState<ArtefactImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadImages = async () => {
    const res = await fetch(`/api/v1/artefacts/${id}/images`);
    const data = await res.json();
    setImages(data.images ?? []);
    setLoading(false);
  };

  useEffect(() => { loadImages(); }, [id]);

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("images", f));
      const res = await fetch(`/api/v1/artefacts/${id}/images`, { method: "POST", body: fd });
      if (res.ok) {
        toast(`${files.length} image(s) uploaded`);
        loadImages();
      } else {
        const data = await res.json();
        toast(data.error?.message ?? "Upload failed", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/v1/images/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast("Image deleted");
      setDeleteId(null);
      loadImages();
    } else {
      toast("Delete failed", "error");
    }
    setDeleting(false);
  };

  return (
    <AdminShell>
      <div className="max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
          <h1 className="text-2xl font-bold text-gray-900">Image Manager</h1>
        </div>

        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">Upload Images</h2>
          <FileUpload
            accept="image/jpeg,image/png,image/webp"
            multiple
            onFiles={handleUpload}
            hint="JPEG, PNG, WebP — up to 10MB each"
            disabled={uploading}
          />
          {uploading && <p className="text-sm text-indigo-600 animate-pulse">Uploading…</p>}
        </div>

        <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Images ({images.length})
          </h2>
          {loading ? (
            <div className="grid grid-cols-3 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : images.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No images yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((img) => (
                <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img.imageUrl} alt={img.altText ?? ""} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-end p-2">
                    <button
                      onClick={() => setDeleteId(img.id)}
                      className="w-full rounded bg-red-500 py-1 text-xs text-white hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                  {img.displayOrder === 0 && (
                    <div className="absolute top-1.5 left-1.5 rounded bg-indigo-600 px-1.5 py-0.5 text-[10px] text-white">Hero</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Image"
        message="Are you sure you want to delete this image?"
        loading={deleting}
      />
    </AdminShell>
  );
}
