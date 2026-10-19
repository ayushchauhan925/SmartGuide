import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Route, Plus, ArrowUp, ArrowDown, X, ExternalLink } from "lucide-react";

interface TourRow { id: number; slug: string; title: string; isPublished: boolean; _count: { stops: number } }
interface Stop { artefactId: number; title: string; note: string }
interface ArtefactOpt { id: number; title: string }

export default function ToursAdminPage() {
  const { toast } = useToast();
  const [tours, setTours] = useState<TourRow[]>([]);
  const [artefacts, setArtefacts] = useState<ArtefactOpt[]>([]);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [published, setPublished] = useState(false);
  const [slug, setSlug] = useState("");
  const [stops, setStops] = useState<Stop[]>([]);
  const [addId, setAddId] = useState("");
  const [busy, setBusy] = useState(false);

  const loadTours = useCallback(async () => {
    const d = await fetch("/api/v1/tours").then((r) => r.json());
    setTours(d.tours ?? []);
  }, []);

  useEffect(() => {
    loadTours();
    fetch("/api/v1/artefacts?limit=100&status=active").then((r) => r.json()).then((d) => setArtefacts(d.artefacts ?? []));
  }, [loadTours]);

  const startNew = () => {
    setEditingId("new"); setTitle(""); setDescription(""); setPublished(false); setSlug(""); setStops([]);
  };

  const edit = async (id: number) => {
    const d = await fetch(`/api/v1/tours/${id}`).then((r) => r.json());
    const t = d.tour;
    setEditingId(id); setTitle(t.title); setDescription(t.description ?? ""); setPublished(t.isPublished); setSlug(t.slug);
    setStops(t.stops.map((s: { artefactId: number; note: string | null; artefact: { title: string } }) => ({
      artefactId: s.artefactId, title: s.artefact.title, note: s.note ?? "",
    })));
  };

  const move = (i: number, dir: -1 | 1) => {
    setStops((cur) => {
      const next = [...cur];
      const j = i + dir;
      if (j < 0 || j >= next.length) return cur;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const addStop = () => {
    const a = artefacts.find((x) => String(x.id) === addId);
    if (!a || stops.some((s) => s.artefactId === a.id)) return;
    setStops([...stops, { artefactId: a.id, title: a.title, note: "" }]);
    setAddId("");
  };

  const save = async () => {
    setBusy(true);
    try {
      let id = editingId;
      if (id === "new") {
        const res = await fetch("/api/v1/tours", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, description, isPublished: published }),
        });
        if (!res.ok) throw new Error();
        id = (await res.json()).tour.id;
      }
      const res = await fetch(`/api/v1/tours/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, description, isPublished: published,
          stops: stops.map((s) => ({ artefactId: s.artefactId, note: s.note })),
        }),
      });
      if (!res.ok) throw new Error();
      toast("Tour saved", "success");
      setEditingId(null);
      loadTours();
    } catch {
      toast("Could not save tour", "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (typeof editingId !== "number" || !confirm("Delete this tour?")) return;
    const res = await fetch(`/api/v1/tours/${editingId}`, { method: "DELETE" });
    if (res.ok) { toast("Tour deleted", "success"); setEditingId(null); loadTours(); }
  };

  return (
    <AdminShell>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900">Guided tours</h1>
            <p className="mt-0.5 text-sm text-stone-500">Ordered routes visitors can follow</p>
          </div>
          <Button onClick={startNew} icon={<Plus className="h-4 w-4" />}>New tour</Button>
        </div>

        {editingId !== null && (
          <div className="space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <Textarea label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="h-4 w-4" />
              Published (visible to visitors)
            </label>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">Stops ({stops.length})</p>
              <ol className="space-y-2">
                {stops.map((s, i) => (
                  <li key={s.artefactId} className="flex items-start gap-2 rounded-lg border border-stone-200 p-2">
                    <span className="mt-1.5 w-5 text-center text-xs font-bold text-stone-400">{i + 1}</span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="truncate text-sm font-medium text-stone-800">{s.title}</p>
                      <input
                        value={s.note}
                        onChange={(e) => setStops((cur) => cur.map((x, k) => (k === i ? { ...x, note: e.target.value } : x)))}
                        placeholder="Optional note for this stop"
                        className="w-full rounded border border-stone-200 px-2 py-1 text-xs"
                      />
                    </div>
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="p-1 text-stone-500 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === stops.length - 1} aria-label="Move down" className="p-1 text-stone-500 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                    <button onClick={() => setStops(stops.filter((_, k) => k !== i))} aria-label="Remove stop" className="p-1 text-red-500"><X className="h-4 w-4" /></button>
                  </li>
                ))}
              </ol>
              <div className="mt-3 flex gap-2">
                <select value={addId} onChange={(e) => setAddId(e.target.value)} className="flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm" aria-label="Artefact to add">
                  <option value="">Add an artefact…</option>
                  {artefacts.filter((a) => !stops.some((s) => s.artefactId === a.id)).map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
                <Button variant="secondary" onClick={addStop} disabled={!addId}>Add</Button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button onClick={save} loading={busy} disabled={!title.trim()}>Save tour</Button>
              <Button variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
              {typeof editingId === "number" && (
                <>
                  <a href={`/tours/${slug}`} target="_blank" rel="noopener noreferrer" className="ml-auto text-sm text-stone-500 hover:underline">
                    <ExternalLink className="mr-1 inline h-3.5 w-3.5" />View
                  </a>
                  <Button variant="danger" size="sm" onClick={remove}>Delete</Button>
                </>
              )}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
          {tours.length === 0 ? (
            <EmptyState icon={<Route className="h-6 w-6" />} title="No tours yet" description="Create a tour to guide visitors through a set of artefacts." />
          ) : (
            <ul className="divide-y divide-stone-100">
              {tours.map((t) => (
                <li key={t.id}>
                  <button onClick={() => edit(t.id)} className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-stone-50">
                    <Route className="h-4 w-4 text-stone-400" />
                    <span className="flex-1 font-medium text-stone-800">{t.title}</span>
                    <span className="text-xs text-stone-400">{t._count.stops} stops</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${t.isPublished ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                      {t.isPublished ? "Published" : "Draft"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
