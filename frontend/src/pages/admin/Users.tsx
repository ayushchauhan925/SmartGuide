import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { Users, Plus, Pencil, UserX } from "lucide-react";

interface User { id: number; name: string; email: string; role: string; isActive: boolean; createdAt: string; }

const ROLES = [
  { value: "admin",  label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" });
  const [editId, setEditId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const load = async () => {
    const res = await fetch("/api/v1/users");
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setUsers(data.users ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: "", email: "", password: "", role: "viewer" }); setEditId(null); setModalOpen(true); };
  const openEdit = (u: User) => { setForm({ name: u.name, email: u.email, password: "", role: u.role }); setEditId(u.id); setModalOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast("Name is required", "error"); return; }
    if (!editId && !form.email.trim()) { toast("Email is required", "error"); return; }
    if (!editId && form.password.length < 8) { toast("Password must be at least 8 characters", "error"); return; }
    setSaving(true);
    const url = editId ? `/api/v1/users/${editId}` : "/api/v1/users";
    const method = editId ? "PUT" : "POST";
    const body: Record<string, string> = { name: form.name, role: form.role };
    if (!editId) { body.email = form.email; body.password = form.password; }
    else if (form.password) body.password = form.password;
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      toast(editId ? "User updated" : "User created");
      setModalOpen(false);
      load();
    } else {
      const data = await res.json();
      toast(data.error?.message ?? "Failed", "error");
    }
    setSaving(false);
  };

  const handleDeactivate = async () => {
    if (!deactivateId) return;
    setDeactivating(true);
    const res = await fetch(`/api/v1/users/${deactivateId}`, { method: "DELETE" });
    if (res.ok) { toast("User deactivated"); setDeactivateId(null); load(); }
    else { toast("Failed", "error"); }
    setDeactivating(false);
  };

  if (currentUser && currentUser.role !== "admin") {
    return (
      <AdminShell>
        <EmptyState
          icon={<Users className="h-6 w-6" />}
          title="Access restricted"
          description="Only administrators can manage user accounts."
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-900 tracking-tight">Users</h1>
            <p className="text-sm text-stone-500 mt-0.5">{users.length} team {users.length === 1 ? "member" : "members"}</p>
          </div>
          <Button icon={<Plus className="h-3.5 w-3.5" />} onClick={openCreate}>
            Add User
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white border border-stone-200/80 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] overflow-hidden">
          {loading ? (
            <TableSkeleton rows={3} />
          ) : users.length === 0 ? (
            <EmptyState
              icon={<Users className="h-6 w-6" />}
              title="No users yet"
              description="Add team members to give them access to the admin dashboard."
              action={
                <Button icon={<Plus className="h-3.5 w-3.5" />} size="sm" onClick={openCreate}>
                  Add User
                </Button>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/60">
                  <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">User</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Role</th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-stone-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-stone-50/60 transition-colors ${!u.isActive ? "opacity-50" : ""}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 uppercase">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-stone-900">{u.name}</span>
                        {u.id === currentUser?.id && (
                          <span className="text-[10px] text-stone-400">(you)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-stone-500 hidden sm:table-cell text-xs">{u.email}</td>
                    <td className="px-4 py-3.5"><Badge label={u.role} /></td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold ${u.isActive ? "text-emerald-600" : "text-stone-400"}`}>
                        {u.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {u.id !== currentUser?.id && u.isActive && (
                          <button
                            onClick={() => setDeactivateId(u.id)}
                            className="p-1.5 rounded-md text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Deactivate"
                          >
                            <UserX className="h-3.5 w-3.5" />
                          </button>
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Edit User" : "Add Team Member"}
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
            label="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            autoFocus
          />
          {!editId && (
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          )}
          <Input
            label={editId ? "New Password" : "Password"}
            type="password"
            required={!editId}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            hint={editId ? "Leave blank to keep current password" : "Minimum 8 characters"}
          />
          <Select
            label="Role"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            options={ROLES}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={deactivateId !== null}
        onClose={() => setDeactivateId(null)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message="This user will immediately lose access to the admin dashboard. You can reactivate them later."
        confirmLabel="Deactivate"
        loading={deactivating}
      />
    </AdminShell>
  );
}
