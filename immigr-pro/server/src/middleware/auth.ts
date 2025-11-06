import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config.js";

export interface AuthReq extends Request { user?: { id: string; role: "user"|"admin" } }

export function requireAuth(role?: "admin") {
  return (req: AuthReq, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return res.status(401).json({message: "Unauthorized"});
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, CONFIG.JWT_SECRET) as any;
      req.user = { id: payload.id, role: payload.role };
      if (role && payload.role !== role) return res.status(403).json({message: "Forbidden"});
      next();
    } catch {
      res.status(401).json({message: "Invalid token"});
    }
  };
}
