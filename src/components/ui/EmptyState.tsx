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
        <div className="h-12 w-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-stone-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-stone-500 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
