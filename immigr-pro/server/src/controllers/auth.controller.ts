// server/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function sign(user: any) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function register(req: Request, res: Response) {
  try {
    // Accepte JSON ou x-www-form-urlencoded
    let { fullName, email, password } = req.body as Record<string, any>;

    // Normalisation/trim
    fullName = typeof fullName === "string" ? fullName.trim() : "";
    email = typeof email === "string" ? email.trim().toLowerCase() : "";
    password = typeof password === "string" ? password : undefined;

    if (!fullName) return res.status(400).json({ error: "Nom complet requis" });
    if (!email) return res.status(400).json({ error: "Email requis" });
    if (!password) return res.status(400).json({ error: "Mot de passe requis" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email déjà utilisé" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email, passwordHash, role: "user" });

    const token = sign(user);
    res.json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl || null,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
}

export async function login(req: Request, res: Response) {
  try {
    let { email, password } = req.body as Record<string, any>;
    email = typeof email === "string" ? email.trim().toLowerCase() : "";
    password = typeof password === "string" ? password : undefined;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Identifiants invalides" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Identifiants invalides" });

    const token = sign(user);
    res.json({
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl || null,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Server error" });
  }
}

export async function me(_req: Request, res: Response) {
  // @ts-ignore injecté par requireAuth
  const uid = _req.userId as string;
  const user = await User.findById(uid);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({
    user: {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      photoUrl: user.photoUrl || null,
    },
  });
}
