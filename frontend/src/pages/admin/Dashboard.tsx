import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArtefactCover } from "@/components/visitor/ArtefactCover";
import { ColumnChart, Sparkline } from "@/components/admin/Charts";
import {
  Plus, ArrowRight, ArrowUpRight, Package, ScanLine, ThumbsUp, MessageSquare,
  QrCode, Route, Languages, PencilLine, Sparkles, ExternalLink,
} from "lucide-react";

interface ArtefactRow {
  id: number;
  uniquePublicId: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  category?: { name: string } | null;
  location?: { name: string } | null;
  images: Array<{ imageUrl: string }>;
}

interface Data {
  total: number;
  published: number;
  categories: number;
  locations: number;
  tours: number;
  recent: ArtefactRow[];
  drafts: ArtefactRow[];
  draftCount: number;
  pendingFeedback: number;
  analytics: {
    totalInRange: number;
    series: { date: string; count: number }[];
    topArtefacts: { id: number; title: string; count: number }[];
    helpful: number;
    notHelpful: number;
  } | null;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

const fmtDay = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

function StatTile({
  label, value, sub, icon: Icon, href, trend, loading,
}: {
  label: string; value: string | number; sub?: React.ReactNode; icon: typeof Package; href: string; trend?: number[]; loading?: boolean;
}) {
  return (
    <Link
      to={href}
      className="group relative overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-20px_rgba(28,25,23,0.25)]"
    >
      <div className="flex items-start justify-between">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(140deg, #2A2520, #0D0C0B)", boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.3)" }}
        >
          <Icon className="h-[18px] w-[18px] text-[#E2C27A]" />
        </span>
        <ArrowUpRight className="h-4 w-4 text-stone-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-stone-700" />
      </div>
      <p className="mt-5 text-[13px] text-stone-500">{label}</p>
      {loading ? (
        <Skeleton className="mt-2 h-8 w-20" />
      ) : (
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="text-[32px] font-semibold leading-none tracking-tight text-stone-900">{value}</p>
          {trend && <Sparkline values={trend} width={84} height={32} />}
        </div>
      )}
      {sub && !loading && <p className="mt-2 text-xs text-stone-400">{sub}</p>}
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    (async () => {
      const get = (u: string) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);
      const [all, active, drafts, cats, locs, analytics, feedback, tours] = await Promise.all([
        get("/api/v1/artefacts?limit=6"),
        get("/api/v1/artefacts?limit=1&status=active"),
        get("/api/v1/artefacts?limit=4&status=draft"),
        get("/api/v1/categories"),
        get("/api/v1/locations"),
        get("/api/v1/analytics?days=30"),
        get("/api/v1/feedback?status=pending"),
        get("/api/v1/tours"),
      ]);
      setData({
        total: all?.total ?? 0,
        published: active?.total ?? 0,
        categories: cats?.categories?.length ?? 0,
        locations: locs?.locations?.length ?? 0,
        tours: tours?.tours?.length ?? 0,
        recent: all?.artefacts ?? [],
        drafts: drafts?.artefacts ?? [],
        draftCount: drafts?.total ?? 0,
        pendingFeedback: feedback?.pending ?? 0,
        analytics,
      });
    })();
  }, []);

