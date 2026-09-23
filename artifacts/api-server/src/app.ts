import express, { type Express } from "express";
import path from "node:path";
import fs from "node:fs";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// Single-service deployment: serve the built Mecka Clash frontend from the
// repository root even though Render starts the API package from artifacts/api-server.
const frontendDistCandidates = [
  path.resolve(process.cwd(), "artifacts/mecka-clash-dashboard/dist/public"),
  path.resolve(process.cwd(), "../mecka-clash-dashboard/dist/public"),
  path.resolve(process.cwd(), "../../artifacts/mecka-clash-dashboard/dist/public"),
];
const frontendDist = frontendDistCandidates.find((dir) => fs.existsSync(dir)) ?? frontendDistCandidates[0];

app.use(
  express.static(frontendDist, {
    index: false,
    setHeaders(res, filePath) {
      // Vite emits content-hashed files under /assets → safe to cache for a year.
      if (filePath.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else if (/\.(webp|png|svg|jpg|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=86400");
      } else {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  }),
);

// SPA fallback for client-side routes such as /war-center and /war-planner.
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.setHeader("Cache-Control", "no-cache");
    return res.sendFile(path.join(frontendDist, "index.html"), (err) => {
      if (err) next(err);
    });
  }
  next();
});

export default app;
