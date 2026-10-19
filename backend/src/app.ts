import express, { type ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { authRouter } from "./routes/auth.js";
import { artefactsRouter } from "./routes/artefacts.js";
import { categoriesRouter } from "./routes/categories.js";
import { locationsRouter } from "./routes/locations.js";
import { usersRouter } from "./routes/users.js";
import { imagesRouter } from "./routes/images.js";
import { qrCodesRouter } from "./routes/qrCodes.js";
import { toursRouter } from "./routes/tours.js";
import { feedbackRouter } from "./routes/feedback.js";
import { analyticsRouter } from "./routes/analytics.js";
import { auditLogsRouter } from "./routes/auditLogs.js";
import { filesRouter } from "./routes/files.js";
import { publicRouter } from "./routes/public.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  // Security headers (same set the Next.js app sent)
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(self)");
    next();
  });

  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));

  const api = express.Router();
  api.use("/auth", authRouter);
  api.use("/artefacts", artefactsRouter);
  api.use("/categories", categoriesRouter);
  api.use("/locations", locationsRouter);
  api.use("/users", usersRouter);
  api.use("/images", imagesRouter);
  api.use("/qr-codes", qrCodesRouter);
  api.use("/tours", toursRouter);
  api.use("/feedback", feedbackRouter);
  api.use("/analytics", analyticsRouter);
  api.use("/audit-logs", auditLogsRouter);
  api.use("/files", filesRouter);
  api.use("/public", publicRouter);
  api.get("/health", (_req, res) => res.json({ ok: true }));
  api.use((_req, res) => res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } }));
  app.use("/api/v1", api);

  // In production, serve the built frontend (single deploy). In development Vite serves it.
  const frontendDist = path.resolve(process.env.FRONTEND_DIST ?? "../frontend/dist");
  if (fs.existsSync(path.join(frontendDist, "index.html"))) {
    app.get("/sw.js", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Service-Worker-Allowed", "/");
      res.sendFile(path.join(frontendDist, "sw.js"));
    });
    app.use(express.static(frontendDist, { index: false, maxAge: "1h" }));
    app.get("/{*splat}", (_req, res) => res.sendFile(path.join(frontendDist, "index.html")));
  }

  const onError: ErrorRequestHandler = (err, _req, res, _next) => {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return res.status(422).json({ error: { message: "File too large", code: "VALIDATION_ERROR" } });
    }
    if (err?.type === "entity.parse.failed") {
      return res.status(400).json({ error: { message: "Invalid JSON", code: "BAD_REQUEST" } });
    }
    console.error(err);
    res.status(500).json({ error: { message: "Internal server error", code: "INTERNAL_ERROR" } });
  };
  app.use(onError);

  return app;
}
