import { Link } from "react-router-dom";
import { BookOpen, Compass, Heart, LogIn, Route } from "lucide-react";

interface Props {
  /** "dark" floats over a dark hero; "light" sits on paper backgrounds */
  tone?: "dark" | "light";
  /** Extra controls on the right (language, favourite, accessibility…) */
  children?: React.ReactNode;
  /** Hide the text nav (artefact pages use icon controls instead) */
  compact?: boolean;
}

export function Logo({ tone = "light" }: { tone?: "dark" | "light" }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="SmartGuide home">
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:rotate-[-6deg]"
        style={{
          background: "linear-gradient(140deg, #2A2520, #0D0C0B)",
          boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.35), 0 6px 16px -6px rgba(0,0,0,0.6)",
        }}
      >
        <BookOpen className="h-4 w-4" style={{ color: "#E2C27A" }} strokeWidth={2} />
      </span>
      <span className={`text-[15px] font-bold tracking-tight ${tone === "dark" ? "text-white" : "text-stone-900"}`}>
        Smart<span style={{ color: "#C9A04A" }}>Guide</span>
      </span>
    </Link>
  );
}

const NAV = [
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/tours", label: "Tours", icon: Route },
  { href: "/favorites", label: "Saved", icon: Heart },
];

export function SiteHeader({ tone = "light", children, compact }: Props) {
  const dark = tone === "dark";
  return (
    <header
      className={`sticky top-0 z-30 border-b ${dark ? "sg-glass-dark border-white/[0.06]" : "sg-glass border-stone-900/[0.06]"}`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Logo tone={tone} />
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!compact && (
            <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main">
              {NAV.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  to={href}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors sm:px-3 ${
                    dark ? "text-stone-300 hover:bg-white/[0.08] hover:text-white" : "text-stone-600 hover:bg-stone-900/[0.05] hover:text-stone-900"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              ))}
            </nav>
          )}
          {!compact && (
            <Link
              to="/admin/login"
              aria-label="Staff login"
              className={`ml-1 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                dark
                  ? "border-[#E2C27A]/40 text-[#E2C27A] hover:bg-[#E2C27A] hover:text-stone-950"
                  : "border-[#C9A04A]/50 text-[#8A6A24] hover:bg-[#C9A04A] hover:text-white"
              }`}
            >
              <LogIn className="h-4 w-4" strokeWidth={1.8} />
              <span className="hidden sm:inline">Staff login</span>
            </Link>
          )}
          {children}
        </div>
      </div>
    </header>
  );
}
