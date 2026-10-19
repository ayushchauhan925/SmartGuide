import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { FileUpload } from "@/components/ui/FileUpload";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface AudioRecord {
  audioUrl: string;
  duration: number | null;
  createdAt: string;
}

export default function AudioPage() {
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const navigate = useNavigate();
  const [audio, setAudio] = useState<AudioRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadAudio = async () => {
    const res = await fetch(`/api/v1/artefacts/${id}`);
    const data = await res.json();
    setAudio(data.artefact?.audio ?? null);
    setLoading(false);
  };

  useEffect(() => { loadAudio(); }, [id]);

  const handleUpload = async (files: File[]) => {
    if (!files[0]) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("audio", files[0]);
    try {
      const res = await fetch(`/api/v1/artefacts/${id}/audio`, { method: "POST", body: fd });
      if (res.ok) {
        toast("Audio uploaded!");
        loadAudio();
      } else {
        const data = await res.json();
        toast(data.error?.message ?? "Upload failed", "error");
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/v1/artefacts/${id}/audio`, { method: "DELETE" });
    if (res.ok) {
      toast("Audio removed");
      setAudio(null);
      setDeleteOpen(false);
    } else {
      toast("Delete failed", "error");
    }
    setDeleting(false);
  };

  const fmtDur = (s: number | null) => {
    if (!s) return "Unknown";
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <AdminShell>
      <div className="max-w-xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
          <h1 className="text-2xl font-bold text-gray-900">Audio Guide</h1>
        </div>

        {loading ? (
          <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ) : audio ? (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Current Audio Guide</p>
                <p className="text-xs text-gray-400 mt-0.5">Duration: {fmtDur(audio.duration)}</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Remove</Button>
            </div>
            <audio controls src={audio.audioUrl} className="w-full" />
            <p className="text-xs text-gray-400">Uploaded {new Date(audio.createdAt).toLocaleDateString()}</p>
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 mb-3">Replace with a new file:</p>
              <FileUpload
                accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
                onFiles={handleUpload}
                hint="MP3, WAV, OGG — up to 20MB"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-indigo-600 mt-2 animate-pulse">Uploading…</p>}
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-6 space-y-4">
            <p className="text-sm text-gray-500">No audio guide uploaded yet.</p>
            <FileUpload
              accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg"
              onFiles={handleUpload}
              label="Upload audio guide"
              hint="MP3, WAV, OGG — up to 20MB"
              disabled={uploading}
            />
            {uploading && <p className="text-sm text-indigo-600 animate-pulse">Uploading…</p>}
          </div>
        )}
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Remove Audio"
        message="Are you sure you want to remove the audio guide for this artefact?"
        confirmLabel="Remove"
        loading={deleting}
      />
    </AdminShell>
  );
}
