import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config.js";
import User from "../models/User.js";

const sign = (user: any) =>
  jwt.sign({ id: user._id, role: user.role }, CONFIG.JWT_SECRET, { expiresIn: "7d" });

export async function register(req: Request, res: Response) {
  const { email, password, fullName } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email déjà utilisé" });
  const user = await User.create({ email, password, fullName });
  res.json({ token: sign(user), user: { id: user._id, email, fullName, role: user.role, verified: user.verified } });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await (user as any).compare(password))) {
    return res.status(400).json({ message: "Identifiants invalides" });
  }
  res.json({ token: sign(user), user: { id: user._id, email: user.email, fullName: user.fullName, role: user.role, verified: user.verified } });
}
