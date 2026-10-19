import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { Tag, Plus, Pencil, Trash2 } from "lucide-react";

interface Category { id: number; name: string; description: string | null; createdAt: string; }

export default function CategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    const res = await fetch("/api/v1/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: "", description: "" }); setEditId(null); setModalOpen(true); };
  const openEdit = (c: Category) => { setForm({ name: c.name, description: c.description ?? "" }); setEditId(c.id); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast("Name is required", "error"); return; }
    setSaving(true);
    const url = editId ? `/api/v1/categories/${editId}` : "/api/v1/categories";
    const method = editId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: form.name.trim(), description: form.description || null }),
    });
    if (res.ok) {
      toast(editId ? "Category updated" : "Category created");
      setModalOpen(false);
      load();
    } else {
      const data = await res.json();
      toast(data.error?.message ?? "Failed", "error");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/v1/categories/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast("Category deleted"); setDeleteId(null); load(); }
    else { toast("Delete failed", "error"); }
    setDeleting(false);
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-900 tracking-tight">Categories</h1>
            <p className="text-sm text-stone-500 mt-0.5">
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </p>
          </div>
          <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
            Add Category
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : categories.length === 0 ? (
            <EmptyState
              icon={<Tag className="h-6 w-6" />}
              title="No categories yet"
              description="Create categories to organise your artefact collection."
              action={
                <Button icon={<Plus className="h-3.5 w-3.5" />} size="sm" onClick={openCreate}>
                  Add Category
                </Button>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Name</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden sm:table-cell">Description</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-stone-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-stone-900">{c.name}</td>
                    <td className="px-4 py-3.5 text-stone-500 hidden sm:table-cell max-w-xs truncate">
                      {c.description ?? <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(c.id)}
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
        title={editId ? "Edit Category" : "Add Category"}
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
            placeholder="e.g. Ancient Civilizations"
            autoFocus
          />
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description of this category…"
            rows={3}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message="Artefacts in this category will have their category cleared. This cannot be undone."
        loading={deleting}
      />
    </AdminShell>
  );
}
