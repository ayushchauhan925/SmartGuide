import { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode, CSSProperties } from "react";

const baseInput: CSSProperties = {
  width: "100%", padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-sm)",
  fontSize: 14, color: "var(--text-primary)",
  background: "var(--surface)",
  outline: "none", fontFamily: "inherit",
  transition: "border-color var(--transition), box-shadow var(--transition)",
};

const focusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = "var(--gold)";
    (e.target as HTMLElement).style.boxShadow = "0 0 0 3px rgba(184,134,30,0.12)";
  },
  onBlur: (e: React.FocusEvent<HTMLElement>) => {
    (e.target as HTMLElement).style.borderColor = "var(--border)";
    (e.target as HTMLElement).style.boxShadow = "none";
  },
};

interface FieldProps { label: string; error?: string; hint?: string; required?: boolean; children: ReactNode; }

export function Field({ label, error, hint, required, children }: FieldProps) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, letterSpacing: "0.03em", textTransform: "uppercase" }}>
        {label}{required && <span style={{ color: "#DC2626", marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 5 }}>{hint}</p>}
      {error && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>{error}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input style={baseInput} {...focusHandlers} {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea style={{ ...baseInput, resize: "vertical", minHeight: 90, lineHeight: 1.6 }} {...focusHandlers} {...props} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select style={{ ...baseInput, cursor: "pointer" }} {...focusHandlers} {...props}>
      {children}
    </select>
  );
}
