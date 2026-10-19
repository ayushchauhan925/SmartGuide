import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "gold";

const variants: Record<BadgeVariant, { pill: string; dot: string }> = {
  success: { pill: "bg-emerald-50 text-emerald-700 ring-emerald-200/80", dot: "bg-emerald-500" },
  warning: { pill: "bg-amber-50 text-amber-700 ring-amber-200/80", dot: "bg-amber-500" },
  error:   { pill: "bg-red-50 text-red-700 ring-red-200/80", dot: "bg-red-500" },
  info:    { pill: "bg-sky-50 text-sky-700 ring-sky-200/80", dot: "bg-sky-500" },
  neutral: { pill: "bg-stone-100 text-stone-600 ring-stone-200", dot: "bg-stone-400" },
  gold:    { pill: "bg-gold-50 text-gold-700 ring-gold-200", dot: "bg-gold-500" },
};

const STATUS_BADGE: Record<string, BadgeVariant> = {
  active:    "success",
  published: "success",
  approved:  "success",
  inactive:  "neutral",
  hidden:    "neutral",
  draft:     "warning",
  pending:   "warning",
  error:     "error",
  admin:     "gold",
  editor:    "info",
  viewer:    "neutral",
};

export function Badge({ label, variant, className }: { label: string; variant?: BadgeVariant; className?: string }) {
  const v = variants[variant ?? STATUS_BADGE[label.toLowerCase()] ?? "neutral"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ring-1 ring-inset",
        v.pill,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", v.dot)} aria-hidden />
      {label}
    </span>
  );
}
