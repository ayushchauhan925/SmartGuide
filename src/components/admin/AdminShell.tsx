"use client";
import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Package, Tag, MapPin, Users, Activity,
  Settings, LogOut, Menu, X, BookOpen, QrCode,
} from "lucide-react";

const NAV = [
  { href: "/admin",            label: "Dashboard",   icon: LayoutDashboard, exact: true },
  { href: "/admin/artefacts",  label: "Artefacts",   icon: Package },
  { href: "/admin/categories", label: "Categories",  icon: Tag },
  { href: "/admin/locations",  label: "Locations",   icon: MapPin },
  { href: "/admin/qr-codes",   label: "QR Codes",    icon: QrCode },
  { href: "/admin/users",      label: "Users",       icon: Users, adminOnly: true },
  { href: "/admin/activity",   label: "Activity",    icon: Activity },
  { href: "/admin/settings",   label: "Settings",    icon: Settings },
];

function NavItem({
  href, label, icon: Icon, active, onClick,
}: {
  href: string; label: string; icon: typeof LayoutDashboard; active: boolean; onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-[rgba(192,149,44,0.12)] text-[#D4A840]"
          : "text-stone-400 hover:bg-white/[0.06] hover:text-stone-200"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-[#D4A840]" : "text-stone-500 group-hover:text-stone-300"
        )}
        strokeWidth={active ? 2.5 : 2}
      />
      <span className="truncate">{label}</span>
      {active && (
        <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#D4A840] opacity-80" />
      )}
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
  const visibleNav = NAV.filter((n) => !n.adminOnly || user.role === "admin");
  const initials = user.name.slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-full w-64 flex-col bg-[#0F0E0D] border-r border-white/[0.06] relative">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-800 border border-white/10">
          <BookOpen className="h-4 w-4 text-[#D4A840]" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-stone-100 leading-none tracking-tight">
            Smart<span className="text-[#D4A840]">Guide</span>
          </p>
          <p className="text-[10px] text-stone-600 mt-0.5 uppercase tracking-widest">Admin</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-stone-600 hover:text-stone-300 transition-colors lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Main navigation">
        {visibleNav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <NavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={active}
              onClick={onClose}
            />
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="h-7 w-7 shrink-0 rounded-lg bg-stone-800 border border-white/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-stone-300">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-stone-300 truncate leading-none">{user.name}</p>
            <p className="text-[10px] text-stone-600 capitalize mt-0.5">{user.role}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Sign out"
            className="text-stone-600 hover:text-red-400 transition-colors p-1 rounded"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/admin/login");
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0E0D]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-9 w-9 rounded-lg bg-stone-800 border border-white/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-[#D4A840]" />
          </div>
          <div className="flex items-center gap-2 text-stone-600 text-xs">
            <svg className="h-3.5 w-3.5 animate-spin text-[#D4A840]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading…
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <SidebarContent user={user} pathname={pathname} logout={logout} />
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-950/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 z-50 w-64 shadow-2xl">
            <SidebarContent
              user={user}
              pathname={pathname}
              logout={logout}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-[#F8F6F2]">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between border-b border-stone-200 bg-white px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-[#D4A840]" />
            <span className="text-sm font-bold text-stone-800">
              Smart<span className="text-[#D4A840]">Guide</span>
            </span>
          </div>
          <div className="w-9" />
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-5 py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
