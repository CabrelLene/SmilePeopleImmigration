// server/src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
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

// ⚙️ Config .env
const PORT = Number(process.env.PORT || 4000);
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/immigrpro";
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:5173";

const app = express();

// 🔧 Middlewares
app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

// 📂 Fichiers & statiques
app.use("/api/files", uploadRoutes);
app.use("/uploads", express.static(path.resolve("uploads")));

// ✅ Santé
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// 🧭 Routes métier
app.use("/api/auth", authRoutes);
app.use("/api/app", appRoutes);
app.use("/api/admin", adminRoutes);

// 🔌 HTTP server + WebSocket
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: CORS_ORIGIN, methods: ["GET", "POST", "PATCH", "DELETE"], credentials: true },
});

// Rendre io accessible aux routes (cohérent avec req.app.get("io"))
app.set("io", io);

io.on("connection", (socket) => {
  socket.on("join", (room: string) => socket.join(room));
  // console.log("WS connected:", socket.id);
});

// 🗄️ Connexion Mongo + démarrage
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
