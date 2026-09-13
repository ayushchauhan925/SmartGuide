import { ReactNode } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ open, title, description, confirmLabel = "Confirm", danger = false, onConfirm, onCancel }: Props) {
  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onCancel}
    >
      <div
        className="fade-in"
        style={{ background: "var(--surface)", borderRadius: 14, padding: "28px 28px 24px", maxWidth: 420, width: "100%", boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 20 }}>
          {danger && (
            <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--red-bg)", border: "1px solid var(--red-border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Trash2 size={16} color="var(--red)" />
            </div>
          )}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>{title}</h3>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{description}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ padding: "8px 18px", border: "1px solid var(--border)", borderRadius: 8, background: "var(--surface)", fontSize: 13.5, cursor: "pointer", color: "var(--text-secondary)", fontFamily: "inherit", transition: "all var(--transition)" }}>
            Cancel
          </button>
          <button onClick={onConfirm} style={{ padding: "8px 18px", border: "none", borderRadius: 8, fontSize: 13.5, cursor: "pointer", fontWeight: 600, fontFamily: "inherit", transition: "all var(--transition)", background: danger ? "#DC2626" : "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "#fff", boxShadow: danger ? "0 2px 8px rgba(220,38,38,0.3)" : "0 2px 8px rgba(184,134,30,0.3)" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
