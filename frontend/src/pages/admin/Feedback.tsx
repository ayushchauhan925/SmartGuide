import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { MessageSquare, ThumbsUp, ThumbsDown, Check, EyeOff, Trash2 } from "lucide-react";

interface Item {
  id: number;
  rating: number;
  comment: string | null;
  status: "pending" | "approved" | "hidden";
  createdAt: string;
  artefact: { id: number; title: string };
}

const FILTERS = ["pending", "approved", "hidden", "all"] as const;

export default function FeedbackPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("pending");
  const [items, setItems] = useState<Item[]>([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/v1/feedback${filter === "all" ? "" : `?status=${filter}`}`);
    const d = await res.json();
    setItems(d.items ?? []);
    setPending(d.pending ?? 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/v1/feedback/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
    if (res.ok) { toast("Updated", "success"); load(); } else toast("Could not update (editor role required)", "error");
  };
  const remove = async (id: number) => {
    const res = await fetch(`/api/v1/feedback/${id}`, { method: "DELETE" });
    if (res.ok) { toast("Deleted", "success"); load(); } else toast("Could not delete", "error");
  };

  return (
    <AdminShell>
      <div className="max-w-4xl space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900">Visitor feedback</h1>
          <p className="mt-0.5 text-sm text-stone-500">{pending} awaiting moderation. Only approved comments are shown publicly.</p>
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm capitalize ${filter === f ? "bg-stone-900 text-white" : "bg-white text-stone-600 border border-stone-300"}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
          {loading ? (
            <p className="p-8 text-center text-sm text-stone-400">Loading…</p>
          ) : items.length === 0 ? (
            <EmptyState icon={<MessageSquare className="h-6 w-6" />} title="No feedback here" description="Visitor ratings and comments will appear here." />
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map((it) => (
                <li key={it.id} className="flex items-start gap-4 px-5 py-4">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${it.rating > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {it.rating > 0 ? <ThumbsUp className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link to={`/admin/artefacts/${it.artefact.id}`} className="text-sm font-semibold text-stone-800 hover:underline">
                      {it.artefact.title}
                    </Link>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-stone-600">{it.comment ?? <span className="italic text-stone-400">No comment</span>}</p>
                    <p className="mt-1 text-xs text-stone-400">{new Date(it.createdAt).toLocaleString()} · {it.status}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {it.status !== "approved" && <Button size="sm" variant="secondary" onClick={() => setStatus(it.id, "approved")} icon={<Check className="h-3.5 w-3.5" />}>Approve</Button>}
                    {it.status !== "hidden" && <Button size="sm" variant="ghost" onClick={() => setStatus(it.id, "hidden")} icon={<EyeOff className="h-3.5 w-3.5" />}>Hide</Button>}
                    <Button size="sm" variant="ghost" onClick={() => remove(it.id)} aria-label="Delete" icon={<Trash2 className="h-3.5 w-3.5" />} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
