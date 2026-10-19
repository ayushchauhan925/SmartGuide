import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface QrData {
  qrCode: { publicUrl: string; isActive: boolean; qrImagePath: string | null } | null;
  uniquePublicId: string;
  dataUrl?: string;
}

export default function QrPage() {
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState<QrData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [artefactTitle, setArtefactTitle] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/artefacts/${id}/qr`),
      fetch(`/api/v1/artefacts/${id}`),
    ]).then(async ([qRes, aRes]) => {
      const qData = await qRes.json();
      const aData = await aRes.json();
      setData(qData);
      setArtefactTitle(aData.artefact?.title ?? "");
      setLoading(false);
    });
  }, [id]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/v1/artefacts/${id}/qr`, { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setData({ qrCode: result.qrCode, uniquePublicId: data?.uniquePublicId ?? "" });
        setQrDataUrl(result.dataUrl);
        toast("QR code generated!");
      } else {
        toast(result.error?.message ?? "Generation failed", "error");
      }
    } finally {
      setGenerating(false);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement("textarea");
        el.value = url;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      toast("URL copied to clipboard!");
    } catch {
      toast("Could not copy — please copy manually", "error");
    }
  };

  const downloadQr = () => {
    const url = qrDataUrl ?? (data?.qrCode?.qrImagePath ? `/api/v1/files/${data.qrCode.qrImagePath}` : null);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${artefactTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  };

  const printQr = () => { window.print(); };

  const appUrl = import.meta.env.VITE_APP_URL ?? window.location.origin;

  return (
    <AdminShell>
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>← Back</Button>
          <h1 className="text-2xl font-bold text-gray-900">QR Code</h1>
        </div>

        {loading ? (
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="rounded-xl bg-white border border-gray-100 shadow-sm p-6 space-y-5">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Artefact</p>
              <p className="text-lg font-semibold text-gray-900">{artefactTitle}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Public URL</p>
              <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-600 flex-1 truncate font-mono">
                  {appUrl}/a/{data?.uniquePublicId}
                </span>
                <button
                  onClick={() => copyUrl(`${appUrl}/a/${data?.uniquePublicId}`)}
                  className="text-indigo-600 hover:text-indigo-800 transition shrink-0"
                  aria-label="Copy URL"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {(qrDataUrl || data?.qrCode) && (
              <div className="flex flex-col items-center gap-4 py-4 border border-gray-100 rounded-xl" id="qr-print-area">
                <img
                  src={qrDataUrl ?? `/api/v1/files/${data!.qrCode!.qrImagePath}`}
                  alt="QR Code"
                  className="h-52 w-52"
                />
                <div className="text-center">
                  <p className="text-base font-bold text-gray-900">{artefactTitle}</p>
                  <p className="text-sm text-gray-500">Scan to Explore</p>
                  <p className="text-xs text-indigo-600 mt-0.5">SmartGuide</p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button onClick={generate} loading={generating}>
                {data?.qrCode ? "Regenerate QR" : "Generate QR Code"}
              </Button>
              {(qrDataUrl || data?.qrCode) && (
                <>
                  <Button variant="secondary" onClick={downloadQr}>Download PNG</Button>
                  <Button variant="secondary" onClick={printQr}>Print</Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #qr-print-area { display: flex !important; position: fixed; inset: 0; align-items: center; justify-content: center; }
        }
      `}</style>
    </AdminShell>
  );
}
