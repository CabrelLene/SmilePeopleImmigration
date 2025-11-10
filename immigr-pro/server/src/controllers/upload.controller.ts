// server/src/controllers/upload.controller.ts
import type { Request, Response } from "express";
import File from "../models/File.js";

export async function handleUpload(req: Request, res: Response) {
  try {
    // Sécurité : nécessite l’auth
    if (!req.user?._id) {
      return res.status(401).json({ error: "Auth required" });
    }

    // Ici, selon ton middleware d'upload (multer, etc.)
    // Supposons que tu reçoives req.file (single) avec: originalname, filename, mimetype, size
    const f = (req as any).file as
      | { originalname: string; filename: string; mimetype?: string; size?: number }
      | undefined;

    if (!f) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Enregistre le fichier en DB
    const doc = await File.create({
      user: req.user._id,
      name: f.originalname,
      url: `/uploads/${f.filename}`, // selon ta stratégie de stockage
      mimeType: f.mimetype || "application/octet-stream",
      size: f.size || 0,
    });

    // Émet un évènement temps réel (si besoin)
    const io = req.app.get("io");
    io?.emit("file:uploaded", {
      fileId: doc._id,
      userId: req.user._id,
    });

    return res.json({
      ok: true,
      file: {
        id: String(doc._id),
        name: doc.name,
        url: doc.url,
        mimeType: doc.mimeType,
        size: doc.size,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Upload error" });
  }
}
