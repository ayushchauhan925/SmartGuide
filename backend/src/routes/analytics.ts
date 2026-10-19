import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { query, requireAuth } from "../lib/http.js";

export const analyticsRouter = Router();

analyticsRouter.get("/", requireAuth(), async (req, res) => {
  const days = Math.min(90, Math.max(7, parseInt(query(req, "days") ?? "30") || 30));
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [events, topGroups, deviceGroups, langGroups, totalAll, ratings] = await Promise.all([
    prisma.scanEvent.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.scanEvent.groupBy({
      by: ["artefactId"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
      orderBy: { _count: { artefactId: "desc" } },
      take: 10,
    }),
    prisma.scanEvent.groupBy({ by: ["device"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.scanEvent.groupBy({ by: ["language"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.scanEvent.count(),
    prisma.feedback.groupBy({ by: ["rating"], where: { status: { not: "hidden" } }, _count: { _all: true } }),
  ]);

  // Per-day series (server-local day buckets) and hour-of-day histogram
  const perDay = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    perDay.set(d.toISOString().slice(0, 10), 0);
  }
  const byHour = Array.from({ length: 24 }, () => 0);
  for (const e of events) {
    const key = new Date(e.createdAt.getTime() - e.createdAt.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    if (perDay.has(key)) perDay.set(key, perDay.get(key)! + 1);
    byHour[e.createdAt.getHours()]++;
  }

  const titles = await prisma.artefact.findMany({
    where: { id: { in: topGroups.map((g) => g.artefactId) } },
    select: { id: true, title: true },
  });
  const titleOf = new Map(titles.map((t) => [t.id, t.title]));

  res.json({
    days,
    totalInRange: events.length,
    totalAll,
    series: [...perDay].map(([date, count]) => ({ date, count })),
    byHour,
    topArtefacts: topGroups.map((g) => ({ id: g.artefactId, title: titleOf.get(g.artefactId) ?? `#${g.artefactId}`, count: g._count._all })),
    devices: deviceGroups.map((g) => ({ label: g.device ?? "unknown", count: g._count._all })),
    languages: langGroups.map((g) => ({ label: g.language ?? "unknown", count: g._count._all })),
    helpful: ratings.find((r) => r.rating === 1)?._count._all ?? 0,
    notHelpful: ratings.find((r) => r.rating === -1)?._count._all ?? 0,
  });
});
