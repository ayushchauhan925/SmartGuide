import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      {icon && (
        <div className="relative mb-5">
          <div className="absolute inset-0 -m-3 rounded-full bg-gold-200/30 blur-xl" aria-hidden />
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-gold-600"
            style={{ background: "linear-gradient(140deg, #FEFCF3, #F3E4A8)", boxShadow: "inset 0 0 0 1px rgba(192,149,44,0.25)" }}
          >
            {icon}
          </div>
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
      {description && <p className="mt-1 max-w-xs text-sm leading-relaxed text-stone-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
