import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { Artefact } from "@/lib/types";
import { Pencil, QrCode, Trash2, Upload, X, Volume2 } from "lucide-react";

export default function ArtefactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [artefact, setArtefact] = useState<Artefact | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [deletingImage, setDeletingImage] = useState<number | null>(null);

  const load = async () => {
    try {
      const data = await api.get<{ artefact: Artefact }>(`/artefacts/${id}`);
      setArtefact(data.artefact);
    } catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    try {
      await api.delete(`/artefacts/${id}`);
      toast("Artefact deleted");
      navigate("/admin/artefacts");
    } catch { toast("Failed to delete", "error"); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploadingImages(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append("images", f);
      await api.upload(`/artefacts/${id}/images`, fd);
      toast("Images uploaded");
      load();
    } catch { toast("Upload failed", "error"); }
    finally { setUploadingImages(false); e.target.value = ""; }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAudio(true);
    try {
      const fd = new FormData();
      fd.append("audio", file);
      await api.upload(`/artefacts/${id}/audio`, fd);
      toast("Audio uploaded");
      load();
    } catch { toast("Upload failed", "error"); }
    finally { setUploadingAudio(false); e.target.value = ""; }
  };

  const handleDeleteImage = async (imageId: number) => {
    setDeletingImage(imageId);
    try {
      await api.delete(`/artefacts/${id}/images/${imageId}`);
      toast("Image removed");
      load();
    } catch { toast("Failed to remove image", "error"); }
    finally { setDeletingImage(null); }
  };

  if (loading) return <div style={{ padding: "48px 32px", color: "#A8A29E" }}>Loading…</div>;
  if (!artefact) return <div style={{ padding: "48px 32px", color: "#A8A29E" }}>Not found</div>;

  const meta = artefact.metadata as Record<string, string> | null;

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 32px" }}>
      {/* Breadcrumb */}
      <p style={{ fontSize: "12px", color: "#A8A29E", marginBottom: "20px" }}>
        <Link to="/admin/artefacts" style={{ color: "#A8A29E" }}>Artefacts</Link> / {artefact.title}
      </p>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "28px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", fontWeight: 400, color: "#1C1917" }}>{artefact.title}</h1>
            <Badge variant={artefact.status} />
          </div>
          {artefact.category && <p style={{ fontSize: "13px", color: "#78716C" }}>{artefact.category.name}</p>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Link to={`/admin/artefacts/${id}/edit`} style={actionBtn}>
            <Pencil size={14} /> Edit
          </Link>
          <Link to={`/admin/artefacts/${id}/qr`} style={actionBtn}>
            <QrCode size={14} /> QR Code
          </Link>
          <Link to={`/a/${artefact.uniquePublicId}`} target="_blank" style={actionBtn}>
            View public
          </Link>
          <button onClick={() => setDeleteOpen(true)} style={{ ...actionBtn, color: "#DC2626", border: "1px solid #FECACA", cursor: "pointer", fontFamily: "inherit" } as React.CSSProperties}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
        {/* Left column */}
        <div>
          {/* Images */}
          <section style={{ marginBottom: "28px" }}>
            <p style={sectionLabel}>Images</p>
            {artefact.images.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "10px" }}>
                {artefact.images.map((img) => (
                  <div key={img.id} style={{ position: "relative" }}>
                    <img src={img.imageUrl} alt={img.altText ?? ""} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "4px", border: "1px solid #E7E5E0" }} />
                    <button
                      onClick={() => handleDeleteImage(img.id)} disabled={deletingImage === img.id}
                      style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: "20px", height: "20px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#C0952C", cursor: "pointer" }}>
              <Upload size={13} />
              {uploadingImages ? "Uploading…" : "Upload images"}
              <input type="file" multiple accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} disabled={uploadingImages} />
            </label>
          </section>

          {/* Audio */}
          <section style={{ marginBottom: "28px" }}>
            <p style={sectionLabel}>Audio guide</p>
            {artefact.audio && (
              <div style={{ marginBottom: "8px", background: "#1C1917", borderRadius: "6px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Volume2 size={16} color="#C0952C" />
                <audio src={artefact.audio.audioUrl} controls style={{ flex: 1, height: "28px" }} />
              </div>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#C0952C", cursor: "pointer" }}>
              <Upload size={13} />
              {uploadingAudio ? "Uploading…" : artefact.audio ? "Replace audio" : "Upload audio"}
              <input type="file" accept="audio/*" onChange={handleAudioUpload} style={{ display: "none" }} disabled={uploadingAudio} />
            </label>
          </section>
        </div>

        {/* Right column — metadata */}
        <div>
          {artefact.description && (
            <section style={{ marginBottom: "24px" }}>
              <p style={sectionLabel}>Description</p>
              <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.7 }}>{artefact.description}</p>
            </section>
          )}

          {(artefact.location || meta) && (
            <section style={{ marginBottom: "24px" }}>
              <p style={sectionLabel}>Details</p>
              <dl style={{ fontSize: "13.5px" }}>
                {artefact.location && (
                  <div style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "6px", padding: "8px 0", borderBottom: "1px solid #F5F4F2" }}>
                    <dt style={{ color: "#A8A29E" }}>Location</dt>
                    <dd style={{ color: "#1C1917" }}>{artefact.location.name}</dd>
                  </div>
                )}
                {meta && Object.entries(meta).map(([k, v]) => (
                  <div key={k} style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "6px", padding: "8px 0", borderBottom: "1px solid #F5F4F2" }}>
                    <dt style={{ color: "#A8A29E", textTransform: "capitalize" }}>{k}</dt>
                    <dd style={{ color: "#1C1917" }}>{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {artefact.qrCode && (
            <section>
              <p style={sectionLabel}>QR Code</p>
              <p style={{ fontSize: "13px", color: "#57534E" }}>
                {artefact.qrCode.scanCount} scan{artefact.qrCode.scanCount !== 1 ? "s" : ""} &middot;{" "}
                <Badge variant={artefact.qrCode.isActive ? "active" : "inactive"} label={artefact.qrCode.isActive ? "Active" : "Inactive"} />
              </p>
            </section>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteOpen}
        title="Delete artefact"
        description={`Permanently delete "${artefact.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.14em", color: "#A8A29E",
  marginBottom: "10px", paddingBottom: "8px", borderBottom: "1px solid #E7E5E0",
};

const actionBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px",
  border: "1px solid #E7E5E0", borderRadius: "5px", background: "#fff",
  fontSize: "13px", color: "#57534E", textDecoration: "none",
};
