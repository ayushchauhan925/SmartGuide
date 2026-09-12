import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "gold";

const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  error:   "bg-red-50 text-red-700 ring-1 ring-red-200",
  info:    "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  neutral: "bg-stone-100 text-stone-600 ring-1 ring-stone-200",
  gold:    "bg-gold-100 text-gold-700 ring-1 ring-gold-300",
};

const STATUS_BADGE: Record<string, BadgeVariant> = {
  active:    "success",
  published: "success",
  inactive:  "neutral",
  draft:     "warning",
  error:     "error",
  admin:     "gold",
  editor:    "info",
  viewer:    "neutral",
};

export function Badge({ label, variant, className }: { label: string; variant?: BadgeVariant; className?: string }) {
  const v = variant ?? STATUS_BADGE[label.toLowerCase()] ?? "neutral";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        variants[v],
        className
      )}
    >
      {label}
    </span>
  );
}
