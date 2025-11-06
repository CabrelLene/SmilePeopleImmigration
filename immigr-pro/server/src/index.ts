import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { CONFIG } from "./config.js";
import authRoutes from "./routes/auth.routes.js";
import appRoutes from "./routes/app.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: CONFIG.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.use("/api/auth", authRoutes);
app.use("/api/applications", appRoutes);
app.use("/api/uploads", uploadRoutes);

// static files for uploaded docs
app.use("/files", express.static(path.join(process.cwd(), CONFIG.UPLOAD_DIR)));

app.use(errorHandler);

mongoose.connect(CONFIG.MONGO_URI)
  .then(() => {
    app.listen(CONFIG.PORT, () => console.log(`API on :${CONFIG.PORT}`));
  })
  .catch(err => {
    console.error("Mongo error:", err);
    process.exit(1);
  });
