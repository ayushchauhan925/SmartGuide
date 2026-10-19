import { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ArtefactCover } from "@/components/visitor/ArtefactCover";
import { useToast } from "@/components/ui/Toast";
import { Package, Plus, Search, Pencil, Trash2, Eye, ChevronDown, Copy, Download, Upload, QrCode } from "lucide-react";

interface Artefact {
  id: number;
  uniquePublicId: string;
  title: string;
  status: string;
  createdAt: string;
  category: { name: string } | null;
  location: { name: string } | null;
  images: Array<{ imageUrl: string; altText: string | null }>;
}

const STATUS_OPTIONS = ["", "active", "inactive", "draft"];

export default function ArtefactsPage() {
  const { toast } = useToast();
  const [artefacts, setArtefacts] = useState<Artefact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50" });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/v1/artefacts?${params}`);
    const data = await res.json();
    setArtefacts(data.artefacts ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setSelected(new Set()); }, [search, statusFilter]);

  const toggleOne = (id: number) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  const allSelected = artefacts.length > 0 && artefacts.every((a) => selected.has(a.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(artefacts.map((a) => a.id)));

  const runBulk = async (action: "active" | "inactive" | "draft" | "delete") => {
    setBulkBusy(true);
    try {
      const res = await fetch("/api/v1/artefacts/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message);
      toast(`${data.count} artefact${data.count === 1 ? "" : "s"} ${action === "delete" ? "deleted" : "updated"}`);
      setSelected(new Set());
      setBulkDeleteOpen(false);
      load();
    } catch (e) {
      toast(e instanceof Error && e.message ? e.message : "Bulk action failed", "error");
    } finally {
      setBulkBusy(false);
    }
  };

  const duplicate = async (id: number) => {
    const res = await fetch(`/api/v1/artefacts/${id}/duplicate`, { method: "POST" });
    if (res.ok) { toast("Duplicated as draft"); load(); } else toast("Duplicate failed", "error");
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const res = await fetch("/api/v1/artefacts/import", { method: "POST", body: text });
    const data = await res.json();
    if (res.ok) {
      toast(`Imported: ${data.created} created, ${data.updated} updated`);
      load();
    } else if (data.errors?.length) {
      toast(`Row ${data.errors[0].row}: ${data.errors[0].message}${data.errors.length > 1 ? ` (+${data.errors.length - 1} more)` : ""}`, "error");
    } else {
      toast(data.error?.message ?? "Import failed", "error");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/artefacts/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        toast("Artefact deleted");
        setDeleteId(null);
        load();
      } else {
        toast("Delete failed", "error");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-5xl">
        {/* ── Header ──────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-900 tracking-tight">Artefacts</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {total} {total === 1 ? "artefact" : "artefacts"} in your collection
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a href="/api/v1/artefacts/export">
              <Button variant="secondary" icon={<Download className="h-3.5 w-3.5" />}>Export CSV</Button>
            </a>
            <Button variant="secondary" icon={<Upload className="h-3.5 w-3.5" />} onClick={() => fileRef.current?.click()}>
              Import CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
            />
            <Link to="/admin/artefacts/new">
              <Button icon={<Plus className="h-3.5 w-3.5" />}>Add Artefact</Button>
            </Link>
          </div>
        </div>

        {/* ── Bulk action bar ─────────────────────────── */}
        {selected.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-stone-200 bg-stone-900 px-4 py-2.5 text-sm text-white">
            <span className="mr-2 font-medium">{selected.size} selected</span>
            <Button size="sm" variant="secondary" loading={bulkBusy} onClick={() => runBulk("active")}>Publish</Button>
            <Button size="sm" variant="secondary" loading={bulkBusy} onClick={() => runBulk("inactive")}>Unpublish</Button>
            <Button size="sm" variant="secondary" loading={bulkBusy} onClick={() => runBulk("draft")}>Mark draft</Button>
            <Link to={`/admin/qr-codes/print?ids=${[...selected].join(",")}`}>
              <Button size="sm" variant="secondary" icon={<QrCode className="h-3.5 w-3.5" />}>Print QR</Button>
            </Link>
            <Button size="sm" variant="danger" onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
            <button onClick={() => setSelected(new Set())} className="ml-auto text-xs text-stone-300 hover:text-white">Clear</button>
          </div>
        )}

        {/* ── Filters ─────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search artefacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-400 transition-colors"
            />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none rounded-lg border border-stone-300 bg-white pl-3.5 pr-9 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-400 transition-colors cursor-pointer"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : "All statuses"}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Mobile card list (hidden on md+) ────────── */}
        <div className="md:hidden space-y-2">
          {loading ? (
            <div className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
              <TableSkeleton rows={4} />
            </div>
          ) : artefacts.length === 0 ? (
            <div className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
              <EmptyState
                icon={<Package className="h-6 w-6" />}
                title={search || statusFilter ? "No artefacts match your filters" : "No artefacts yet"}
                description={
                  search || statusFilter
                    ? "Try adjusting your search or filter criteria."
                    : "Start building your collection by adding your first exhibit."
                }
                action={
                  !search && !statusFilter ? (
                    <Link to="/admin/artefacts/new">
                      <Button icon={<Plus className="h-3.5 w-3.5" />} size="sm">Add Artefact</Button>
                    </Link>
                  ) : undefined
                }
              />
            </div>
          ) : (
            artefacts.map((a) => (
              <div key={a.id} className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
                <Link to={`/admin/artefacts/${a.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-stone-50">
                  <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-stone-900 shrink-0 shadow-sm">
                    <ArtefactCover title={a.title} imageUrl={a.images?.[0]?.imageUrl} sizes="48px" thumb />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-900 truncate text-sm">{a.title}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {a.category?.name ?? "—"} · {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <Badge label={a.status} />
                </Link>
                <div className="flex border-t border-stone-100 divide-x divide-stone-100">
                  <Link to={`/admin/artefacts/${a.id}`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-stone-500 hover:bg-stone-50 active:bg-stone-100 transition-colors">
                    <Eye className="h-3.5 w-3.5" /> View
                  </Link>
                  <Link to={`/admin/artefacts/${a.id}/edit`} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-stone-500 hover:bg-stone-50 active:bg-stone-100 transition-colors">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Link>
                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-red-400 hover:bg-red-50 active:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Desktop table (hidden on mobile) ────────── */}
        <div className="hidden md:block rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
          {loading ? (
            <TableSkeleton rows={6} />
          ) : artefacts.length === 0 ? (
            <EmptyState
              icon={<Package className="h-6 w-6" />}
              title={search || statusFilter ? "No artefacts match your filters" : "No artefacts yet"}
              description={
                search || statusFilter
                  ? "Try adjusting your search or filter criteria."
                  : "Start building your collection by adding your first exhibit."
              }
              action={
                !search && !statusFilter ? (
                  <Link to="/admin/artefacts/new">
                    <Button icon={<Plus className="h-3.5 w-3.5" />} size="sm">Add Artefact</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  <th className="w-10 pl-5 py-3">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" className="h-4 w-4 cursor-pointer" />
                  </th>
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Artefact</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden lg:table-cell">Location</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Status</th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {artefacts.map((a) => (
                  <tr key={a.id} className={`hover:bg-stone-50/60 transition-colors ${selected.has(a.id) ? "bg-gold-50/40" : ""}`}>
                    <td className="w-10 pl-5 py-3.5">
                      <input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleOne(a.id)} aria-label={`Select ${a.title}`} className="h-4 w-4 cursor-pointer" />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-stone-900 shrink-0 shadow-sm">
                          <ArtefactCover title={a.title} imageUrl={a.images?.[0]?.imageUrl} sizes="44px" thumb />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate max-w-[200px]">{a.title}</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 hidden md:table-cell">{a.category?.name ?? <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3.5 text-stone-500 hidden lg:table-cell">{a.location?.name ?? <span className="text-stone-300">—</span>}</td>
                    <td className="px-4 py-3.5"><Badge label={a.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/admin/artefacts/${a.id}`}>
                          <button className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors" title="View">
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <Link to={`/admin/artefacts/${a.id}/edit`}>
                          <button className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors" title="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <button onClick={() => duplicate(a.id)} className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors" title="Duplicate">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Artefact"
        message="This will permanently remove the artefact and all associated images, audio files, and QR codes. This action cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
      <ConfirmModal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => runBulk("delete")}
        title={`Delete ${selected.size} artefacts`}
        message="This permanently removes the selected artefacts with their images, audio, translations and QR codes. This cannot be undone."
        confirmLabel="Delete all"
        loading={bulkBusy}
      />
    </AdminShell>
  );
}
