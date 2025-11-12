// server/src/index.ts
import "dotenv/config";
import express from "express";
import cors, { CorsOptions } from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from "node:path";
import http from "node:http";
import { Server as SocketIOServer } from "socket.io";

// Routes
import uploadRoutes from "./routes/upload.routes.js";
import authRoutes from "./routes/auth.routes.js";
import appRoutes from "./routes/app.routes.js";
import adminRoutes from "./routes/admin.routes.js";

/* -------------------- ENV -------------------- */
const PORT = Number(process.env.PORT || 4000);
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/immigrpro";

// ⚠️ Nouvelle variable: CORS_ORIGINS (séparées par des virgules, SANS slash final)
// ex: "https://smile-people-immigration.vercel.app,http://localhost:5173"
const RAW_ORIGINS =
  process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || "http://localhost:5173";

/* -------------------- CORS whitelist -------------------- */
function normalizeOrigin(o: string) {
  try {
    const u = new URL(o.trim());
    // retire une éventuelle barre oblique finale
    const norm =
      u.origin.replace(/\/+$/, "") + (u.port ? `:${u.port}` : "");
    return u.origin.replace(/\/+$/, ""); // origin est déjà host+scheme sans path
  } catch {
    // si c’est "*" ou une chaîne libre, on renvoie brut sans slash final
    return o.trim().replace(/\/+$/, "");
  }
}

const CORS_WHITELIST = RAW_ORIGINS.split(",")
  .map((s) => s.trim())
  .filter(Boolean)
  .map(normalizeOrigin);

console.log("CORS whitelist:", CORS_WHITELIST);

/* -------------------- App & middlewares -------------------- */
const app = express();

// utile si derrière un proxy (Render/Heroku)
app.set("trust proxy", 1);

// Helmet: autorise le cross-origin si besoin
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS avec callback: match exact de l’Origin (sans slash final)
const corsOpts: CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true); // allow non-browser clients
    const norm = normalizeOrigin(origin);
    const ok = CORS_WHITELIST.includes(norm);
    return cb(ok ? null : new Error(`CORS blocked for origin: ${origin}`), ok);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOpts));
// Répondre proprement aux préflights
app.options("*", cors(corsOpts));

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

/* -------------------- Static & routes -------------------- */
app.use("/api/files", uploadRoutes);
app.use("/uploads", express.static(path.resolve("uploads")));

// health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// routes métier
app.use("/api/auth", authRoutes);
app.use("/api/app", appRoutes);
app.use("/api/admin", adminRoutes);

/* -------------------- HTTP + WebSocket -------------------- */
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const norm = normalizeOrigin(origin);
      const ok = CORS_WHITELIST.includes(norm);
      return cb(ok ? null : new Error(`WS CORS blocked: ${origin}`), ok);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

// rendre io accessible
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join", (room: string) => socket.join(room));
});

/* -------------------- Mongo + start -------------------- */
try {
  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected");
  server.listen(PORT, () => {
    console.log(`API ready on http://localhost:${PORT}`);
  });
} catch (err) {
  console.error("MongoDB connection failed:", err);
  process.exit(1);
}
