import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { handleUpload, upload } from "../controllers/upload.controller.js";
const r = Router();
r.post("/", requireAuth(), upload.single("file"), handleUpload);
export default r;
