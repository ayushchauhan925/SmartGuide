import { Router, type Request } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { apiError, getIp, query } from "../lib/http.js";
import { rateLimit } from "../lib/rate-limit.js";
import { DEFAULT_LANGUAGE, LANGUAGES, isLanguage } from "../lib/languages.js";

/** Unauthenticated endpoints used by the visitor site. */
export const publicRouter = Router();

const cardSelect = {
  uniquePublicId: true,
  title: true,
  category: { select: { id: true, name: true } },
  location: { select: { id: true, name: true } },
  images: { orderBy: { displayOrder: "asc" as const }, take: 1, select: { imageUrl: true, altText: true } },
};

function searchWhere(q: string | undefined, categoryId: number, locationId: number): Prisma.ArtefactWhereInput {
  return {
    status: "active",
    ...(Number.isFinite(categoryId) ? { categoryId } : {}),
    ...(Number.isFinite(locationId) ? { locationId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { translations: { some: { OR: [{ title: { contains: q } }, { description: { contains: q } }] } } },
          ],
        }
      : {}),
  };
}

/** Picks ?lang=, else the Accept-Language header, else the default, limited to languages that have content. */
function resolveLanguage(req: Request, requested: string | undefined, available: string[]) {
  if (isLanguage(requested) && available.includes(requested)) return requested;
  for (const part of (req.headers["accept-language"] ?? "").split(",")) {
    const code = part.trim().split(/[-;]/)[0].toLowerCase();
    if (isLanguage(code) && available.includes(code)) return code;
  }
  return DEFAULT_LANGUAGE;
}

// ── Landing page ─────────────────────────────────────────────────

publicRouter.get("/home", async (_req, res) => {
  const [featured, total, tours] = await Promise.all([
    prisma.artefact.findMany({ where: { status: "active" }, orderBy: { updatedAt: "desc" }, take: 6, select: cardSelect }),
    prisma.artefact.count({ where: { status: "active" } }),
    prisma.tour.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { _count: { select: { stops: true } } },
    }),
  ]);
  res.json({ featured, total, tours, languages: LANGUAGES.length });
});

// ── Explore ──────────────────────────────────────────────────────

publicRouter.get("/explore", async (req, res) => {
  const PAGE_SIZE = 24;
  const q = query(req, "q")?.trim() ?? "";
  const categoryId = parseInt(query(req, "category") ?? "");
  const locationId = parseInt(query(req, "location") ?? "");
  const page = Math.max(1, parseInt(query(req, "page") ?? "1") || 1);
  const where = searchWhere(q, categoryId, locationId);

  const [artefacts, total, categories, locations] = await Promise.all([
    prisma.artefact.findMany({ where, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, orderBy: { updatedAt: "desc" }, select: cardSelect }),
    prisma.artefact.count({ where }),
    prisma.category.findMany({ orderBy: { name: "asc" }, where: { artefacts: { some: { status: "active" } } }, select: { id: true, name: true } }),
    prisma.location.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  res.json({ artefacts, total, page, pages: Math.ceil(total / PAGE_SIZE), categories, locations });
});

// ── Artefacts ────────────────────────────────────────────────────

/** Query: q, category (id), location (id), ids (comma-separated public ids), page, limit */
publicRouter.get("/artefacts", async (req, res) => {
  const q = query(req, "q")?.trim();
  const ids = query(req, "ids")?.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 100);
  const page = Math.max(1, parseInt(query(req, "page") ?? "1") || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query(req, "limit") ?? "24") || 24));

  const where: Prisma.ArtefactWhereInput = {
    ...searchWhere(q, parseInt(query(req, "category") ?? ""), parseInt(query(req, "location") ?? "")),
    ...(ids ? { uniquePublicId: { in: ids } } : {}),
  };
  const [artefacts, total] = await Promise.all([
    prisma.artefact.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: "desc" }, select: cardSelect }),
    prisma.artefact.count({ where }),
  ]);
  res.json({ artefacts, total, page, pages: Math.ceil(total / limit) });
});

publicRouter.get("/artefacts/:uniquePublicId", async (req, res) => {
  const artefact = await prisma.artefact.findUnique({
    where: { uniquePublicId: req.params.uniquePublicId },
    include: {
      category: { select: { name: true } },
      location: { select: { name: true } },
      images: { orderBy: { displayOrder: "asc" } },
      audio: true,
    },
  });
  if (!artefact || artefact.status !== "active") return apiError(res, "Artefact not found", "NOT_FOUND", 404);
  res.json({ artefact });
});

