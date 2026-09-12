"use client";
import { useEffect, useState, useCallback } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";

interface LogEntry {
  id: number;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string; email: string } | null;
}

function formatAction(log: LogEntry): string {
  const action = log.action.replace(/_/g, " ").toLowerCase();
  const entity = log.entityType.replace(/_/g, " ").toLowerCase();
  return `${action} ${entity}${log.entityId ? ` #${log.entityId}` : ""}`;
}

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-100 text-emerald-700",
  update: "bg-sky-100 text-sky-700",
  delete: "bg-red-100 text-red-700",
  login:  "bg-gold-100 text-gold-700",
};

function getActionColor(action: string): string {
  const lower = action.toLowerCase();
  if (lower.includes("create")) return ACTION_COLORS.create;
  if (lower.includes("update") || lower.includes("edit")) return ACTION_COLORS.update;
  if (lower.includes("delete") || lower.includes("remove")) return ACTION_COLORS.delete;
  if (lower.includes("login") || lower.includes("auth")) return ACTION_COLORS.login;
  return "bg-stone-100 text-stone-600";
}

const LIMIT = 30;

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: LIMIT.toString() });
    if (search) params.set("search", search);
    const res = await fetch(`/api/v1/audit-logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-stone-900 tracking-tight">Activity Log</h1>
            <p className="text-sm text-stone-500 mt-0.5">{total} log {total === 1 ? "entry" : "entries"}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search activity…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-stone-300 bg-white pl-9 pr-3.5 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-400 transition-colors"
          />
        </div>

        {/* Log list */}
        <div className="rounded-xl bg-white border border-stone-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="divide-y divide-stone-100">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={<Activity className="h-6 w-6" />}
              title={search ? "No matching activity" : "No activity yet"}
              description={search ? "Try a different search term." : "Actions performed in the system will appear here."}
            />
          ) : (
            <ul className="divide-y divide-stone-100">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-4 px-5 py-3.5">
                  {/* Avatar */}
                  <div className="h-8 w-8 rounded-full bg-stone-100 border border-stone-200 flex items-center justify-center text-xs font-bold text-stone-600 uppercase shrink-0 mt-0.5">
                    {log.user?.name?.charAt(0) ?? "?"}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-stone-800">
                        {log.user?.name ?? "System"}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getActionColor(log.action)}`}
                      >
                        {log.action.replace(/_/g, " ").toLowerCase()}
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mt-0.5">{formatAction(log)}</p>
                    {log.ipAddress && (
                      <p className="text-xs text-stone-400 mt-0.5">
                        from {log.ipAddress}
                      </p>
                    )}
                  </div>
                  {/* Time */}
                  <p className="text-xs text-stone-400 shrink-0 tabular-nums mt-0.5">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-stone-100 bg-stone-50">
              <p className="text-xs text-stone-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  icon={<ChevronLeft className="h-3.5 w-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
