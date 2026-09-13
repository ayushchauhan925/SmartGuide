import { useState, useCallback, useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface ToastItem { id: number; message: string; type: ToastType; }

let _counter = 0;
let _add: ((msg: string, type?: ToastType) => void) | null = null;

export function toast(message: string, type: ToastType = "success") {
  _add?.(message, type);
}

const config: Record<ToastType, { icon: React.ReactNode; color: string; border: string }> = {
  success: { icon: <CheckCircle size={15} />, color: "#86EFAC", border: "rgba(134,239,172,0.2)" },
  error:   { icon: <AlertCircle size={15} />, color: "#FCA5A5", border: "rgba(252,165,165,0.2)" },
  info:    { icon: <Info size={15} />, color: "#93C5FD", border: "rgba(147,197,253,0.2)" },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((message: string, type: ToastType = "success") => {
    const id = ++_counter;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3800);
  }, []);

  useEffect(() => { _add = add; return () => { _add = null; }; }, [add]);

  if (!toasts.length) return null;

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map((t) => {
        const c = config[t.type];
        return (
          <div key={t.id} className="fade-in" style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "11px 14px", borderRadius: 10, minWidth: 280, maxWidth: 380,
            background: "rgba(17,15,12,0.95)", backdropFilter: "blur(12px)",
            border: `1px solid ${c.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.24)",
            color: "#F0EDE8", fontSize: 13.5,
          }}>
            <span style={{ color: c.color, flexShrink: 0 }}>{c.icon}</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button
              onClick={() => setToasts((p) => p.filter((x) => x.id !== t.id))}
              style={{ background: "none", border: "none", color: "#4A4440", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
