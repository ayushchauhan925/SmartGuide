import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:   "bg-gradient-to-b from-stone-800 to-stone-950 text-white hover:from-stone-700 hover:to-stone-900 shadow-[0_1px_0_rgba(255,255,255,0.12)_inset,0_6px_16px_-6px_rgba(28,25,23,0.6)] focus-visible:ring-stone-900",
  secondary: "bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:border-stone-300 active:bg-stone-100 shadow-[0_1px_2px_rgba(28,25,23,0.05)] focus-visible:ring-stone-400",
  ghost:     "text-stone-600 hover:bg-stone-100 hover:text-stone-900 active:bg-stone-200 focus-visible:ring-stone-400",
  danger:    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm focus-visible:ring-red-600",
  gold:      "bg-gradient-to-br from-[#F0D58F] via-[#C9A04A] to-[#A9802E] text-[#1A1408] hover:brightness-105 shadow-[0_1px_0_rgba(255,255,255,0.5)_inset,0_8px_20px_-8px_rgba(201,160,74,0.8)] focus-visible:ring-gold-500",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-6 text-sm gap-2 rounded-xl font-semibold",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, disabled, children, className = "", ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50 select-none whitespace-nowrap",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
);
Button.displayName = "Button";
