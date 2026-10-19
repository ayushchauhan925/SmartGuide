import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { ArrowLeft, History, RotateCcw } from "lucide-react";

interface Snapshot { title: string; description: string | null; status: string; metadata: Record<string, string> | null }
interface Version { id: number; createdAt: string; user: { name: string } | null; snapshot: Snapshot }

export default function HistoryPage() {
  const { id } = useParams() as { id: string };
  const { toast } = useToast();
  const [versions, setVersions] = useState<Version[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    const d = await fetch(`/api/v1/artefacts/${id}/versions`).then((r) => r.json());
    setVersions(d.versions ?? []);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const restore = async (versionId: number) => {
    if (!confirm("Restore this version? The current state will be saved to history first.")) return;
    setBusy(versionId);
    const res = await fetch(`/api/v1/artefacts/${id}/versions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ versionId }),
    });
    setBusy(null);
    if (res.ok) { toast("Version restored", "success"); load(); } else toast("Restore failed", "error");
  };

  return (
    <AdminShell>
      <div className="max-w-3xl space-y-6">
        <Link to={`/admin/artefacts/${id}`} className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900">
          <ArrowLeft className="h-4 w-4" /> Back to artefact
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900">Version history</h1>
          <p className="mt-0.5 text-sm text-stone-500">A snapshot is saved before every edit. Restore any earlier state.</p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
          {versions.length === 0 ? (
            <EmptyState icon={<History className="h-6 w-6" />} title="No history yet" description="Versions appear after the artefact is edited." />
          ) : (
            <ul className="divide-y divide-stone-100">
              {versions.map((v) => (
                <li key={v.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <button onClick={() => setOpen(open === v.id ? null : v.id)} className="min-w-0 flex-1 text-left">
                      <p className="truncate text-sm font-semibold text-stone-800">{v.snapshot.title}</p>
                      <p className="text-xs text-stone-400">
                        {new Date(v.createdAt).toLocaleString()} · saved before an edit by {v.user?.name ?? "unknown"} · {v.snapshot.status}
                      </p>
                    </button>
                    <Button size="sm" variant="secondary" loading={busy === v.id} onClick={() => restore(v.id)} icon={<RotateCcw className="h-3.5 w-3.5" />}>
                      Restore
                    </Button>
                  </div>
                  {open === v.id && (
                    <div className="mt-3 space-y-2 rounded-lg bg-stone-50 p-3 text-sm text-stone-600">
                      <p className="whitespace-pre-wrap">{v.snapshot.description ?? <em className="text-stone-400">No description</em>}</p>
                      {v.snapshot.metadata && (
                        <dl className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(v.snapshot.metadata).map(([k, val]) => (
                            <div key={k}><dt className="inline font-semibold">{k}: </dt><dd className="inline">{val}</dd></div>
                          ))}
                        </dl>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