/** Everything the visitor artefact page needs: resolved language, tour navigation and related items. */
publicRouter.get("/artefacts/:uniquePublicId/page", async (req, res) => {
  const artefact = await prisma.artefact.findUnique({
    where: { uniquePublicId: req.params.uniquePublicId, status: "active" },
    include: {
      category: { select: { name: true } },
      location: { select: { name: true, floorPlanUrl: true } },
      images: { orderBy: { displayOrder: "asc" } },
      audio: true,
      translations: true,
    },
  });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const availableLangs = [DEFAULT_LANGUAGE, ...artefact.translations.map((t) => t.language)];
  const lang = resolveLanguage(req, query(req, "lang"), availableLangs);
  const translation = artefact.translations.find((t) => t.language === lang);
  const title = translation?.title ?? artefact.title;
  const description = translation ? translation.description : artefact.description;

  // Guided tour context (?tour=slug): previous / next stops
  let tourNav: { title: string; slug: string; index: number; total: number; prev?: string; next?: string } | null = null;
  const tourSlug = query(req, "tour");
  if (tourSlug) {
    const tour = await prisma.tour.findUnique({
      where: { slug: tourSlug, isPublished: true },
      include: {
        stops: {
          orderBy: { position: "asc" },
          where: { artefact: { status: "active" } },
          include: { artefact: { select: { uniquePublicId: true } } },
        },
      },
    });
    const idx = tour ? tour.stops.findIndex((s) => s.artefactId === artefact.id) : -1;
    if (tour && idx >= 0) {
      tourNav = {
        title: tour.title,
        slug: tour.slug,
        index: idx,
        total: tour.stops.length,
        prev: tour.stops[idx - 1]?.artefact.uniquePublicId,
        next: tour.stops[idx + 1]?.artefact.uniquePublicId,
      };
    }
  }

  // Related artefacts: same category or same location
  const relatedFilters = [
    artefact.categoryId ? { categoryId: artefact.categoryId } : null,
    artefact.locationId ? { locationId: artefact.locationId } : null,
  ].filter((x): x is NonNullable<typeof x> => x !== null);
  const related = relatedFilters.length
    ? await prisma.artefact.findMany({
        where: { status: "active", id: { not: artefact.id }, OR: relatedFilters },
        select: cardSelect,
        take: 3,
      })
    : [];

  const { translations: _t, ...rest } = artefact;
  res.json({ artefact: rest, lang, availableLangs, title, description, tourNav, related });
});

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless/i;

function deviceFromUa(ua: string): string {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

publicRouter.post("/artefacts/:uniquePublicId/scan", async (req, res) => {
  const { uniquePublicId } = req.params;
  const ua = req.headers["user-agent"] ?? "";
  if (BOT_RE.test(ua)) return res.json({ counted: false });

  if (!rateLimit(`scan:${getIp(req)}:${uniquePublicId}`, 5, 60 * 1000)) {
    return apiError(res, "Too many requests", "RATE_LIMITED", 429);
  }

  const body = req.body ?? {};
  const language = isLanguage(body.language) ? body.language : null;
  const referrer = typeof body.referrer === "string" && body.referrer ? body.referrer.slice(0, 190) : null;

  const artefact = await prisma.artefact.findUnique({ where: { uniquePublicId, status: "active" }, select: { id: true } });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  await prisma.$transaction([
    prisma.scanEvent.create({ data: { artefactId: artefact.id, device: deviceFromUa(ua), language, referrer } }),
    prisma.qrCode.updateMany({
      where: { artefactId: artefact.id },
      data: { scanCount: { increment: 1 }, lastScannedAt: new Date() },
    }),
  ]);
  res.json({ counted: true });
});

publicRouter.get("/artefacts/:uniquePublicId/feedback", async (req, res) => {
  const artefact = await prisma.artefact.findUnique({
    where: { uniquePublicId: req.params.uniquePublicId, status: "active" },
    select: { id: true },
  });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  const [up, down, comments] = await Promise.all([
    prisma.feedback.count({ where: { artefactId: artefact.id, rating: 1, status: { not: "hidden" } } }),
    prisma.feedback.count({ where: { artefactId: artefact.id, rating: -1, status: { not: "hidden" } } }),
    prisma.feedback.findMany({
      where: { artefactId: artefact.id, status: "approved", comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, rating: true, comment: true, createdAt: true },
    }),
  ]);
  res.json({ up, down, comments });
});

publicRouter.post("/artefacts/:uniquePublicId/feedback", async (req, res) => {
  if (!rateLimit(`feedback:${getIp(req)}`, 5, 60 * 60 * 1000)) {
    return apiError(res, "Too many submissions. Please try later.", "RATE_LIMITED", 429);
  }
  const body = req.body ?? {};
  const rating = body.rating === 1 || body.rating === -1 ? body.rating : null;
  if (rating === null) return apiError(res, "Rating must be 1 or -1", "VALIDATION_ERROR", 422);
  const comment = typeof body.comment === "string" && body.comment.trim() ? body.comment.trim().slice(0, 1000) : null;

  const artefact = await prisma.artefact.findUnique({
    where: { uniquePublicId: req.params.uniquePublicId, status: "active" },
    select: { id: true },
  });
  if (!artefact) return apiError(res, "Artefact not found", "NOT_FOUND", 404);

  await prisma.feedback.create({ data: { artefactId: artefact.id, rating, comment } });
  res.status(201).json({ ok: true });
});

// ── Tours ────────────────────────────────────────────────────────

publicRouter.get("/tours", async (_req, res) => {
  const tours = await prisma.tour.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { stops: true } },
      stops: {
        orderBy: { position: "asc" },
        take: 3,
        include: {
          artefact: { select: { title: true, images: { orderBy: { displayOrder: "asc" }, take: 1, select: { imageUrl: true } } } },
        },
      },
    },
  });
  res.json({ tours });
});

publicRouter.get("/tours/:slug", async (req, res) => {
  const tour = await prisma.tour.findUnique({
    where: { slug: req.params.slug, isPublished: true },
    include: {
      stops: {
        orderBy: { position: "asc" },
        where: { artefact: { status: "active" } },
        include: {
          artefact: {
            select: {
              uniquePublicId: true,
              title: true,
              location: { select: { name: true } },
              images: { orderBy: { displayOrder: "asc" }, take: 1, select: { imageUrl: true } },
            },
          },
        },
      },
    },
  });
  if (!tour) return apiError(res, "Tour not found", "NOT_FOUND", 404);
  res.json({ tour });
});
