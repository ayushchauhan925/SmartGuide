import { useEffect, useState, FormEvent } from "react";
import { api } from "@/lib/api";
import { toast } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAuth } from "@/context/AuthContext";
import type { User, Role } from "@/lib/types";
import { Plus, Pencil, UserX, Users, Eye, EyeOff } from "lucide-react";

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivateId, setDeactivateId] = useState<number | null>(null);
  const [deactivateName, setDeactivateName] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "viewer" as Role });
  const [saving, setSaving] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const load = async () => {
    try { const d = await api.get<{ users: User[] }>("/users"); setUsers(d.users); }
    catch { toast("Failed to load", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ name: "", email: "", password: "", role: "viewer" }); setEditingUser(null); setShowForm(true); };
  const openEdit = (u: User) => { setForm({ name: u.name, email: u.email, password: "", role: u.role }); setEditingUser(u); setShowForm(true); };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUser) {
        const body: Record<string, unknown> = { name: form.name, role: form.role };
        if (form.password) body.password = form.password;
        await api.put(`/users/${editingUser.id}`, body);
        toast("User updated");
      } else {
        await api.post("/users", form);
        toast("User created");
      }
      setShowForm(false); setEditingUser(null); load();
    } catch (err: unknown) { toast(err instanceof Error ? err.message : "Failed", "error"); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async () => {
    if (deactivateId === null) return;
    try { await api.delete(`/users/${deactivateId}`); toast("User deactivated"); setDeactivateId(null); load(); }
    catch { toast("Failed", "error"); }
  };

  const initials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const roleColor: Record<Role, string> = { admin: "#1E3A8A", editor: "#5B21B6", viewer: "var(--text-tertiary)" };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "36px 36px" }} className="fade-in">
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: "var(--text-primary)", marginBottom: 3 }}>Users</h1>
          <p style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{users.filter(u => u.isActive).length} active user{users.filter(u => u.isActive).length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={openNew} style={addBtn}><Plus size={14} strokeWidth={2.5} /> Add user</button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={() => setShowForm(false)}>
          <form onSubmit={submit} className="fade-in" style={{ background: "var(--surface)", borderRadius: 16, padding: "28px", width: "100%", maxWidth: 440, boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 22 }}>{editingUser ? "Edit user" : "New user"}</h3>

            {[
              { label: "Full name", key: "name", type: "text", required: true, placeholder: "John Doe" },
              { label: "Email address", key: "email", type: "email", required: !editingUser, disabled: !!editingUser, placeholder: "john@museum.org" },
            ].map(({ label, key, type, required, disabled, placeholder }) => (
              <div key={key} style={{ marginBottom: 16 }}>
                <label style={fieldLabel}>{label}</label>
                <input type={type} value={form[key as keyof typeof form]} required={required} disabled={disabled} placeholder={placeholder}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  style={{ ...fieldInput, background: disabled ? "var(--surface-3)" : "var(--surface)", opacity: disabled ? 0.7 : 1 }}
                  onFocus={(e) => !disabled && (e.target.style.borderColor = "var(--gold)")}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
              </div>
            ))}

            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>{editingUser ? "New password (leave blank to keep)" : "Password"}</label>
              <div style={{ position: "relative" }}>
                <input type={showPw ? "text" : "password"} value={form.password} required={!editingUser} placeholder="••••••••"
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ ...fieldInput, paddingRight: 42 }}
                  onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                  onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", display: "flex" }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={fieldLabel}>Role</label>
              <select value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value as Role }))} style={{ ...fieldInput, cursor: "pointer" }}
                onFocus={(e) => e.target.style.borderColor = "var(--gold)"}
                onBlur={(e) => e.target.style.borderColor = "var(--border)"}
              >
                <option value="viewer">Viewer — read only</option>
                <option value="editor">Editor — create & edit artefacts</option>
                <option value="admin">Admin — full access</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setShowForm(false)} style={cancelBtn}>Cancel</button>
              <button type="submit" disabled={saving} style={submitBtn}>{saving ? "Saving…" : editingUser ? "Save changes" : "Create user"}</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--text-tertiary)" }}>Loading…</div>
      ) : users.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", border: "2px dashed var(--border)", borderRadius: "var(--radius-lg)", color: "var(--text-tertiary)" }}>
          <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.4 }} />
          <p>No users yet</p>
        </div>
      ) : (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
          {users.map((u, i) => (
            <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 18px", borderBottom: i < users.length - 1 ? "1px solid var(--border)" : "none", opacity: u.isActive ? 1 : 0.45, transition: "background var(--transition)" }}
              onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
            >
              <div style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, background: `${roleColor[u.role]}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: roleColor[u.role] }}>
                {initials(u.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{u.name}</p>
                  {!u.isActive && <span style={{ fontSize: 11, color: "var(--text-tertiary)", background: "var(--surface-3)", border: "1px solid var(--border)", padding: "1px 7px", borderRadius: 4, fontWeight: 500 }}>Inactive</span>}
                  {u.id === me?.id && <span style={{ fontSize: 11, color: "var(--gold)", background: "var(--gold-subtle)", border: "1px solid var(--gold-border)", padding: "1px 7px", borderRadius: 4, fontWeight: 600 }}>You</span>}
                </div>
                <p style={{ fontSize: 12.5, color: "var(--text-tertiary)" }}>{u.email}</p>
              </div>
              <Badge variant={u.role} />
              {u.id !== me?.id && u.isActive && (
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => openEdit(u)} style={iconBtn}><Pencil size={13} /></button>
                  <button onClick={() => { setDeactivateId(u.id); setDeactivateName(u.name); }} style={{ ...iconBtn, color: "var(--red)" }}><UserX size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmModal open={deactivateId !== null} title="Deactivate user" description={<><strong>{deactivateName}</strong> will no longer be able to sign in.</>} confirmLabel="Deactivate" danger onConfirm={handleDeactivate} onCancel={() => setDeactivateId(null)} />
    </div>
  );
}

const addBtn: React.CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(184,134,30,0.25)", whiteSpace: "nowrap" };
const iconBtn: React.CSSProperties = { width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", cursor: "pointer", color: "var(--text-secondary)", transition: "all var(--transition)" };
const fieldLabel: React.CSSProperties = { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, letterSpacing: "0.03em", textTransform: "uppercase" };
const fieldInput: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 14, fontFamily: "inherit", outline: "none", color: "var(--text-primary)", background: "var(--surface)", transition: "border-color var(--transition)" };
const cancelBtn: React.CSSProperties = { padding: "9px 18px", background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: 14, cursor: "pointer", fontFamily: "inherit" };
const submitBtn: React.CSSProperties = { padding: "9px 22px", background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(184,134,30,0.25)" };
