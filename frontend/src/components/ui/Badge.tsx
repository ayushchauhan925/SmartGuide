import { CSSProperties } from "react";

type Variant = "active" | "inactive" | "draft" | "admin" | "editor" | "viewer";

const styles: Record<Variant, CSSProperties> = {
  active:   { background: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)" },
  inactive: { background: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" },
  draft:    { background: "var(--amber-bg)", color: "var(--amber)", border: "1px solid var(--amber-border)" },
  admin:    { background: "var(--blue-bg)", color: "var(--blue)", border: "1px solid var(--blue-border)" },
  editor:   { background: "#F5F3FF", color: "#5B21B6", border: "1px solid #DDD6FE" },
  viewer:   { background: "var(--surface-3)", color: "var(--text-secondary)", border: "1px solid var(--border)" },
};

export function Badge({ variant, label }: { variant: Variant; label?: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "2px 8px", borderRadius: "5px",
      fontSize: "11px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...styles[variant],
    }}>
      {label ?? variant}
    </span>
  );
}
