import { Request, Response } from "express";
import Application, { type ApplicationDoc } from "../models/Application.js";

/**
 * Récupère l’app du user connecté (une seule application “active”).
 * On utilise findOne pour éviter les confusions tableau/objet.
 */
export async function getMyApp(req: Request, res: Response) {
  const userId = (req as any).userId;
  const app = await Application.findOne({ user: userId }).lean<ApplicationDoc | null>();
  res.json({ app });
}

/**
 * Endpoint appelé par le client: /api/app/evaluate
 * Renvoie program, score, budget, recommendations.
 * Pas d'IA: valeurs venant de l’app si dispo sinon fallback.
 */
export async function evaluate(req: Request, res: Response) {
  const userId = (req as any).userId;
  const app = await Application.findOne({ user: userId }).lean<ApplicationDoc | null>();

  const program = app?.programSuggestion ?? "—";
  const score = typeof app?.score === "number" ? app!.score! : 480;
  const budget = typeof app?.budgetEstimate === "number" ? app!.budgetEstimate! : 0;

  const recommendations = [
    { label: program, score },
    { label: "Provincial Nominee – Ontario" },
    { label: "Expérience Québec" },
  ];

  res.json({ program, score, budget, recommendations });
}

/**
 * Liste paginée pour l’admin (utilisée par AdminDashboard).
 * Query params: q, status, sort, dir, page, pageSize
 */
export async function adminList(req: Request, res: Response) {
  const {
    q = "",
    status = "all",
    sort = "createdAt",
    dir = "desc",
    page = "1",
    pageSize = "8",
  } = req.query as Record<string, string>;

  const numPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = Math.max(1, parseInt(pageSize, 10) || 8);
  const skip = (numPage - 1) * limit;

  const find: Record<string, any> = {};
  if (status !== "all") find.status = status;
  if (q.trim()) {
    find.$or = [
      { programSuggestion: { $regex: q, $options: "i" } },
      { "answers.program": { $regex: q, $options: "i" } },
    ];
  }

  const sortMap: Record<string, 1 | -1> = { asc: 1, desc: -1 };
  const sortDir = sortMap[(dir || "desc").toLowerCase()] ?? -1;
  const sortObj: Record<string, 1 | -1> = { [sort || "createdAt"]: sortDir };

  const [items, total] = await Promise.all([
    Application.find(find)
      .populate("user", "fullName email photoUrl")
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(find),
  ]);

  const pageCount = Math.max(1, Math.ceil(total / limit));
  res.json({ items, total, pageCount });
}

/**
 * Admin update: partiel (status, programSuggestion, budgetEstimate, counselor, score).
 */
export async function adminUpdate(req: Request, res: Response) {
  const { id } = req.params;
  const { status, programSuggestion, budgetEstimate, counselor, score } = req.body || {};

  const up: Record<string, any> = {};
  if (status) up.status = status;
  if (typeof programSuggestion === "string") up.programSuggestion = programSuggestion;
  if (typeof budgetEstimate === "number") up.budgetEstimate = budgetEstimate;
  if (typeof score === "number") up.score = score;
  if (typeof counselor === "string") up.counselor = counselor;

  const updated = await Application.findByIdAndUpdate(id, up, { new: true }).lean();
  res.json(updated);
}

/**
 * Ajouter une note (placeholder – à relier à un vrai modèle si besoin)
 */
export async function adminAddNote(_req: Request, res: Response) {
  // Ici tu peux écrire en base un modèle Note lié à Application.
  res.json({ ok: true });
}
