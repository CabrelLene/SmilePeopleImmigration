import { Router } from "express";
import { evaluate, getMyApp } from "../controllers/app.controller.js";
 
import { requireAuth } from "../middleware/requireAuth.js"

const router = Router();

// Exemples d’API “côté user”
router.get("/me", requireAuth, getMyApp);
router.get("/evaluate", requireAuth, evaluate);

export default router;
