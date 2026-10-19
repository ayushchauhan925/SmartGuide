import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

interface Location { id: number; name: string; type: string | null; description: string | null; floorPlanUrl: string | null; createdAt: string; }

export default function LocationsPage() {
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "", description: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/v1/locations");
    const data = await res.json();
    setLocations(data.locations ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: "", type: "", description: "" }); setEditId(null); setModalOpen(true); };
  const openEdit = (l: Location) => {
    setForm({ name: l.name, type: l.type ?? "", description: l.description ?? "" });
    setEditId(l.id);
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    const url = editId ? `/api/v1/locations/${editId}` : "/api/v1/locations";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), type: form.type || null, description: form.description || null }),
    });
    if (res.ok) {
      toast(editId ? "Location updated" : "Location created");
      setModalOpen(false);
      load();
    } else {
      const data = await res.json();
      toast(data.error?.message ?? "Failed", "error");
    }
    setSaving(false);
  };

  const currentPlan = locations.find((l) => l.id === editId)?.floorPlanUrl ?? null;

  const uploadPlan = async (file: File) => {
    if (!editId) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("image", file);
    const res = await fetch(`/api/v1/locations/${editId}/floor-plan`, { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) { toast("Floor plan uploaded"); load(); }
    else { const d = await res.json(); toast(d.error?.message ?? "Upload failed", "error"); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/v1/locations/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast("Location deleted"); setDeleteId(null); load(); }
    else { toast("Delete failed", "error"); }
    setDeleting(false);
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-900 tracking-tight">Locations</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {locations.length} {locations.length === 1 ? "location" : "locations"}
            </p>
          </div>
          <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
            Add Location
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : locations.length === 0 ? (
            <EmptyState
              icon={<MapPin className="h-6 w-6" />}
              title="No locations yet"
              description="Add galleries, halls, and rooms to organise your exhibits."
              action={
                <Button icon={<Plus className="h-3.5 w-3.5" />} size="sm" onClick={openCreate}>
                  Add Location
                </Button>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden md:table-cell">Description</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-stone-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {locations.map((l) => (
                  <tr key={l.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-stone-900">{l.name}</td>
                    <td className="px-4 py-3.5 text-stone-500 hidden sm:table-cell">
                      {l.type ? (
                        <span className="inline-flex items-center rounded-md bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                          {l.type}
                        </span>
                      ) : (
                        <span className="text-stone-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 hidden md:table-cell max-w-xs truncate">
                      {l.description ?? <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(l)}
                          className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(l.id)}
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit Location" : "Add Location"}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={save} loading={saving}>Save</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Gallery 1 — Ancient Civilizations"
            autoFocus
          />
          <Input
            label="Type"
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            placeholder="e.g. Gallery, Hall, Room, Floor"
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of this space…"
            rows={3}
          />
          {editId && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">Floor plan</p>
              {currentPlan && (
                <img src={currentPlan} alt="Floor plan" className="w-full rounded-lg border border-stone-200" />
              )}
              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && uploadPlan(e.target.files[0])}
                className="block w-full text-xs text-stone-600"
              />
              <p className="text-xs text-stone-400">Visitors see where artefacts are on this plan. Place artefacts from their edit page.</p>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Location"
        message="Artefacts at this location will have their location cleared. This cannot be undone."
        loading={deleting}
      />
    </AdminShell>
  );
}
