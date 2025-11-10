// server/src/utils/evaluator.ts
import Application, { type ApplicationDoc } from "../models/Application.js";
import { BUDGET, FUNDS_MINIMUM_SINGLE, PNP_PROVINCES } from "./budget.js";

// --- conversions simplifiées (source de vérité backend)
function clbFromIELTS(skill: "L" | "S" | "R" | "W", overall: number) {
  const t: Record<string, { min: number; clb: number }[]> = {
    L: [
      { min: 8.5, clb: 10 },
      { min: 8, clb: 9 },
      { min: 7.5, clb: 8 },
      { min: 6, clb: 7 },
      { min: 5.5, clb: 6 },
      { min: 5, clb: 5 },
      { min: 4.5, clb: 4 },
    ],
    R: [
      { min: 8, clb: 10 },
      { min: 7, clb: 9 },
      { min: 6.5, clb: 8 },
      { min: 6, clb: 7 },
      { min: 5, clb: 6 },
      { min: 4, clb: 5 },
      { min: 3.5, clb: 4 },
    ],
    W: [
      { min: 7.5, clb: 10 },
      { min: 7, clb: 9 },
      { min: 6.5, clb: 8 },
      { min: 6, clb: 7 },
      { min: 5.5, clb: 6 },
      { min: 5, clb: 5 },
      { min: 4, clb: 4 },
    ],
    S: [
      { min: 7.5, clb: 10 },
      { min: 7, clb: 9 },
      { min: 6.5, clb: 8 },
      { min: 6, clb: 7 },
      { min: 5.5, clb: 6 },
      { min: 5, clb: 5 },
      { min: 4, clb: 4 },
    ],
  };
  const r = t[skill].find((x) => overall >= x.min);
  return r ? r.clb : 0;
}
const clbFromTEF = (v: number) =>
  v >= 400 ? 10 : v >= 350 ? 9 : v >= 300 ? 8 : v >= 250 ? 7 : v >= 200 ? 6 : v >= 150 ? 5 : v >= 120 ? 4 : 0;
const clbFromTCF = (v: number) =>
  v >= 550 ? 10 : v >= 500 ? 9 : v >= 450 ? 8 : v >= 400 ? 7 : v >= 350 ? 6 : v >= 300 ? 5 : v >= 250 ? 4 : 0;

function deriveCLB(language: any) {
  if (language?.advanced?.mode === "CLB") return language.advanced;
  if (language?.advanced?.mode === "TEF")
    return {
      L: clbFromTEF(Number(language.advanced.L || 0)),
      S: clbFromTEF(Number(language.advanced.S || 0)),
      R: clbFromTEF(Number(language.advanced.R || 0)),
      W: clbFromTEF(Number(language.advanced.W || 0)),
    };
  if (language?.advanced?.mode === "TCF")
    return {
      L: clbFromTCF(Number(language.advanced.L || 0)),
      S: clbFromTCF(Number(language.advanced.S || 0)),
      R: clbFromTCF(Number(language.advanced.R || 0)),
      W: clbFromTCF(Number(language.advanced.W || 0)),
    };
  const overall = Number(language?.ieltsOverall || 0);
  return {
    L: clbFromIELTS("L", overall),
    S: clbFromIELTS("S", overall),
    R: clbFromIELTS("R", overall),
    W: clbFromIELTS("W", overall),
  };
}

// CRS approximatif (âge/édu/langue/expCA/emploi)
function roughCRS({
  age,
  married,
  edu,
  clb,
  expCA,
  arranged,
}: {
  age: number;
  married: boolean;
  edu: string;
  clb: any;
  expCA: number;
  arranged: boolean;
}) {
  const ageT = [
    { min: 18, max: 29, pts: 110 },
    { min: 30, max: 30, pts: 105 },
    { min: 31, max: 31, pts: 99 },
    { min: 32, max: 32, pts: 94 },
    { min: 33, max: 33, pts: 88 },
    { min: 34, max: 34, pts: 83 },
    { min: 35, max: 35, pts: 77 },
    { min: 36, max: 36, pts: 72 },
    { min: 37, max: 37, pts: 66 },
    { min: 38, max: 38, pts: 61 },
    { min: 39, max: 39, pts: 55 },
    { min: 40, max: 40, pts: 50 },
    { min: 41, max: 41, pts: 39 },
    { min: 42, max: 42, pts: 28 },
    { min: 43, max: 43, pts: 17 },
    { min: 44, max: 44, pts: 6 },
  ];
  const eduT: Record<string, number> = {
    highschool: 30,
    college: 60,
    bachelor: 98,
    master: 126,
    phd: 140,
  };
  const per: Record<number, number> = { 4: 0, 5: 1, 6: 3, 7: 6, 8: 8, 9: 10, 10: 12, 11: 12, 12: 12 };
  const row = ageT.find((r) => age >= r.min && age <= r.max);
  const agePts = row ? row.pts : 0;
  const eduPts = eduT[edu] || 0;
  const lang = (per[clb.L] || 0) + (per[clb.S] || 0) + (per[clb.R] || 0) + (per[clb.W] || 0);
  const canExp = [0, 35, 46, 56, 63, 72][Math.max(0, Math.min(5, Math.floor(expCA)))] || 0;
  const arr = arranged ? 50 : 0;
  const base = agePts + eduPts + Math.min(lang, 160) + canExp + arr;
  return married ? Math.round(base * 0.9) : base;
}

