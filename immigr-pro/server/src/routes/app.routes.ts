import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createOrUpdateAnswers, evaluate, listAll, upsertStatus } from "../controllers/app.controller.js";

const r = Router();
r.use(requireAuth());
// user
r.post("/answers", createOrUpdateAnswers);
r.get("/evaluate", evaluate);
// admin
r.get("/", requireAuth("admin"), listAll);
r.patch("/:id/status", requireAuth("admin"), upsertStatus);
export default r;
