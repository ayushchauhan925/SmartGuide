import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, Tag, MapPin, Users, Activity,
  Settings, LogOut, Menu, X, BookOpen, QrCode, BarChart3, Route, MessageSquare,
  ExternalLink, Plus,
} from "lucide-react";

type NavEntry = { href: string; label: string; icon: typeof LayoutDashboard; exact?: boolean; adminOnly?: boolean };

const NAV_GROUPS: { label: string; items: NavEntry[] }[] = [
  {
    label: "Collection",
    items: [
      { href: "/admin",            label: "Dashboard",  icon: LayoutDashboard, exact: true },
      { href: "/admin/artefacts",  label: "Artefacts",  icon: Package },
      { href: "/admin/categories", label: "Categories", icon: Tag },
      { href: "/admin/locations",  label: "Locations",  icon: MapPin },
      { href: "/admin/qr-codes",   label: "QR Codes",   icon: QrCode },
    ],
  },
  {
    label: "Visitors",
    items: [
      { href: "/admin/tours",     label: "Tours",     icon: Route },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/feedback",  label: "Feedback",  icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/users",    label: "Users",    icon: Users, adminOnly: true },
      { href: "/admin/activity", label: "Activity", icon: Activity },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_NAV = NAV_GROUPS.flatMap((g) => g.items);

function isActive(item: NavEntry, pathname: string) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/");
}

function NavItem({ item, active, onClick }: { item: NavEntry; active: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  return (
    <Link
      to={item.href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-200",
        active ? "text-white" : "text-stone-400 hover:bg-white/[0.05] hover:text-stone-100"
      )}
      style={
        active
          ? {
              background: "linear-gradient(90deg, rgba(201,160,74,0.22), rgba(201,160,74,0.04))",
              boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.18)",
            }
          : undefined
      }
    >
      {active && (
        <span
          className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full"
          style={{ background: "linear-gradient(#F0D58F, #C9A04A)", boxShadow: "0 0 12px rgba(226,194,122,0.7)" }}
        />
      )}
      <Icon
        className={cn("h-[18px] w-[18px] shrink-0 transition-colors", active ? "text-[#E2C27A]" : "text-stone-500 group-hover:text-stone-300")}
        strokeWidth={active ? 2.2 : 1.8}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarContent({
  user, pathname, logout, onClose,
}: {
  user: { name: string; email: string; role: string };
  pathname: string;
  logout: () => void;
  onClose?: () => void;
}) {
  const initials = user.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="sg-hero-bg sg-grain relative flex h-full w-[264px] flex-col border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 pb-5 pt-6">
        <Link to="/admin" className="group flex min-w-0 flex-1 items-center gap-3" onClick={onClose}>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:-rotate-6"
            style={{
              background: "linear-gradient(140deg, #2A2520, #0D0C0B)",
              boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.4), 0 8px 20px -8px rgba(201,160,74,0.5)",
            }}
          >
            <BookOpen className="h-4 w-4 text-[#E2C27A]" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-bold leading-none tracking-tight text-white">
              Smart<span className="text-[#E2C27A]">Guide</span>
            </span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-500">Curator studio</span>
          </span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1 text-stone-500 transition-colors hover:text-white lg:hidden" aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick create */}
      <div className="px-4 pb-2">
        <Link
          to="/admin/artefacts/new"
          onClick={onClose}
          className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-[#1A1408] transition-[filter,transform] hover:brightness-105 active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #F0D58F 0%, #C9A04A 60%, #A9802E 100%)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 10px 24px -12px rgba(201,160,74,0.9)",
          }}
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} /> New artefact
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-4" aria-label="Main navigation">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((n) => !n.adminOnly || user.role === "admin");
          if (!items.length) return null;
          return (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-600">{group.label}</p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavItem key={item.href} item={item} active={isActive(item, pathname)} onClick={onClose} />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Public site */}
      <div className="px-4 pb-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2.5 transition-colors hover:bg-white/[0.07]"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06]">
            <ExternalLink className="h-3.5 w-3.5 text-[#E2C27A]" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-stone-200">Visitor site</span>
            <span className="block truncate text-[10px] text-stone-500">See what visitors see</span>
          </span>
        </a>
      </div>

      {/* User */}
      <div className="border-t border-white/[0.06] p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#1A1408]"
            style={{ background: "linear-gradient(135deg, #F0D58F, #C9A04A)" }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold leading-tight text-stone-100">{user.name}</p>
            <p className="mt-0.5 truncate text-[11px] capitalize text-stone-500">{user.role}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
            className="rounded-lg p-2 text-stone-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useLocation().pathname;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate("/admin/login");
  }, [loading, user, navigate]);

  useEffect(() => {
    const page = ALL_NAV.filter((n) => isActive(n, pathname)).sort((a, b) => b.href.length - a.href.length)[0];
    document.title = page ? `${page.label} — SmartGuide Admin` : "SmartGuide Admin";
  }, [pathname]);

  if (loading) {
    return (
      <div className="sg-hero-bg sg-grain flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="absolute inset-0 -m-4 animate-pulse rounded-full bg-[#C9A04A]/20 blur-xl" />
            <div
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: "linear-gradient(140deg, #2A2520, #0D0C0B)", boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.4)" }}
            >
              <BookOpen className="h-5 w-5 text-[#E2C27A]" />
            </div>
          </div>
          <div className="h-0.5 w-32 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-[sg-shine_1.2s_linear_infinite] rounded-full" style={{ background: "linear-gradient(90deg, transparent, #E2C27A, transparent)", backgroundSize: "200% 100%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const current = ALL_NAV.filter((n) => isActive(n, pathname)).sort((a, b) => b.href.length - a.href.length)[0];
  const group = NAV_GROUPS.find((g) => g.items.includes(current!));

  return (
    <div className="flex h-screen overflow-hidden bg-[#0D0C0B]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <SidebarContent user={user} pathname={pathname} logout={logout} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="sg-reveal absolute inset-y-0 left-0 z-50 shadow-2xl" style={{ ["--d" as string]: "0ms" }}>
            <SidebarContent user={user} pathname={pathname} logout={logout} onClose={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F4EE] lg:my-2 lg:mr-2 lg:rounded-[22px]">
        {/* Warm glow */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{ background: "radial-gradient(60% 100% at 20% 0%, rgba(226,194,122,0.18), transparent 70%)" }}
          aria-hidden
        />

        {/* Top bar */}
        <header className="relative z-10 flex h-14 shrink-0 items-center gap-3 border-b border-stone-900/[0.06] px-4 lg:px-8">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-900/5 hover:text-stone-900 lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <nav className="flex min-w-0 items-center gap-2 text-[13px]" aria-label="Breadcrumb">
            {group && <span className="hidden text-stone-400 sm:inline">{group.label}</span>}
            {group && current && <span className="hidden text-stone-300 sm:inline">/</span>}
            {current && <span className="truncate font-semibold text-stone-800">{current.label}</span>}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-xs text-stone-400 md:inline">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="relative flex-1 overflow-y-auto">
          {/* opacity-only entrance: a transform here would trap fixed-position modals */}
          <div className="sg-fade mx-auto max-w-6xl px-5 py-7 lg:px-8 lg:py-9" style={{ animationDuration: "0.5s" }} key={pathname}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
