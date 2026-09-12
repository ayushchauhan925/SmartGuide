"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Package, Plus, Search, Pencil, Trash2, Eye, ChevronDown } from "lucide-react";

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
            <h1 className="font-display text-2xl font-bold text-stone-900 tracking-tight">Artefacts</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {total} {total === 1 ? "artefact" : "artefacts"} in your collection
            </p>
          </div>
          <Link href="/admin/artefacts/new">
            <Button icon={<Plus className="h-3.5 w-3.5" />}>Add Artefact</Button>
          </Link>
        </div>

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

        {/* ── Table ───────────────────────────────────── */}
        <div className="rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden">
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
                  <Link href="/admin/artefacts/new">
                    <Button icon={<Plus className="h-3.5 w-3.5" />} size="sm">
                      Add Artefact
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Artefact
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden md:table-cell">
                    Category
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden lg:table-cell">
                    Location
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {artefacts.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3.5">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          {a.images?.[0] ? (
                            <img
                              src={a.images[0].imageUrl}
                              alt={a.images[0].altText ?? a.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <Package className="h-4 w-4 text-stone-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-stone-900 truncate max-w-[200px]">{a.title}</p>
                          <p className="text-xs text-stone-400 mt-0.5">
                            {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 hidden md:table-cell">
                      {a.category?.name ?? <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 hidden lg:table-cell">
                      {a.location?.name ?? <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge label={a.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/artefacts/${a.id}`}>
                          <button
                            className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                            title="View"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <Link href={`/admin/artefacts/${a.id}/edit`}>
                          <button
                            className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        </Link>
                        <button
                          onClick={() => setDeleteId(a.id)}
                          className="p-1.5 rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
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
    </AdminShell>
  );
}
