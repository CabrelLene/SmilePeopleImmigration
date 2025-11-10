import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Dossier de stockage
const UPLOAD_DIR = path.resolve("uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Storage Multer
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 Mo
});

// ------------------------------------
// POST /api/files/upload (field: "file")
// ------------------------------------
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  const f = req.file!;
  const id = f.filename; // on utilise le nom de fichier comme identifiant
  const url = `/uploads/${id}`; // URL publique

  res.json({
    ok: true,
    file: {
      id,                // <— important pour la suppression
      url,
      name: f.originalname,
      size: f.size,
      mimeType: f.mimetype
    }
  });
});

// ----------------------------------------------------
// DELETE /api/files/:id → supprime le fichier du disque
// ----------------------------------------------------
router.delete("/:id", requireAuth, async (req, res) => {
  const id = req.params.id;

  // petite protection contre path traversal
  if (!/^[\w.\-]+$/.test(id)) {
    return res.status(400).json({ error: "Identifiant de fichier invalide" });
  }

  const filePath = path.join(UPLOAD_DIR, id);

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
  } catch {
    return res.status(404).json({ error: "Fichier introuvable" });
  }

  try {
    await fs.promises.unlink(filePath);
    return res.json({ ok: true, id });
  } catch (e: any) {
    console.error("Delete error:", e);
    return res.status(500).json({ error: "Suppression impossible" });
  }
});

export default router;
