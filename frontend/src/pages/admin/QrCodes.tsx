import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { QrCode, ExternalLink, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface QREntry {
  id: number;
  artefactId: number;
  publicUrl: string;
  isActive: boolean;
  createdAt: string;
  artefact: { title: string; uniquePublicId: string; status: string } | null;
}

export default function QRCodesPage() {
  const { toast } = useToast();
  const [qrs, setQrs] = useState<QREntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/v1/qr-codes")
      .then((r) => r.json())
      .then((d) => { setQrs(d.qrCodes ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const copyUrl = async (id: number, url: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const el = document.createElement("textarea");
        el.value = url; el.style.position = "fixed"; el.style.opacity = "0";
        document.body.appendChild(el); el.select();
        document.execCommand("copy"); document.body.removeChild(el);
      }
      setCopied(id);
      toast("URL copied to clipboard");
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast("Could not copy — copy manually", "error");
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-900 tracking-tight">QR Codes</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {qrs.length} {qrs.length === 1 ? "code" : "codes"} generated
            </p>
          </div>
          <Link to="/admin/qr-codes/print">
            <Button variant="secondary">Print all QR codes</Button>
          </Link>
        </div>

        {/* Info card */}
        <div className="rounded-xl border border-gold-200 bg-gold-50 px-5 py-4">
          <p className="text-sm text-gold-800">
            <strong>Tip:</strong> QR codes are generated automatically when you access an artefact&rsquo;s QR page.
            Navigate to{" "}
            <Link to="/admin/artefacts" className="underline font-semibold">
              Artefacts
            </Link>
            {" "}→ select an artefact → QR Code to generate and download.
          </p>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
          {loading ? (
            <TableSkeleton rows={5} />
          ) : qrs.length === 0 ? (
            <EmptyState
              icon={<QrCode className="h-6 w-6" />}
              title="No QR codes yet"
              description="QR codes are created when you generate them for individual artefacts."
              action={
                <Link to="/admin/artefacts">
                  <Button variant="secondary" size="sm">Go to Artefacts</Button>
                </Link>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Artefact</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden md:table-cell">Public URL</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-stone-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {qrs.map((qr) => (
                  <tr key={qr.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-stone-900 truncate max-w-[180px]">
                          {qr.artefact?.title ?? "Unknown artefact"}
                        </p>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {new Date(qr.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <code className="text-xs text-stone-500 font-mono truncate max-w-[200px] block">
                        {qr.publicUrl.slice(0, 40)}{qr.publicUrl.length > 40 ? "…" : ""}
                      </code>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge label={qr.isActive ? "active" : "inactive"} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => copyUrl(qr.id, qr.publicUrl)}
                          className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                          title="Copy URL"
                        >
                          {copied === qr.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <Link to={`/admin/artefacts/${qr.artefactId}/qr`}>
                          <button
                            className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                            title="View QR"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        {qr.artefact?.uniquePublicId && (
                          <a
                            href={`/a/${qr.artefact.uniquePublicId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                            title="View public page"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
