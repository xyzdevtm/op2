import cluster from "cluster";
import crypto from "crypto";
import MongoStore from "connect-mongo";
import express from "express";
import session from "express-session";
import rateLimit from "express-rate-limit";
import http from "http";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { GameEnv } from "../core/configuration/Config";
import { logger } from "./Logger";
import { MapPlaylist } from "./MapPlaylist";
import { MasterLobbyService } from "./MasterLobbyService";
import { startOnlineTracker } from "./OnlineTracker.js";
import { setNoStoreHeaders } from "./NoStoreHeaders";
import { renderAppShell } from "./RenderHtml";
import { ServerEnv } from "./ServerEnv";
import { applyStaticAssetCacheControl } from "./StaticAssetCache";

// Panel proxy (browser → panel)
import { createPanelProxy } from "./PanelProxy.js";

// Panel routes
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import clansRoutes from "./routes/clans.js";
import friendsRoutes from "./routes/friends.js";
import gameRoutes from "./routes/game.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import matchmakingRoutes, {
  setupMatchmakingWebSocket,
} from "./routes/matchmaking.js";
import profanityRoutes from "./routes/profanity.js";
import shopRoutes from "./routes/shop.js";
import statsRoutes from "./routes/stats.js";
import usersRoutes from "./routes/users.js";

const playlist = new MapPlaylist();
let lobbyService: MasterLobbyService;

const app = express();
const server = http.createServer(app);

const log = logger.child({ comp: "m" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// --- MongoDB Connection ---
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/openfront";
const SESSION_SECRET =
  process.env.SESSION_SECRET || "dev-session-secret";

// --- Session Middleware (must be before routes) ---
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
      ttl: 30 * 24 * 60 * 60,
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    },
  }),
);

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    log.info("Connected to MongoDB");
  } catch (error) {
    log.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// --- Session Middleware (already registered above) ---

// Serve the shared app shell for the root document.
app.use(async (req, res, next) => {
  if (req.path === "/") {
    try {
      await renderAppShell(
        res,
        path.join(__dirname, "../../static/index.html"),
      );
    } catch (error) {
      log.error("Error rendering index.html:", error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    next();
  }
});

app.use(
  express.static(path.join(__dirname, "../../static"), {
    maxAge: "1y",
    setHeaders: (res) => {
      applyStaticAssetCacheControl(
        res.setHeader.bind(res),
        res.req.originalUrl,
      );
    },
  }),
);

app.set("trust proxy", 3);
app.use(
  rateLimit({
    windowMs: 1000,
    max: 20,
  }),
);

app.use("/api", (_req, res, next) => {
  setNoStoreHeaders(res);
  next();
});

// --- Panel API Routes (served under /panel/api/*) ---
app.use("/panel/api/auth", authRoutes);
app.use("/panel/api/users", usersRoutes);
app.use("/panel/api/stats", statsRoutes);
app.use("/panel/api/shop", shopRoutes);
app.use("/panel/api/clans", clansRoutes);
app.use("/panel/api/friends", friendsRoutes);
app.use("/panel/api/leaderboard", leaderboardRoutes);
app.use("/panel/api/matchmaking", matchmakingRoutes);
app.use("/panel/api/profanity", profanityRoutes);
app.use("/panel/api/game", gameRoutes);
app.use("/panel/api/admin", adminRoutes);

// Also register auth routes at /panel/auth/* (client uses this path)
app.use("/panel/auth", authRoutes);

// Panel health check
app.get("/panel/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    mongodb: mongoose.connection.readyState === 1,
  });
});

// Panel proxy: browser → panel (for panel-ui when accessed via game server origin)
app.use(createPanelProxy());

// JWKS endpoint (serves public key for JWT verification)
app.get("/panel/.well-known/jwks.json", async (_req, res) => {
  try {
    const { getJWKS } = await import("./crypto/jwt-keys.js");
    const jwks = await getJWKS();
    res.json(jwks);
  } catch (error) {
    console.error("Failed to serve JWKS:", error);
    res.status(500).json({ error: "JWKS unavailable" });
  }
});

// Start the master process
export async function startMaster() {
  if (!cluster.isPrimary) {
    throw new Error(
      "startMaster() should only be called in the primary process",
    );
  }

  log.info(`Primary ${process.pid} is running`);
  log.info(`Setting up ${ServerEnv.numWorkers()} workers...`);

  // Connect to MongoDB before starting
  await connectMongoDB();

  // Setup matchmaking WebSocket
  setupMatchmakingWebSocket(server);

  // Start online player tracker
  startOnlineTracker();

  lobbyService = new MasterLobbyService(playlist, log);

  // Generate admin token for worker authentication
  const ADMIN_TOKEN = crypto.randomBytes(16).toString("hex");
  process.env.ADMIN_TOKEN = ADMIN_TOKEN;

  const INSTANCE_ID =
    ServerEnv.env() === GameEnv.Dev
      ? "DEV_ID"
      : crypto.randomBytes(4).toString("hex");
  process.env.INSTANCE_ID = INSTANCE_ID;

  log.info(`Instance ID: ${INSTANCE_ID}`);

  // Fork workers
  for (let i = 0; i < ServerEnv.numWorkers(); i++) {
    const worker = cluster.fork({
      WORKER_ID: i,
      ADMIN_TOKEN,
      INSTANCE_ID,
    });

    lobbyService.registerWorker(i, worker);
    log.info(`Started worker ${i} (PID: ${worker.process.pid})`);
  }

  // Handle worker crashes
  cluster.on("exit", (worker, code, signal) => {
    const workerId = (worker as Record<string, unknown>).process
      ?.env?.WORKER_ID as string | undefined;
    if (workerId === undefined) {
      log.error(`worker crashed could not find id`);
      return;
    }

    const workerIdNum = parseInt(workerId);
    lobbyService.removeWorker(workerIdNum);

    log.warn(
      `Worker ${workerId} (PID: ${worker.process.pid}) died with code: ${code} and signal: ${signal}`,
    );
    log.info(`Restarting worker ${workerId}...`);

    const newWorker = cluster.fork({
      WORKER_ID: workerId,
      ADMIN_TOKEN,
      INSTANCE_ID,
    });

    lobbyService.registerWorker(workerIdNum, newWorker);
    log.info(
      `Restarted worker ${workerId} (New PID: ${newWorker.process.pid})`,
    );
  });

  const PORT = 3000;
  server.listen(PORT, () => {
    log.info(`Master HTTP server listening on port ${PORT}`);
  });
}

app.get("/api/health", (_req, res) => {
  const ready = lobbyService?.isHealthy() ?? false;
  if (ready) {
    res.json({ status: "ok" });
  } else {
    res.status(503).json({ status: "unavailable" });
  }
});

// SPA fallback route
app.get("/{*splat}", async function (_req, res) {
  try {
    const htmlPath = path.join(
      __dirname,
      "../../static/index.html",
    );
    await renderAppShell(res, htmlPath);
  } catch (error) {
    log.error("Error rendering SPA fallback:", error);
    res.status(500).send("Internal Server Error");
  }
});
