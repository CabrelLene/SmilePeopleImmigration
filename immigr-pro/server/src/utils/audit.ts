// server/src/utils/audit.ts
import AuditLog from "../models/AuditLog.js";
import { Request } from "express";

export async function logAudit(
  req: Request,
  entry: {
    action: string;
    targetType?: string;
    targetId?: string;
    meta?: any;
  }
) {
  try {
    await AuditLog.create({
      at: new Date(),
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      who: {
        // @ts-ignore (dépend de requireAuth)
        id: req.user?._id,
        // @ts-ignore
        email: req.user?.email,
      },
      meta: entry.meta || {},
    });
  } catch {
    // ne bloque jamais la requête si l'audit échoue
  }
}
