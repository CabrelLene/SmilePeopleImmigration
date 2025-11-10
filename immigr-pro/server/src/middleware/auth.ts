import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_replace_me";

export function requireAuth(req: any, res: any, next: any) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide" });
  }
}

// Optionnel : stricte admin
export function requireAdmin(req: any, res: any, next: any) {
  if (req.userRole !== "admin") return res.status(403).json({ error: "Réservé administrateur" });
  next();
}