  const loading = !data;
  const series = data?.analytics?.series ?? [];
  const last14 = series.slice(-14);
  const ratings = (data?.analytics?.helpful ?? 0) + (data?.analytics?.notHelpful ?? 0);
  const helpfulPct = ratings ? Math.round(((data?.analytics?.helpful ?? 0) / ratings) * 100) : null;
  const firstName = user?.name?.split(" ")[0] ?? "";

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* ── Welcome banner ─────────────────────────────── */}
        <section className="sg-hero-bg sg-grain relative overflow-hidden rounded-3xl px-6 py-8 text-white sm:px-10 sm:py-10">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: "radial-gradient(circle, #C9A04A, transparent 70%)" }} aria-hidden />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <p className="sg-eyebrow flex items-center gap-2 text-[#E2C27A]">
                <Sparkles className="h-3.5 w-3.5" /> Curator studio
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
                {greeting()}{firstName && <>, <em className="sg-gold-text italic">{firstName}</em></>}
              </h1>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-300">
                {loading ? "Gathering today’s numbers…" : (
                  <>
                    Your collection has <span className="font-semibold text-white">{data.published} objects on display</span>
                    {data.draftCount > 0 && <> and <span className="font-semibold text-white">{data.draftCount} waiting in drafts</span></>}.
                    {data.pendingFeedback > 0 && <> {data.pendingFeedback} visitor comment{data.pendingFeedback === 1 ? " needs" : "s need"} review.</>}
                  </>
                )}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/admin/artefacts/new" className="sg-btn-gold !py-2.5">
                  <Plus className="h-4 w-4" /> New artefact
                </Link>
                <a href="/" target="_blank" rel="noopener noreferrer" className="sg-btn-ghost !py-2.5">
                  <ExternalLink className="h-4 w-4" /> Visitor site
                </a>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm">
              <div className="flex items-baseline justify-between">
                <p className="text-xs text-stone-400">Visitor scans · last 14 days</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {loading ? "–" : last14.reduce((s, d) => s + d.count, 0)}
                </p>
              </div>
              <div className="mt-4 flex h-20 items-end gap-[3px]">
                {(last14.length ? last14 : Array.from({ length: 14 }, () => ({ date: "", count: 0 }))).map((d, i, arr) => {
                  const max = Math.max(1, ...arr.map((x) => x.count));
                  return (
                    <div key={i} className="flex h-full flex-1 items-end" title={d.date ? `${fmtDay(d.date)}: ${d.count}` : undefined}>
                      <div
                        className="w-full rounded-t-[3px]"
                        style={{
                          height: d.count ? `${Math.max(6, (d.count / max) * 100)}%` : "3px",
                          background: i === arr.length - 1 ? "#E2C27A" : d.count ? "rgba(226,194,122,0.45)" : "rgba(255,255,255,0.08)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-stone-500">
                <span>{last14[0] ? fmtDay(last14[0].date) : ""}</span>
                <span>Today</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stat tiles ─────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatTile
            label="Artefacts"
            value={data?.total ?? 0}
            sub={data && <>{data.published} published · {data.categories} categories</>}
            icon={Package}
            href="/admin/artefacts"
            loading={loading}
          />
          <StatTile
            label="Scans this month"
            value={data?.analytics?.totalInRange ?? 0}
            trend={series.length ? series.map((s) => s.count) : undefined}
            icon={ScanLine}
            href="/admin/analytics"
            loading={loading}
          />
          <StatTile
            label="Visitors who found it helpful"
            value={helpfulPct === null ? "–" : `${helpfulPct}%`}
            sub={`${ratings} rating${ratings === 1 ? "" : "s"}`}
            icon={ThumbsUp}
            href="/admin/feedback"
            loading={loading}
          />
          <StatTile
            label="Comments to review"
            value={data?.pendingFeedback ?? 0}
            sub={data?.pendingFeedback ? "Awaiting moderation" : "All caught up"}
            icon={MessageSquare}
            href="/admin/feedback"
            loading={loading}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          {/* ── Recently catalogued ─────────────────────── */}
          <section className="rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
            <div className="flex items-center justify-between px-6 pb-2 pt-5">
              <div>
                <h2 className="font-display text-xl font-bold text-stone-900">Recently catalogued</h2>
                <p className="text-xs text-stone-400">Latest additions to the collection</p>
              </div>
              <Link to="/admin/artefacts" className="group flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900">
                View all <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <ul className="px-3 pb-3">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-4 px-3 py-3">
                      <Skeleton className="h-12 w-12 rounded-xl" />
                      <div className="flex-1 space-y-2"><Skeleton className="h-3.5 w-48" /><Skeleton className="h-3 w-28" /></div>
                    </li>
                  ))
                : data.recent.length === 0
                ? (
                  <li className="px-3 py-10 text-center text-sm text-stone-400">
                    No artefacts yet.{" "}
                    <Link to="/admin/artefacts/new" className="font-semibold text-gold-600">Add the first one →</Link>
                  </li>
                )
                : data.recent.map((a) => (
                    <li key={a.id}>
                      <Link to={`/admin/artefacts/${a.id}`} className="group flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-stone-50">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-stone-900 shadow-sm">
                          <ArtefactCover title={a.title} imageUrl={a.images?.[0]?.imageUrl} sizes="48px" thumb />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-stone-800 group-hover:text-stone-950">{a.title}</p>
                          <p className="mt-0.5 truncate text-xs text-stone-400">
                            {[a.category?.name, a.location?.name].filter(Boolean).join(" · ") || "Uncategorised"}
                          </p>
                        </div>
                        <Badge label={a.status} />
                      </Link>
                    </li>
                  ))}
            </ul>
          </section>

          <div className="space-y-6">
            {/* ── Most viewed ──────────────────────────── */}
            <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
              <h2 className="font-display text-xl font-bold text-stone-900">Most viewed</h2>
              <p className="text-xs text-stone-400">Top artefacts by scans, last 30 days</p>
              {loading ? (
                <div className="mt-5 space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
              ) : !data.analytics?.topArtefacts.length ? (
                <div className="mt-5 rounded-xl border border-dashed border-stone-200 p-5 text-center">
                  <QrCode className="mx-auto h-6 w-6 text-stone-300" />
                  <p className="mt-2 text-sm text-stone-500">No scans yet. Print your QR codes and place them beside the objects.</p>
                  <Link to="/admin/qr-codes/print" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-gold-700">
                    Print QR codes <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              ) : (
                <ol className="mt-5 space-y-3.5">
                  {data.analytics.topArtefacts.slice(0, 5).map((t, i, arr) => (
                    <li key={t.id}>
                      <Link to={`/admin/artefacts/${t.id}`} className="group block">
                        <div className="mb-1.5 flex items-baseline gap-3 text-[13px]">
                          <span className="w-4 text-xs font-semibold tabular-nums text-stone-400">{i + 1}</span>
                          <span className="min-w-0 flex-1 truncate font-medium text-stone-700 group-hover:text-stone-950">{t.title}</span>
                          <span className="font-semibold tabular-nums text-stone-800">{t.count}</span>
                        </div>
                        <div className="ml-7 h-1.5 overflow-hidden rounded-full bg-stone-100">
                          <div className="h-full rounded-full bg-[#C9A04A]" style={{ width: `${(t.count / arr[0].count) * 100}%` }} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            {/* ── Needs attention ──────────────────────── */}
            {!loading && (data.drafts.length > 0 || data.pendingFeedback > 0) && (
              <section className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 to-white p-6">
                <h2 className="font-display text-xl font-bold text-stone-900">Needs attention</h2>
                <ul className="mt-4 space-y-1">
                  {data.pendingFeedback > 0 && (
                    <li>
                      <Link to="/admin/feedback" className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-amber-100/50">
                        <MessageSquare className="h-4 w-4 text-amber-600" />
                        <span className="flex-1 text-sm text-stone-700">{data.pendingFeedback} comment{data.pendingFeedback === 1 ? "" : "s"} to moderate</span>
                        <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                      </Link>
                    </li>
                  )}
                  {data.drafts.map((a) => (
                    <li key={a.id}>
                      <Link to={`/admin/artefacts/${a.id}/edit`} className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-amber-100/50">
                        <PencilLine className="h-4 w-4 text-amber-600" />
                        <span className="min-w-0 flex-1 truncate text-sm text-stone-700">Finish draft: <span className="font-semibold">{a.title}</span></span>
                        <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>

        {/* ── Scans chart ────────────────────────────────── */}
        <section className="rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-stone-900">Visitor scans</h2>
              <p className="text-xs text-stone-400">Daily, last 30 days</p>
            </div>
            <Link to="/admin/analytics" className="group flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900">
              Full analytics <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          {loading ? (
            <Skeleton className="h-44 w-full" />
          ) : (
            <ColumnChart
              data={series.map((s) => ({ label: fmtDay(s.date), value: s.count }))}
              height={170}
              highlightLast
              emptyLabel="Scans will appear here once visitors start scanning"
              axisLabels={series.length ? [fmtDay(series[0].date), fmtDay(series[Math.floor(series.length / 2)].date), "Today"] : undefined}
            />
          )}
        </section>

        {/* ── Quick actions ──────────────────────────────── */}
        <section>
          <h2 className="mb-3 px-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { href: "/admin/artefacts/new", label: "Add artefact", desc: "Catalogue a new object", icon: Plus },
              { href: "/admin/qr-codes/print", label: "Print QR codes", desc: "Labels for the galleries", icon: QrCode },
              { href: "/admin/tours", label: "Build a tour", desc: `${data?.tours ?? 0} tour${data?.tours === 1 ? "" : "s"} so far`, icon: Route },
              { href: "/admin/artefacts", label: "Import or translate", desc: "CSV import, 10 languages", icon: Languages },
            ].map(({ href, label, desc, icon: Icon }) => (
              <Link
                key={label}
                to={href}
                className="group flex items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-gold-300 hover:shadow-[0_12px_30px_-18px_rgba(201,160,74,0.7)]"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200 transition-colors group-hover:bg-gold-100">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-stone-800">{label}</span>
                  <span className="block truncate text-xs text-stone-400">{desc}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
