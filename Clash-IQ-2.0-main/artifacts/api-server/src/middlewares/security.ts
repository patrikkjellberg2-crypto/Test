import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Lightweight protection for the public API (no extra dependencies):
 *  - per-IP rate limits (in memory)
 *  - a global daily budget for AI calls (protects your API bill)
 *  - same-origin check for AI and write requests
 *  - restricted CORS
 *
 * Limits reset if the server restarts, which is fine for a single small
 * service. Tune them with environment variables in Render.
 */

const num = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export function clientIp(req: Request): string {
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function tooMany(res: Response, retryAfterSeconds: number, message: string) {
  res.setHeader("Retry-After", String(Math.max(1, retryAfterSeconds)));
  res.status(429).json({
    error: message,
    code: "RATE_LIMITED",
    retryAfterSeconds: Math.max(1, retryAfterSeconds),
  });
}

/** Sliding-window limiter per client IP. */
export function rateLimit(options: {
  name: string;
  windowMs: number;
  max: number;
  message?: string;
  methods?: string[];
}): RequestHandler {
  const hits = new Map<string, number[]>();
  const methods = options.methods?.map((m) => m.toUpperCase());

  const cleanup = setInterval(() => {
    const cutoff = Date.now() - options.windowMs;
    for (const [key, list] of hits) {
      const fresh = list.filter((t) => t > cutoff);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
  }, Math.max(30_000, options.windowMs));
  cleanup.unref?.();

  return (req: Request, res: Response, next: NextFunction) => {
    if (methods && !methods.includes(req.method.toUpperCase())) return next();

    const now = Date.now();
    const cutoff = now - options.windowMs;
    const key = clientIp(req);
    const list = (hits.get(key) || []).filter((t) => t > cutoff);

    if (list.length >= options.max) {
      hits.set(key, list);
      const retry = Math.ceil((list[0] + options.windowMs - now) / 1000);
      return tooMany(
        res,
        retry,
        options.message ||
          `Too many requests. Please wait ${Math.max(1, retry)} seconds and try again.`,
      );
    }

    list.push(now);
    hits.set(key, list);
    next();
  };
}

/** One shared counter per UTC day, for everyone together. */
export function dailyBudget(options: { name: string; max: number; message: string }): RequestHandler {
  let day = "";
  let used = 0;

  return (_req: Request, res: Response, next: NextFunction) => {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== day) {
      day = today;
      used = 0;
    }

    if (used >= options.max) {
      const now = new Date();
      const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
      return tooMany(res, Math.ceil((midnight - now.getTime()) / 1000), options.message);
    }

    used += 1;
    next();
  };
}

function allowedOrigins(): string[] {
  return (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function isAllowedOrigin(req: Request, origin: string): boolean {
  const clean = origin.replace(/\/$/, "");
  const self = `${req.protocol}://${req.get("host")}`;
  return clean === self || allowedOrigins().includes(clean);
}

/** Blocks browser requests that come from other websites. */
export const sameOriginOnly: RequestHandler = (req, res, next) => {
  const origin = req.get("origin");
  if (origin && !isAllowedOrigin(req, origin)) {
    res.status(403).json({ error: "This request is not allowed from this site.", code: "FORBIDDEN_ORIGIN" });
    return;
  }
  next();
};

/** CORS: only this site (and ALLOWED_ORIGINS) may call the API from a browser. */
export function corsOptionsDelegate(
  req: Request,
  callback: (error: Error | null, options?: { origin: boolean }) => void,
) {
  const origin = req.get("origin");
  callback(null, { origin: !origin || isAllowedOrigin(req, origin) });
}

export function buildSecurity() {
  return {
    // Everything under /api: generous, stops floods
    api: rateLimit({ name: "api", windowMs: 60_000, max: num(process.env.API_RATE_PER_MINUTE, 240) }),

    // Anything that writes data
    writes: rateLimit({
      name: "writes",
      windowMs: 60_000,
      max: num(process.env.WRITE_RATE_PER_MINUTE, 40),
      methods: ["POST", "PUT", "PATCH", "DELETE"],
    }),

    // AI calls cost money: strict per IP, plus one shared daily cap
    aiPerMinute: rateLimit({
      name: "ai-minute",
      windowMs: 60_000,
      max: num(process.env.AI_RATE_PER_MINUTE, 6),
      message: "You are sending AI requests too fast. Please wait a minute and try again.",
    }),
    aiPerDay: rateLimit({
      name: "ai-day",
      windowMs: 24 * 60 * 60_000,
      max: num(process.env.AI_RATE_PER_DAY, 80),
      message: "Daily AI limit reached for your device. Try again tomorrow.",
    }),
    aiGlobalDaily: dailyBudget({
      name: "ai-global",
      max: num(process.env.AI_DAILY_LIMIT, 400),
      message: "The daily AI limit for Clash IQ has been reached. Try again tomorrow.",
    }),
  };
}
