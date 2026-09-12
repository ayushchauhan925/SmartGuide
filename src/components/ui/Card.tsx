import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean | "sm" | "md" | "lg" | "none";
}

const paddingMap: Record<string, string> = {
  sm: "p-4", md: "p-5", lg: "p-6", none: "", "false": "", "true": "p-5",
};

export function Card({ children, className = "", padding = true }: CardProps) {
  const p = paddingMap[String(padding)] ?? "p-5";
  return (
    <div className={cn("rounded-xl bg-white border border-stone-200 shadow-sm", p, className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = "stone",
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "stone" | "gold" | "emerald" | "sky" | "amber";
  loading?: boolean;
}) {
  const iconStyles: Record<string, string> = {
    stone:   "bg-stone-100 text-stone-500",
    gold:    "bg-gold-100 text-gold-600",
    emerald: "bg-emerald-50 text-emerald-600",
    sky:     "bg-sky-50 text-sky-600",
    amber:   "bg-amber-50 text-amber-600",
  };
  return (
    <div className="rounded-xl bg-white border border-stone-200 shadow-sm p-5">
      <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center mb-3", iconStyles[accent])}>
        {icon}
      </div>
      {loading ? (
        <>
          <div className="h-7 w-16 bg-stone-100 rounded animate-pulse mb-1.5" />
          <div className="h-3.5 w-20 bg-stone-100 rounded animate-pulse" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-stone-900 leading-none mb-1">{value}</p>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</p>
        </>
      )}
    </div>
  );
}
