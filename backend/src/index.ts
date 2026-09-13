import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import fs from "fs";

import authRouter from "./routes/auth";
import artefactsRouter from "./routes/artefacts";
import categoriesRouter from "./routes/categories";
import locationsRouter from "./routes/locations";
import usersRouter from "./routes/users";
import qrCodesRouter from "./routes/qrCodes";
import auditLogsRouter from "./routes/auditLogs";
import publicRouter from "./routes/public";
import filesRouter from "./routes/files";
import { prisma } from "./lib/prisma";
import { sanitizeBody } from "./middleware/sanitize";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000");
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
const IS_PROD = process.env.NODE_ENV === "production";

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: IS_PROD
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      }
    : false,
  permittedCrossDomainPolicies: { permittedPolicies: "none" },
}));
// Permissions-Policy not in helmet by default — add manually
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
  next();
});

// Gzip compression
app.use(compression());

// Request logging
app.use(morgan(IS_PROD ? "combined" : "dev"));

// CORS
app.use(cors({
  origin: IS_PROD
    ? [FRONTEND_URL]
    : [FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sanitizeBody);

// API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/artefacts", artefactsRouter);
app.use("/api/v1/categories", categoriesRouter);
app.use("/api/v1/locations", locationsRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/qr-codes", qrCodesRouter);
app.use("/api/v1/audit-logs", auditLogsRouter);
app.use("/api/v1/public", publicRouter);
app.use("/uploads", filesRouter);

// Health check
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$runCommandRaw({ ping: 1 });
    res.json({ ok: true, timestamp: new Date().toISOString(), db: "connected" });
  } catch {
    res.status(503).json({ ok: false, db: "disconnected" });
  }
});

// Serve frontend in production
if (IS_PROD) {
  const distPath = path.resolve("../frontend/dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, { maxAge: "1d" }));
    app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
}

// 404 for API routes
app.use("/api", (_req, res) => {
  res.status(404).json({ error: { message: "Not found", code: "NOT_FOUND" } });
});

// Global error handler
app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error:`, err.message);
  const status = err.status ?? 500;
  res.status(status).json({
    error: {
      message: IS_PROD && status === 500 ? "Internal server error" : err.message,
      code: status === 500 ? "INTERNAL_ERROR" : "ERROR",
    },
  });
});

const server = app.listen(PORT, () => {
  console.log(`SmartGuide backend running on http://localhost:${PORT} [${IS_PROD ? "production" : "development"}]`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  console.log(`\nReceived ${signal}, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Prevent crashes from unhandled async errors
process.on("unhandledRejection", (reason) => {
  console.error(`[${new Date().toISOString()}] Unhandled rejection:`, reason);
});
process.on("uncaughtException", (err) => {
  console.error(`[${new Date().toISOString()}] Uncaught exception:`, err.message);
});

export default app;