export type Evaluation = {
  program: string;
  score: number;
  budget: number;
  recommendations: Array<{ label: string; score?: number }>;
};

export async function evaluate(userId: string): Promise<Evaluation> {
  // ⚠️ Le schéma Application référence l’utilisateur par le champ `user`
  const app = await Application.findOne({ user: userId }).lean<ApplicationDoc & any>();

  const profile = app?.profile || {};
  const education = app?.education || {};
  const language = app?.language || {};
  const work = app?.work || {};
  const dest = app?.destination || {};
  const family = app?.family || {};

  const clb = deriveCLB(language);

  const fswEligible =
    clb.L >= 7 &&
    clb.S >= 7 &&
    clb.R >= 7 &&
    clb.W >= 7 &&
    Number(work.foreignYears || 0) >= 1 &&
    Number(dest.funds || 0) >= FUNDS_MINIMUM_SINGLE;

  const cecEligible = Number(work.canadianYears || 0) >= 1;
  const fstEligible =
    clb.L >= 5 &&
    clb.S >= 5 &&
    clb.R >= 4 &&
    clb.W >= 4 &&
    (Number(work.foreignYears || 0) >= 2 || Number(work.canadianYears || 0) >= 1);

  const province = String(dest.province || "");
  const pnpEligible = province && PNP_PROVINCES.includes(province);
  const quebecEligible = /qu[ée]bec/i.test(province);
  const familyEligible = family.relationSponsor && family.relationSponsor !== "none";

  const scoreCRS = roughCRS({
    age: Number(profile.age || 0),
    married: !!profile.married,
    edu: String(education.level || ""),
    clb,
    expCA: Number(work.canadianYears || 0),
    arranged: !!work.jobOffer,
  });

  const recs: { key: string; label: string; score: number; budget: number; reasons: string[] }[] = [];

  if (fswEligible)
    recs.push({
      key: "FSW",
      label: "Entrée Express — Travailleurs qualifiés (FSW)",
      score: scoreCRS,
      budget: BUDGET.FSW,
      reasons: ["CLB ≥ 7", "≥ 1 an d’expérience qualifiée", "Fonds suffisants"],
    });
  if (cecEligible)
    recs.push({
      key: "CEC",
      label: "Entrée Express — Expérience canadienne (CEC)",
      score: scoreCRS,
      budget: BUDGET.CEC,
      reasons: ["≥ 1 an d’expérience au Canada"],
    });
  if (fstEligible)
    recs.push({
      key: "FST",
      label: "Entrée Express — Métiers spécialisés (FST)",
      score: scoreCRS,
      budget: BUDGET.FST,
      reasons: ["Profil métiers spécialisés", "Exigences linguistiques réduites"],
    });
  if (pnpEligible)
    recs.push({
      key: "PNP",
      label: `PNP — ${province}`,
      score: scoreCRS + (work.jobOffer ? 100 : 50),
      budget: BUDGET.PNP,
      reasons: [work.jobOffer ? "Offre d’emploi validée" : "Province PNP potentielle"],
    });
  if (quebecEligible)
    recs.push({
      key: "QUEBEC",
      label: "Québec — Arrima / CSQ (estimation)",
      score: Math.round(scoreCRS * 0.8),
      budget: BUDGET.QUEBEC,
      reasons: ["Barème distinct (FR, études, âge)"],
    });
  if (familyEligible)
    recs.push({
      key: "FAMILY",
      label: "Parrainage familial (indications)",
      score: 0,
      budget: BUDGET.FAMILY,
      reasons: ["Lien familial déclaré"],
    });

  recs.push({
    key: "STUDY",
    label: "Permis d’études (indicatif)",
    score: 0,
    budget: BUDGET.STUDY,
    reasons: ["Lettre d’acceptation/CAQ requis"],
  });
  recs.push({
    key: "WORK",
    label: "Travail temporaire (LMIA / Mobilité internationale)",
    score: work.jobOffer ? 70 : 30,
    budget: BUDGET.WORK,
    reasons: [work.jobOffer ? "Offre présente" : "Peut exiger LMIA/exemption"],
  });
  recs.push({
    key: "VISITOR",
    label: "Visa visiteur (indicatif)",
    score: 0,
    budget: BUDGET.VISITOR,
    reasons: ["But du voyage & attaches"],
  });

  recs.sort((a, b) => b.score - a.score);
  const top = recs[0] || { label: "", score: 0, budget: 0 };

  return {
    program: top.label,
    score: top.score,
    budget: top.budget,
    recommendations: recs.map((r) => ({ label: r.label, score: r.score })),
  };
}
