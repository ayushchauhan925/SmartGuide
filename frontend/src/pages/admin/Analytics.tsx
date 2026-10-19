import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AdminShell } from "@/components/admin/AdminShell";
import { Skeleton } from "@/components/ui/Skeleton";
import { ColumnChart, BarList, Sparkline } from "@/components/admin/Charts";
import { languageLabel } from "@/lib/languages";
import { ScanLine, CalendarDays, TrendingUp, ThumbsUp, Table2, BarChart3, QrCode, ArrowRight } from "lucide-react";

interface Analytics {
  days: number;
  totalInRange: number;
  totalAll: number;
  series: { date: string; count: number }[];
  byHour: number[];
  topArtefacts: { id: number; title: string; count: number }[];
  devices: { label: string; count: number }[];
  languages: { label: string; count: number }[];
  helpful: number;
  notHelpful: number;
}

const fmtDay = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? "am" : "pm"}`;

const panel = "rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(28,25,23,0.04),0_8px_24px_-12px_rgba(28,25,23,0.08)]";

function Tile({ label, value, sub, icon: Icon, trend }: { label: string; value: string; sub?: string; icon: typeof ScanLine; trend?: number[] }) {
  return (
    <div className={panel + " !p-5"}>
      <div className="flex items-center gap-2 text-[13px] text-stone-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-inset ring-gold-200">
          <Icon className="h-3.5 w-3.5" />
        </span>
        {label}
      </div>
      <div className="mt-4 flex items-end justify-between gap-2">
        <p className="text-[32px] font-semibold leading-none tracking-tight text-stone-900 tabular-nums">{value}</p>
        {trend && <Sparkline values={trend} width={80} height={30} />}
      </div>
      {sub && <p className="mt-2 text-xs text-stone-400">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [asTable, setAsTable] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  const ratings = (data?.helpful ?? 0) + (data?.notHelpful ?? 0);
  const peakHour = data && data.byHour.some((v) => v > 0) ? data.byHour.indexOf(Math.max(...data.byHour)) : null;
  const busiest = data?.series.reduce((b, d) => (d.count > (b?.count ?? -1) ? d : b), null as null | { date: string; count: number });

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-stone-900">Analytics</h1>
            <p className="mt-1 text-sm text-stone-500">How visitors are engaging with the collection</p>
          </div>
          <div className="flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm" role="group" aria-label="Time range">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-all ${
                  days === d ? "bg-stone-900 text-white shadow" : "text-stone-500 hover:text-stone-900"
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {loading || !data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        ) : (
          <>
            {data.totalAll === 0 && (
              <div className="sg-hero-bg sg-grain flex flex-wrap items-center gap-5 overflow-hidden rounded-2xl px-6 py-5 text-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10" style={{ boxShadow: "inset 0 0 0 1px rgba(226,194,122,0.35)" }}>
                  <QrCode className="h-5 w-5 text-[#E2C27A]" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Waiting for the first visitor</p>
                  <p className="text-sm text-stone-400">Charts fill in automatically as people scan QR codes in the galleries.</p>
                </div>
                <Link to="/admin/qr-codes/print" className="sg-btn-gold !py-2">Print QR codes <ArrowRight className="h-4 w-4" /></Link>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Tile label={`Scans, last ${days} days`} value={data.totalInRange.toLocaleString()} icon={ScanLine} trend={data.series.map((s) => s.count)} />
              <Tile label="Daily average" value={(data.totalInRange / days).toFixed(1)} icon={CalendarDays}
                sub={busiest && busiest.count > 0 ? `Busiest: ${fmtDay(busiest.date)} (${busiest.count})` : undefined} />
              <Tile label="All-time scans" value={data.totalAll.toLocaleString()} icon={TrendingUp}
                sub={peakHour !== null ? `Peak hour: ${hourLabel(peakHour)}` : undefined} />
              <Tile label="Found it helpful" value={ratings ? `${Math.round((data.helpful / ratings) * 100)}%` : "–"} icon={ThumbsUp}
                sub={`${ratings} rating${ratings === 1 ? "" : "s"}`} />
            </div>

            <section className={panel}>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-stone-900">Scans per day</h2>
                  <p className="text-xs text-stone-400">Each visitor counts once per artefact per session</p>
                </div>
                <button
                  onClick={() => setAsTable((t) => !t)}
                  className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  {asTable ? <BarChart3 className="h-3.5 w-3.5" /> : <Table2 className="h-3.5 w-3.5" />}
                  {asTable ? "Show chart" : "Show table"}
                </button>
              </div>
              {asTable ? (
                <div className="max-h-72 overflow-y-auto rounded-xl border border-stone-100">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-stone-50 text-left text-xs text-stone-500">
                      <tr><th className="px-4 py-2 font-medium">Date</th><th className="px-4 py-2 text-right font-medium">Scans</th></tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {[...data.series].reverse().map((s) => (
                        <tr key={s.date}><td className="px-4 py-2 text-stone-700">{fmtDay(s.date)}</td><td className="px-4 py-2 text-right tabular-nums text-stone-900">{s.count}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <ColumnChart
                  data={data.series.map((s) => ({ label: fmtDay(s.date), value: s.count }))}
                  height={220}
                  highlightLast
                  emptyLabel="No scans in this period"
                  axisLabels={[fmtDay(data.series[0].date), fmtDay(data.series[Math.floor(data.series.length / 2)].date), "Today"]}
                />
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className={panel}>
                <h2 className="font-display text-xl font-bold text-stone-900">Top artefacts</h2>
                <p className="mb-5 text-xs text-stone-400">Ranked by scans in this period</p>
                <BarList rows={data.topArtefacts.map((a) => ({ label: a.title, value: a.count }))} emptyLabel="No scans in this period" />
              </section>
              <section className={panel}>
                <h2 className="font-display text-xl font-bold text-stone-900">Time of day</h2>
                <p className="mb-5 text-xs text-stone-400">When visitors scan, by hour</p>
                <ColumnChart
                  data={data.byHour.map((v, h) => ({ label: hourLabel(h), value: v }))}
                  height={160}
                  emptyLabel="No scans yet"
                  axisLabels={["12am", "6am", "12pm", "6pm", "11pm"]}
                />
              </section>
              <section className={panel}>
                <h2 className="font-display text-xl font-bold text-stone-900">Devices</h2>
                <p className="mb-5 text-xs text-stone-400">What visitors scan with</p>
                <BarList rows={[...data.devices].sort((a, b) => b.count - a.count).map((d) => ({ label: d.label, value: d.count }))} />
              </section>
              <section className={panel}>
                <h2 className="font-display text-xl font-bold text-stone-900">Languages</h2>
                <p className="mb-5 text-xs text-stone-400">Language each guide was read in</p>
                <BarList
                  rows={[...data.languages]
                    .sort((a, b) => b.count - a.count)
                    .map((l) => ({ label: l.label === "unknown" ? "Unknown" : languageLabel(l.label), value: l.count }))}
                />
              </section>
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
}
