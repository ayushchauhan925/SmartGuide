import { useState } from "react";

const GOLD = "#C9A04A";
const GOLD_SOFT = "#E9D7A6";

function niceMax(v: number) {
  if (v <= 4) return 4;
  const pow = 10 ** Math.floor(Math.log10(v));
  const n = v / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * pow;
}

function compact(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n);
}

/**
 * Single-series column chart: one hue, thin columns with 4px rounded caps, hairline grid,
 * per-column hover tooltip. `highlightLast` paints the final column in the accent and the rest softer.
 */
export function ColumnChart({
  data,
  height = 180,
  highlightLast = false,
  unit = "scans",
  emptyLabel = "No data yet",
  axisLabels,
}: {
  data: { label: string; value: number }[];
  height?: number;
  highlightLast?: boolean;
  unit?: string;
  emptyLabel?: string;
  axisLabels?: string[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)));
  const ticks = [max, max / 2, 0];
  const empty = data.every((d) => d.value === 0);

  return (
    <div className="relative">
      <div className="flex gap-3">
        {/* y axis */}
        <div className="flex flex-col justify-between text-right text-[10px] tabular-nums text-stone-400" style={{ height }}>
          {ticks.map((t) => <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{compact(t)}</span>)}
        </div>
        <div className="relative flex-1" style={{ height }}>
          {/* grid */}
          {ticks.map((t, i) => (
            <div key={t} className="absolute inset-x-0 h-px bg-stone-200/70" style={{ top: `${(i / (ticks.length - 1)) * 100}%` }} />
          ))}
          {/* columns */}
          <div className="absolute inset-0 flex items-end gap-[2px]">
            {data.map((d, i) => {
              const h = (d.value / max) * 100;
              const accent = !highlightLast || i === data.length - 1 || hover === i;
              return (
                <div
                  key={d.label}
                  className="relative flex h-full flex-1 cursor-default items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  aria-label={`${d.label}: ${d.value} ${unit}`}
                >
                  <div
                    className="w-full max-w-[24px] rounded-t-[4px] transition-[height,background-color] duration-500"
                    style={{
                      height: d.value > 0 ? `max(${h}%, 3px)` : 0,
                      background: accent ? GOLD : GOLD_SOFT,
                    }}
                  />
                  {hover === i && (
                    <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg">
                      <span className="text-stone-400">{d.label}</span>
                      <span className="ml-2 font-semibold tabular-nums">{d.value}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {empty && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border border-stone-200 bg-white/90 px-3 py-1 text-xs text-stone-500 shadow-sm">{emptyLabel}</span>
            </div>
          )}
        </div>
      </div>
      {axisLabels && (
        <div className="ml-8 mt-2 flex justify-between text-[10px] text-stone-400">
          {axisLabels.map((l, i) => <span key={i}>{l}</span>)}
        </div>
      )}
    </div>
  );
}

/** Ranked horizontal bars: label + value text in ink, bar in one hue (identity comes from the label). */
export function BarList({
  rows,
  emptyLabel = "No data yet",
}: {
  rows: { label: string; value: number; href?: string }[];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;
  if (!rows.length) return <p className="py-6 text-center text-sm text-stone-400">{emptyLabel}</p>;
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="group">
          <div className="mb-1.5 flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate font-medium capitalize text-stone-700">{r.label}</span>
            <span className="shrink-0 tabular-nums text-stone-500">
              <span className="font-semibold text-stone-800">{r.value}</span>
              <span className="ml-1.5 text-xs text-stone-400">{Math.round((r.value / total) * 100)}%</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full transition-[width] duration-700"
              style={{ width: `${(r.value / max) * 100}%`, background: GOLD }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Tiny trend line for stat tiles (de-emphasised, last point in accent). */
export function Sparkline({ values, width = 120, height = 36 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [i * step, height - 4 - (v / max) * (height - 8)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const [lx, ly] = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <path d={`${d} L${width},${height} L0,${height} Z`} fill={GOLD} opacity={0.1} />
      <path d={d} fill="none" stroke={GOLD} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r={4} fill={GOLD} stroke="#fff" strokeWidth={2} />
    </svg>
  );
}
