export function estimateBudget(program: string) {
  // Montants indicatifs (CAD) pour MVP
  const map: Record<string, number> = {
    "Entrée Express – Travailleur qualifié (fédéral)": 2500,
    "Programme régulier des travailleurs qualifiés (Québec) – Arrima": 3000,
    "Permis d’études / PPGT comme passerelle (selon profil)": 15000,
    "Expérience canadienne (après PTPD) – préparation": 1200
  };
  // Par défaut :
  return map[program] ?? 2800;
}
