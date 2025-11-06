/**
 * Approximation pédagogique du pointage (style Entrée Express & variantes),
 * pour orienter le candidat. Le dashboard admin peut ajuster/valider.
 */
type Answer = { key: string; data: any };
const pick = (answers: Answer[], key: string) => answers.find(a => a.key===key)?.data;

export function evaluateCandidate(answers: Answer[]) {
  const age: number = pick(answers,"profile")?.age ?? 30;
  const edu: string = pick(answers,"education")?.level ?? "bachelor";
  const ielts: number = pick(answers,"language")?.ieltsOverall ?? 6.5;
  const expYears: number = pick(answers,"work")?.years ?? 3;
  const hasJobOffer: boolean = !!pick(answers,"work")?.jobOffer;
  const province: string|undefined = pick(answers,"destination")?.province;

  // scores très simplifiés
  let score = 0;
  if (age >= 20 && age <= 29) score += 100;
  else if (age <= 35) score += 90;
  else if (age <= 40) score += 70; else score += 40;

  const eduMap: Record<string,number> = { highschool: 40, college: 70, bachelor: 100, master: 120, phd: 140 };
  score += eduMap[edu] ?? 70;

  if (ielts >= 8) score += 140;
  else if (ielts >= 7) score += 110;
  else if (ielts >= 6) score += 80; else score += 30;

  score += Math.min(5, expYears) * 20;

  if (hasJobOffer) score += 50;

  // Orientation
  let program = "Entrée Express – Travailleur qualifié (fédéral)";
  if (province) {
    if (province.toLowerCase()==="québec" || province.toLowerCase()==="quebec") {
      program = "Programme régulier des travailleurs qualifiés (Québec) – Arrima";
    } else if (hasJobOffer && ielts >= 6) {
      program = `Programme des candidats des provinces (${province}) – Volet offre d’emploi`;
    }
  }

  if (score < 250) program = "Permis d’études / PPGT comme passerelle (selon profil)";
  if (expYears >= 1 && pick(answers,"status")?.isInternationalStudent === true) {
    program = "Expérience canadienne (après PTPD) – préparation";
  }

  return {
    program,
    score,
    breakdown: { age, edu, ielts, expYears, hasJobOffer, province }
  };
}
