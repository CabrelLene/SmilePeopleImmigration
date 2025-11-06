import { Request, Response } from "express";
import multer from "multer";
import path from "node:path";
import { CONFIG } from "../config.js";
import Document from "../models/Document.js";
import { AuthReq } from "../middleware/auth.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CONFIG.UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const name = Date.now() + "-" + Math.round(Math.random()*1e9) + path.extname(file.originalname);
    cb(null, name);
  }
});
export const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

export async function handleUpload(req: AuthReq, res: Response) {
  // @ts-ignore
  const f = req.file;
  const doc = await Document.create({
    user: req.user!.id,
    application: req.body.applicationId || undefined,
    originalName: f.originalname,
    mimeType: f.mimetype,
    size: f.size,
    url: `/files/${f.filename}`
  });
  res.json(doc);
}
