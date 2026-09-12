"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { Package, Tag, MapPin, Plus, ArrowRight, Clock, QrCode } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

interface Stats {
  artefacts: number;
  categories: number;
  locations: number;
  recentArtefacts: Array<{
    id: number;
    title: string;
    status: string;
    createdAt: string;
    category?: { name: string } | null;
    images: Array<{ imageUrl: string }>;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [aRes, cRes, lRes] = await Promise.all([
          fetch("/api/v1/artefacts?limit=6"),
          fetch("/api/v1/categories"),
          fetch("/api/v1/locations"),
        ]);
        const [aData, cData, lData] = await Promise.all([aRes.json(), cRes.json(), lRes.json()]);
        setStats({
          artefacts: aData.total ?? 0,
          categories: cData.categories?.length ?? 0,
          locations: lData.locations?.length ?? 0,
          recentArtefacts: aData.artefacts ?? [],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminShell>
      <div className="space-y-7 max-w-5xl">
        {/* ── Page header ─────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
            <p className="text-sm text-stone-500 mt-0.5">Overview of your collection</p>
          </div>
          <Link
            href="/admin/artefacts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-800 transition-colors shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New Artefact
          </Link>
        </div>

        {/* ── Stat cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-white border border-stone-200 shadow-sm p-5">
                <Skeleton className="h-9 w-9 rounded-lg mb-3" />
                <Skeleton className="h-7 w-14 mb-1.5" />
                <Skeleton className="h-3.5 w-24" />
              </div>
            ))
          ) : (
            <>
              <StatCard
                label="Total Artefacts"
                value={stats?.artefacts ?? 0}
                icon={<Package className="h-4.5 w-4.5" />}
                accent="stone"
              />
              <StatCard
                label="Categories"
                value={stats?.categories ?? 0}
                icon={<Tag className="h-4.5 w-4.5" />}
                accent="gold"
              />
              <StatCard
                label="Locations"
                value={stats?.locations ?? 0}
                icon={<MapPin className="h-4.5 w-4.5" />}
                accent="emerald"
              />
            </>
          )}
        </div>

        {/* ── Recent artefacts ────────────────────────── */}
        <div className="rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-stone-400" />
              <h2 className="text-sm font-semibold text-stone-800">Recent Artefacts</h2>
            </div>
            <Link
              href="/admin/artefacts"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gold-600 hover:text-gold-700 transition-colors"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="divide-y divide-stone-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : stats?.recentArtefacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="h-12 w-12 rounded-xl bg-stone-100 flex items-center justify-center">
                <Package className="h-6 w-6 text-stone-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-stone-700">No artefacts yet</p>
                <p className="text-xs text-stone-400 mt-0.5">Get started by adding your first exhibit</p>
              </div>
              <Link
                href="/admin/artefacts/new"
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add first artefact
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-stone-100">
              {stats?.recentArtefacts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/admin/artefacts/${a.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50 transition-colors group"
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-stone-100 shrink-0">
                      {a.images?.[0] ? (
                        <img src={a.images[0].imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-4.5 w-4.5 text-stone-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 truncate">{a.title}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {a.category?.name && <span className="mr-1.5">{a.category.name} ·</span>}
                        {new Date(a.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <Badge label={a.status} />
                    <ArrowRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-stone-500 transition-colors ml-1" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Quick actions ───────────────────────────── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-stone-400 mb-3">Quick Actions</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickLink
              href="/admin/artefacts/new"
              icon={<Plus className="h-4 w-4" />}
              title="Add Artefact"
              desc="Upload a new exhibit"
            />
            <QuickLink
              href="/admin/categories"
              icon={<Tag className="h-4 w-4" />}
              title="Manage Categories"
              desc="Organise your collection"
            />
            <QuickLink
              href="/admin/qr-codes"
              icon={<QrCode className="h-4 w-4" />}
              title="QR Codes"
              desc="Generate and manage codes"
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function StatCard({
  label, value, icon, accent = "stone",
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: "stone" | "gold" | "emerald";
}) {
  const iconStyles: Record<string, string> = {
    stone:   "bg-stone-100 text-stone-500",
    gold:    "bg-gold-100 text-gold-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };
  return (
    <div className="rounded-xl bg-white border border-stone-200 shadow-sm p-5">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center mb-3 ${iconStyles[accent]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-stone-900 tabular-nums leading-none mb-1">{value}</p>
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

function QuickLink({
  href, icon, title, desc,
}: {
  href: string; icon: React.ReactNode; title: string; desc: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-xl border border-stone-200 bg-white p-4 hover:border-stone-300 hover:bg-stone-50 transition-all shadow-sm"
    >
      <div className="h-8 w-8 shrink-0 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-stone-200 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800">{title}</p>
        <p className="text-xs text-stone-500">{desc}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 text-stone-300 group-hover:text-stone-500 transition-colors shrink-0" />
    </Link>
  );
}
