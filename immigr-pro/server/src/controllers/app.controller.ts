import { Response } from "express";
import Application from "../models/Application.js";
import { AuthReq } from "../middleware/auth.js";
import { evaluateCandidate } from "../utils/evaluator.js";
import { estimateBudget } from "../utils/budget.js";

export async function createOrUpdateAnswers(req: AuthReq, res: Response) {
  const { key, data } = req.body; // step key + data
  let app = await Application.findOne({ user: req.user!.id, status: "draft" });
  if (!app) app = await Application.create({ user: req.user!.id, answers: [] });

  const found = app.answers.find((s: any) => s.key === key);
  if (found) found.data = data; else app.answers.push({ key, data });
  await app.save();
  res.json(app);
}

export async function evaluate(req: AuthReq, res: Response) {
  const app = await Application.findOne({ user: req.user!.id }).lean();
  if (!app) return res.status(404).json({ message: "Aucune réponse" });
  const evalRes = evaluateCandidate(app.answers);
  const budget = estimateBudget(evalRes.program);
  await Application.updateOne({ _id: app._id }, { programSuggestion: evalRes.program, scoreBreakdown: evalRes.breakdown, budgetEstimate: budget });
  res.json({ ...evalRes, budget });
}

export async function listAll(req: AuthReq, res: Response) {
  // admin
  const list = await Application.find().populate("user","email fullName").sort({createdAt:-1});
  res.json(list);
}

export async function upsertStatus(req: AuthReq, res: Response) {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await Application.findByIdAndUpdate(id, { status }, { new: true });
  res.json(updated);
}
