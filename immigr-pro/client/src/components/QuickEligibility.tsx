// src/components/QuickEligibility.tsx
import { useEffect, useMemo, useState, useId } from "react";
import {
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Collapse,
  Divider,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Icon,
  NumberInput,
  NumberInputField,
  Select,
  Spinner,
  Text,
  Tooltip,
  VStack,
  useToast,
  Checkbox,
  Input,
} from "@chakra-ui/react";
import { InfoIcon, CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

// -------------------------------------------------------------
// Types & constantes (tables paramétrables)
// -------------------------------------------------------------

type AdvancedMode = "CLB" | "TEF" | "TCF" | "NONE";
type ProgramKey =
  | "FSW"  // Federal Skilled Worker
  | "CEC"  // Canadian Experience Class
  | "FST"  // Federal Skilled Trades
  | "PNP"  // Provincial Nominee (générique)
  | "QUEBEC" // Arrima/CSQ (simplifié)
  | "FAMILY" // Parrainage familial (indications)
  | "STUDY"  // Études (PE)
  | "WORK"   // Travail temporaire (LMIA/Mobilité)
  | "VISITOR"; // Visiteur

type InputState = {
  age: number | "";
  edu: "highschool" | "college" | "bachelor" | "master" | "phd";
  ieltsOverall: number | "";
  // Avancé langues
  showAdv: boolean;
  mode: AdvancedMode;
  L: number | ""; // Listening / CLB ou score test
  S: number | "";
  R: number | "";
  W: number | "";
  // Contexte mini-quiz ++
  expYearsForeign: number | "";       // Expérience hors Canada
  expYearsCanada: number | "";        // Expérience au Canada (0 si aucune)
  hasJobOffer: boolean;               // Offre validée
  province: string;                   // Cible (ex: Québec, Ontario, ...)
  married: boolean;                   // Conjoint(e)
  fundsCAD: number | "";              // Fonds disponibles
  relationSponsor?: "none" | "spouse" | "parent" | "child"; // pour parrainage
};

// Barème éducations (approximatif pour CRS base)
const EDU_POINTS_SINGLE = {
  highschool: 30,
  college: 60,
  bachelor: 98,
  master: 126,
  phd: 140,
} as const;

// Barème âge (approx. CRS sans conjoint — simplifié)
const AGE_POINTS_SINGLE: { min: number; max: number; points: number }[] = [
  { min: 18, max: 29, points: 110 },
  { min: 30, max: 30, points: 105 },
  { min: 31, max: 31, points: 99 },
  { min: 32, max: 32, points: 94 },
  { min: 33, max: 33, points: 88 },
  { min: 34, max: 34, points: 83 },
  { min: 35, max: 35, points: 77 },
  { min: 36, max: 36, points: 72 },
  { min: 37, max: 37, points: 66 },
  { min: 38, max: 38, points: 61 },
  { min: 39, max: 39, points: 55 },
  { min: 40, max: 40, points: 50 },
  { min: 41, max: 41, points: 39 },
  { min: 42, max: 42, points: 28 },
  { min: 43, max: 43, points: 17 },
  { min: 44, max: 44, points: 6 },
];

// Points langue principale par CLB (simplifié – total sur 4 compétences)
const CLB_POINTS_PER_SKILL_SINGLE: Record<number, number> = {
  // CLB : points par compétence (Listening/Speaking/Reading/Writing)
  4: 0, 5: 1, 6: 3, 7: 6, 8: 8, 9: 10, 10: 12, 11: 12, 12: 12
};

// Points exp. Canada (approximatif, single)
const CAN_EXP_POINTS_SINGLE: Record<number, number> = {
  // années (capées à 5)
  0: 0, 1: 35, 2: 46, 3: 56, 4: 63, 5: 72
};

// Arranged Employment (simplifié, single)
const ARRANGED_EMPLOYMENT_POINTS = 50;

// Fonds recommandés (estimatifs) — taille ménage 1 par défaut pour mini-quiz
const FUNDS_MINIMUM_SINGLE = 13500; // variable IRCC (approx.), à ajuster côté backend

// Budgets estimatifs (fourchettes moyennes, CAD)
const BUDGETS: Record<ProgramKey, number> = {
  FSW: 3500,
  CEC: 3000,
  FST: 3500,
  PNP: 4500,
  QUEBEC: 5000,
  FAMILY: 1200,
  STUDY: 8000,
  WORK: 2500,
  VISITOR: 200,
};

// Provinces acceptant PNP (placeholder)
const PNP_PROVINCES = [
  "Alberta","British Columbia","Manitoba","New Brunswick","Newfoundland and Labrador","Nova Scotia","Ontario","Prince Edward Island","Saskatchewan","Yukon","Northwest Territories"
];

// -------------------------------------------------------------
// Helpers conversions & calculs (CLB/TEF/TCF, CRS, règles)
// -------------------------------------------------------------

function clbFromIELTSPerSkill(skill: "L"|"S"|"R"|"W", ielts: number): number {
  // Table simplifiée d’équivalence IELTS -> CLB (conservatrice)
  // Source générique (approx) — à valider côté backend
  const table = {
    L: [ // Listening
      { min: 8.5, clb: 10 }, { min: 8.0, clb: 9 }, { min: 7.5, clb: 8 }, { min: 6.0, clb: 7 }, { min: 5.5, clb: 6 }, { min: 5.0, clb: 5 }, { min: 4.5, clb: 4 }
    ],
    R: [ // Reading
      { min: 8.0, clb: 10 }, { min: 7.0, clb: 9 }, { min: 6.5, clb: 8 }, { min: 6.0, clb: 7 }, { min: 5.0, clb: 6 }, { min: 4.0, clb: 5 }, { min: 3.5, clb: 4 }
    ],
    W: [ // Writing
      { min: 7.5, clb: 10 }, { min: 7.0, clb: 9 }, { min: 6.5, clb: 8 }, { min: 6.0, clb: 7 }, { min: 5.5, clb: 6 }, { min: 5.0, clb: 5 }, { min: 4.0, clb: 4 }
    ],
    S: [ // Speaking
      { min: 7.5, clb: 10 }, { min: 7.0, clb: 9 }, { min: 6.5, clb: 8 }, { min: 6.0, clb: 7 }, { min: 5.5, clb: 6 }, { min: 5.0, clb: 5 }, { min: 4.0, clb: 4 }
    ]
  } as const;

  const row = table[skill].find(r => ielts >= r.min);
  return row ? row.clb : 0;
}

// Conversions TEF/TCF -> CLB (très simplifiées pour mini-quiz)
// En pratique, utiliser tables officielles (backend).
function clbFromTEF(value: number): number {
  if (value >= 400) return 10;
  if (value >= 350) return 9;
  if (value >= 300) return 8;
  if (value >= 250) return 7;
  if (value >= 200) return 6;
  if (value >= 150) return 5;
  if (value >= 120) return 4;
  return 0;
}
function clbFromTCF(value: number): number {
  if (value >= 550) return 10;
  if (value >= 500) return 9;
  if (value >= 450) return 8;
  if (value >= 400) return 7;
  if (value >= 350) return 6;
  if (value >= 300) return 5;
  if (value >= 250) return 4;
  return 0;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pointsForAge(age: number, married: boolean): number {
  const row = AGE_POINTS_SINGLE.find(r => age >= r.min && age <= r.max);
  const base = row ? row.points : (age < 18 ? 0 : age > 44 ? 0 : 0);
  return married ? Math.round(base * 0.9) : base;
}

function pointsForEducation(edu: InputState["edu"], married: boolean): number {
  const base = EDU_POINTS_SINGLE[edu] ?? 0;
  return married ? Math.round(base * 0.9) : base;
}

function pointsForLanguage(clbL: number, clbS: number, clbR: number, clbW: number, married: boolean): number {
  const per = (clb: number) => CLB_POINTS_PER_SKILL_SINGLE[clb] ?? 0;
  const total = per(clbL) + per(clbS) + per(clbR) + per(clbW);
  // Cap approximatif principal
  const capped = clamp(total, 0, 160);
  return married ? Math.round(capped * 0.9) : capped;
}

function pointsForCanadianExp(years: number, married: boolean): number {
  const y = Math.max(0, Math.min(5, Math.floor(years)));
  const base = CAN_EXP_POINTS_SINGLE[y] ?? 0;
  return married ? Math.round(base * 0.9) : base;
}

// Règles d’admissibilité / seuils (simplifiés)
function isFSWEligible(i: InputState, clbs: Record<"L"|"S"|"R"|"W", number>) {
  // FSW: CLB >= 7 en général, fonds >= seuil, expérience qualifiée (on use exp étrangère)
  const langOK = clbs.L >= 7 && clbs.S >= 7 && clbs.R >= 7 && clbs.W >= 7;
  const expOK = Number(i.expYearsForeign || 0) >= 1;
  const fundsOK = Number(i.fundsCAD || 0) >= FUNDS_MINIMUM_SINGLE;
  return langOK && expOK && fundsOK;
}
function isCECElligible(i: InputState) {
  // CEC: expérience au Canada >= 1 an (sur métiers admissibles), langue variable par NOC (simplifié: CLB 7+)
  const canOK = Number(i.expYearsCanada || 0) >= 1;
  return canOK;
}
function isFSTEligible(i: InputState, clbs: Record<"L"|"S"|"R"|"W", number>) {
  // FST: expérience en métiers spécialisés + CLB plus bas (simplifié: seuil CLB 5-7)
  const langOK = clbs.L >= 5 && clbs.S >= 5 && clbs.R >= 4 && clbs.W >= 4;
  const expTradeOK = Number(i.expYearsForeign || 0) >= 2 || Number(i.expYearsCanada || 0) >= 1;
  return langOK && expTradeOK;
}
function isPNPEligible(i: InputState) {
  // PNP générique: province cible (hors Québec), souvent offre d'emploi ou profil ciblé; mini-quiz: si province PNP + (offre OU bon profil)
  const provOK = i.province && PNP_PROVINCES.includes(i.province);
  const offerOK = !!i.hasJobOffer;
  const ageOK = typeof i.age === "number" && i.age >= 21 && i.age <= 44;
  return provOK && (offerOK || ageOK);
}
function isQuebecEligible(i: InputState) {
  // Québec (Arrima/CSQ) simplifié : langue FR/CLB, fonds, âge / études — ici on détecte une "tendance"
  const provQC = i.province.toLowerCase().includes("québec") || i.province.toLowerCase().includes("quebec");
  return provQC;
}
function isFamilyEligible(i: InputState) {
  // Parrainage: si relation indiquée != none (vérifications de revenus/documents se font ensuite)
  return i.relationSponsor && i.relationSponsor !== "none";
}
function isStudyEligible(i: InputState) {
  // Études: suppose lettre d'acceptation/CAQ, ici mini-quiz: âge/études/langue OK
  return true;
}
function isWorkEligible(i: InputState) {
  // Travail temporaire: offre? EIMT? Dans mini-quiz: si hasJobOffer on oriente
  return true;
}
function isVisitorEligible(i: InputState) {
  return true;
}

// Score CRS (approx.) — single vs married atténué
function estimateCRS(i: InputState, clbs: Record<"L"|"S"|"R"|"W", number>): number {
  const married = !!i.married;
  const agePts = pointsForAge(Number(i.age), married);
  const eduPts = pointsForEducation(i.edu, married);
  const langPts = pointsForLanguage(clbs.L, clbs.S, clbs.R, clbs.W, married);
  const canExpPts = pointsForCanadianExp(Number(i.expYearsCanada || 0), married);
  const arranged = i.hasJobOffer ? ARRANGED_EMPLOYMENT_POINTS : 0;
  // On néglige volontairement transfers/bonus (français 2e langue, etc.) dans ce mini-quiz
  return clamp(agePts + eduPts + langPts + canExpPts + arranged, 0, 600);
}

// Budget estimate (simple table)
function estimateBudget(program: ProgramKey): number {
  return BUDGETS[program] ?? 3000;
}

type Recommendation = {
  key: ProgramKey;
  label: string;
  score: number;    // CRS ou score ad hoc si non-CRS
  budget: number;
  reasons: string[];
};

// Génération des recommandations triées
function computeRecommendations(i: InputState): Recommendation[] {
  // Déduire CLB per skill
  const clbs = deriveCLBs(i);

  const recs: Recommendation[] = [];

  // FSW
  if (isFSWEligible(i, clbs)) {
    const score = estimateCRS(i, clbs);
    recs.push({
      key: "FSW",
      label: "Entrée Express — Travailleurs qualifiés (FSW)",
      score,
      budget: estimateBudget("FSW"),
      reasons: [
        "Langue principale au moins CLB 7",
        "≥ 1 an d’expérience qualifiée",
        "Fonds disponibles suffisants (estimation)"
      ]
    });
  }

  // CEC
  if (isCECElligible(i)) {
    const score = estimateCRS(i, clbs);
    recs.push({
      key: "CEC",
      label: "Entrée Express — Expérience canadienne (CEC)",
      score,
      budget: estimateBudget("CEC"),
      reasons: [
        "Expérience de travail au Canada (≥ 1 an)",
        "Voie rapide selon NOC/langue"
      ]
    });
  }

  // FST
  if (isFSTEligible(i, clbs)) {
    const score = estimateCRS(i, clbs);
    recs.push({
      key: "FST",
      label: "Entrée Express — Métiers spécialisés (FST)",
      score,
      budget: estimateBudget("FST"),
      reasons: [
        "Profil métiers spécialisés",
        "Exigences linguistiques réduites (CLB ~5-7)"
      ]
    });
  }

  // PNP
  if (isPNPEligible(i)) {
    const score = estimateCRS(i, clbs) + 50; // bonus indicatif
    recs.push({
      key: "PNP",
      label: `Programme des candidats des provinces (PNP) — ${i.province}`,
      score,
      budget: estimateBudget("PNP"),
      reasons: [
        "Province ciblée avec volets PNP",
        i.hasJobOffer ? "Offre d’emploi validée" : "Profil potentiellement intéressant pour la province"
      ]
    });
  }

  // Québec
  if (isQuebecEligible(i)) {
    const score = Math.round(estimateCRS(i, clbs) * 0.8); // score indicatif non-CRS
    recs.push({
      key: "QUEBEC",
      label: "Québec — Arrima / CSQ (estimation)",
      score,
      budget: estimateBudget("QUEBEC"),
      reasons: [
        "Province ciblée: Québec",
        "Barème spécifique (français, domaine d’études, âge)"
      ]
    });
  }

  // Parrainage
  if (isFamilyEligible(i)) {
    recs.push({
      key: "FAMILY",
      label: "Parrainage familial (indications)",
      score: 0,
      budget: estimateBudget("FAMILY"),
      reasons: [
        `Lien familial: ${relationLabel(i.relationSponsor!)}`,
        "Revenus/engagement à vérifier"
      ]
    });
  }

  // Études
  if (isStudyEligible(i)) {
    recs.push({
      key: "STUDY",
      label: "Permis d’études (indicatif)",
      score: 0,
      budget: estimateBudget("STUDY"),
      reasons: ["Lettre d’acceptation/CAQ requis", "Preuve de fonds & projet d’études cohérent"]
    });
  }

  // Travail temporaire
  if (isWorkEligible(i)) {
    recs.push({
      key: "WORK",
      label: "Travail temporaire (LMIA / Mobilité internationale)",
      score: i.hasJobOffer ? 70 : 30, // score ad hoc si offre présente
      budget: estimateBudget("WORK"),
      reasons: [i.hasJobOffer ? "Offre d’emploi présente" : "Peut nécessiter LMIA ou exemption"]
    });
  }

  // Visiteur
  if (isVisitorEligible(i)) {
    recs.push({
      key: "VISITOR",
      label: "Visa visiteur (indicatif)",
      score: 0,
      budget: estimateBudget("VISITOR"),
      reasons: ["But du voyage & attachements au pays d’origine à démontrer"]
    });
  }

  // Tri: prioriser Entrée Express (score CRS), puis PNP/QC, puis autres
  recs.sort((a, b) => b.score - a.score);
  return recs;
}

function relationLabel(r: NonNullable<InputState["relationSponsor"]>) {
  switch (r) {
    case "spouse": return "Conjoint(e)";
    case "parent": return "Parent";
    case "child": return "Enfant";
    default: return "—";
  }
}

function deriveCLBs(i: InputState): Record<"L"|"S"|"R"|"W", number> {
  const mode = i.showAdv ? i.mode : "NONE";

  if (mode === "CLB") {
    return {
      L: clamp(Number(i.L||0),1,12),
      S: clamp(Number(i.S||0),1,12),
      R: clamp(Number(i.R||0),1,12),
      W: clamp(Number(i.W||0),1,12)
    };
  }
  if (mode === "TEF") {
    return {
      L: clbFromTEF(Number(i.L||0)),
      S: clbFromTEF(Number(i.S||0)),
      R: clbFromTEF(Number(i.R||0)),
      W: clbFromTEF(Number(i.W||0))
    };
  }
  if (mode === "TCF") {
    return {
      L: clbFromTCF(Number(i.L||0)),
      S: clbFromTCF(Number(i.S||0)),
      R: clbFromTCF(Number(i.R||0)),
      W: clbFromTCF(Number(i.W||0))
    };
  }

  // Pas de détail par compétence fourni : on approxime depuis l’IELTS global (conservateur)
  const overall = Number(i.ieltsOverall||0);
  return {
    L: clbFromIELTSPerSkill("L", overall),
    S: clbFromIELTSPerSkill("S", overall),
    R: clbFromIELTSPerSkill("R", overall),
    W: clbFromIELTSPerSkill("W", overall),
  };
}

// -------------------------------------------------------------
// Composant UI
// -------------------------------------------------------------

const MotionBox = motion(Box);
const MotionCard = motion(Card);

export default function QuickEligibility() {
  const toast = useToast();
  const formId = useId();

  // État
  const [input, setInput] = useState<InputState>({
    age: 27,
    edu: "bachelor",
    ieltsOverall: 6.5,
    showAdv: false,
    mode: "CLB",
    L: "", S: "", R: "", W: "",
    expYearsForeign: 3,
    expYearsCanada: 0,
    hasJobOffer: false,
    province: "Ontario",
    married: false,
    fundsCAD: 15000,
    relationSponsor: "none"
  });

  const [loading, setLoading] = useState(false);
  const [recs, setRecs] = useState<Recommendation[]|null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation de base
  const issues = useMemo(() => {
    const errs: string[] = [];
    const age = Number(input.age||0);
    if (!age || age < 18 || age > 60) errs.push("Âge entre 18 et 60 ans.");
    const overall = Number(input.ieltsOverall||0);
    if (!overall || overall < 4 || overall > 9) errs.push("IELTS global entre 4.0 et 9.0.");
    if (!input.edu) errs.push("Sélectionnez votre niveau d’études.");
    if (input.showAdv) {
      const vals = [input.L,input.S,input.R,input.W];
      const anyEmpty = vals.some(v => v === "");
      if (!anyEmpty) {
        const m = input.mode;
        const ok = (v:number)=> m==="CLB" ? (v>=1 && v<=12) : (v>=0 && v<=700);
        if (!vals.every(v => ok(Number(v)))) {
          errs.push(`${m}: valeurs hors plage.`);
        }
      }
    }
    return errs;
  }, [input]);

  const summary = useMemo(() => {
    const parts:string[] = [];
    if (input.age!=="") parts.push(`Âge ${input.age}`);
    parts.push(labelForEdu(input.edu));
    if (input.ieltsOverall!=="") parts.push(`IELTS ${input.ieltsOverall}`);
    if (input.showAdv) parts.push(`Détails ${input.mode}`);
    if (input.hasJobOffer) parts.push("Offre d’emploi");
    if (input.province) parts.push(input.province);
    return parts.join(" • ");
  }, [input]);

  // Actions
  const run = async () => {
    setError(null);
    setRecs(null);
    if (issues.length) {
      setError("Complétez/corrigez les informations.");
      return;
    }
    try {
      setLoading(true);
      const out = computeRecommendations(input);
      setRecs(out);
    } catch (e:any) {
      setError(e?.message || "Impossible d’évaluer localement.");
      toast({ title:"Erreur", description:"Réessayez dans un instant.", status:"error" });
    } finally {
      setLoading(false);
    }
  };

  // UI helpers
  const set = <K extends keyof InputState>(k:K, v: InputState[K]) =>
    setInput(prev => ({ ...prev, [k]: v }));

  return (
    <MotionBox
      p={5}
      borderRadius="2xl"
      bg="whiteAlpha.70"
      _dark={{ bg: "whiteAlpha.100" }}
      border="1px solid"
      borderColor="whiteAlpha.200"
      backdropFilter="blur(10px)"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      <VStack align="stretch" spacing={4}>
        <HStack justify="space-between" flexWrap="wrap" gap={2}>
          <Text fontWeight={700}>Mini-quiz d’admissibilité (aperçu local)</Text>
          <Text fontSize="sm" opacity={0.8}>
            {summary || "Renseignez vos informations pour un aperçu instantané."}
          </Text>
        </HStack>

        {/* Ligne 1 — Profil clé */}
        <HStack flexWrap="wrap" gap={3}>
          <FormBlock label="Âge" hint="Entre 18 et 60 ans.">
            <NumberInput min={18} max={60} value={input.age=== "" ? "" : input.age}
                         onChange={(_,v)=> set("age", Number.isNaN(v) ? "" : v)}>
              <NumberInputField placeholder="Ex. 27" inputMode="numeric"/>
            </NumberInput>
          </FormBlock>

          <FormBlock label="Diplôme"
                     hint="Sélectionnez le plus haut diplôme (EDE si nécessaire).">
            <Select value={input.edu} onChange={e=>set("edu", e.target.value as InputState["edu"])}>
              <option value="highschool">Secondaire</option>
              <option value="college">Collégial/Bac+2</option>
              <option value="bachelor">Baccalauréat</option>
              <option value="master">Maîtrise</option>
              <option value="phd">Doctorat</option>
            </Select>
          </FormBlock>

          <FormBlock label="IELTS (global)"
                     hint="Entre 4.0 et 9.0. Détails par compétence en mode avancé.">
            <NumberInput step={0.5} min={4} max={9}
                         value={input.ieltsOverall===""? "" : input.ieltsOverall}
                         onChange={(_,v)=> set("ieltsOverall", Number.isNaN(v) ? "" : v)}>
              <NumberInputField placeholder="Ex. 6.5" inputMode="decimal"/>
            </NumberInput>
          </FormBlock>

          <FormBlock label="Province ciblée"
                     hint="Pour PNP/Québec, oriente la stratégie.">
            <Select value={input.province} onChange={e=>set("province", e.target.value)}>
              <option>Ontario</option>
              <option>Québec</option>
              <option>British Columbia</option>
              <option>Alberta</option>
              <option>Manitoba</option>
              <option>New Brunswick</option>
              <option>Nova Scotia</option>
              <option>Saskatchewan</option>
              <option>Prince Edward Island</option>
              <option>Newfoundland and Labrador</option>
              <option>Yukon</option>
              <option>Northwest Territories</option>
            </Select>
          </FormBlock>
        </HStack>

        {/* Ligne 2 — Contexte & fonds */}
        <HStack flexWrap="wrap" gap={3}>
          <FormBlock label="Exp. hors Canada (années)"
                     hint="Expérience qualifiée à l’étranger (approx.).">
            <NumberInput min={0} max={30}
                         value={input.expYearsForeign===""? "" : input.expYearsForeign}
                         onChange={(_,v)=> set("expYearsForeign", Number.isNaN(v) ? "" : v)}>
              <NumberInputField inputMode="numeric" placeholder="Ex. 3"/>
            </NumberInput>
          </FormBlock>

          <FormBlock label="Exp. au Canada (années)"
                     hint="≥ 1 an pour CEC.">
            <NumberInput min={0} max={10}
                         value={input.expYearsCanada===""? "" : input.expYearsCanada}
                         onChange={(_,v)=> set("expYearsCanada", Number.isNaN(v) ? "" : v)}>
              <NumberInputField inputMode="numeric" placeholder="Ex. 0"/>
            </NumberInput>
          </FormBlock>

          <FormBlock label="Fonds disponibles (CAD)"
                     hint="FSW/PNP exigent des seuils — estimatifs ici.">
            <NumberInput min={0} step={500}
                         value={input.fundsCAD===""? "" : input.fundsCAD}
                         onChange={(_,v)=> set("fundsCAD", Number.isNaN(v) ? "" : v)}>
              <NumberInputField inputMode="numeric" placeholder="Ex. 15000"/>
            </NumberInput>
          </FormBlock>

          <FormBlock label="Statut familial"
                     hint="Impact CRS & parrainage.">
            <HStack>
              <Checkbox isChecked={input.married} onChange={e=> set("married", e.target.checked)}>
                Marié(e)/Conjoint(e)
              </Checkbox>
            </HStack>
          </FormBlock>

          <FormBlock label="Offre d’emploi"
                     hint="Arranged employment bonifie le score/PNP.">
            <HStack>
              <Checkbox isChecked={input.hasJobOffer} onChange={e=> set("hasJobOffer", e.target.checked)}>
                Offre validée
              </Checkbox>
            </HStack>
          </FormBlock>

          <FormBlock label="Parrainage (facultatif)"
                     hint="Pour l’orientation uniquement.">
            <Select value={input.relationSponsor||"none"} onChange={e=> set("relationSponsor", e.target.value as any)}>
              <option value="none">—</option>
              <option value="spouse">Conjoint(e)</option>
              <option value="parent">Parent</option>
              <option value="child">Enfant</option>
            </Select>
          </FormBlock>
        </HStack>

        {/* Toggle avancé */}
        <HStack>
          <Button size="sm" variant="soft" onClick={()=> set("showAdv", !input.showAdv)}>
            {input.showAdv ? "Masquer les options avancées" : "Plus d’options (CLB / TEF / TCF)"}
          </Button>
        </HStack>

        {/* Bloc avancé */}
        <Collapse in={input.showAdv} animateOpacity>
          <Box
            mt={2}
            p={4}
            borderRadius="xl"
            bg="whiteAlpha.80"
            _dark={{ bg: "whiteAlpha.100" }}
            border="1px solid"
            borderColor="whiteAlpha.200"
            backdropFilter="blur(8px)"
          >
            <VStack align="stretch" spacing={3}>
              <HStack justify="space-between" flexWrap="wrap" gap={3}>
                <Text fontWeight={700}>Détails linguistiques par compétence</Text>
                <Badge colorScheme="purple" variant="subtle">Optionnel mais recommandé</Badge>
              </HStack>
              <FormBlock label="Type d’évaluation"
                         hint="Saisissez les scores par compétence selon le mode choisi.">
                <Select value={input.mode} onChange={e=> set("mode", e.target.value as AdvancedMode)}>
                  <option value="CLB">CLB (1–12)</option>
                  <option value="TEF">TEF (0–700)</option>
                  <option value="TCF">TCF (0–700)</option>
                </Select>
              </FormBlock>

              <HStack flexWrap="wrap" gap={3}>
                <SkillField mode={input.mode} label="Compr. orale (L)" value={input.L} onChange={v=> set("L", v)} />
                <SkillField mode={input.mode} label="Expr. orale (S)" value={input.S} onChange={v=> set("S", v)} />
                <SkillField mode={input.mode} label="Lecture (R)" value={input.R} onChange={v=> set("R", v)} />
                <SkillField mode={input.mode} label="Écriture (W)" value={input.W} onChange={v=> set("W", v)} />
              </HStack>

              <Text fontSize="sm" opacity={0.8}>
                Astuce : si vous avez des résultats **IELTS par compétence**, convertissez-les en **CLB** pour affiner l’estimation.
              </Text>
            </VStack>
          </Box>
        </Collapse>

        {/* Erreurs */}
        <Collapse in={!!(error || issues.length)}>
          {(error || issues.length) && (
            <Alert status="warning" variant="left-accent" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                {error && <Text>{error}</Text>}
                {issues.map((m,i)=> <Text key={i}>{m}</Text>)}
              </VStack>
            </Alert>
          )}
        </Collapse>

        {/* Actions */}
        <HStack flexWrap="wrap" gap={3}>
          <Button variant="neon" onClick={run} isLoading={loading} loadingText="Analyse…">
            Voir mes recommandations
          </Button>
          <Text fontSize="sm" opacity={0.8}>
            Estimation locale. Le diagnostic officiel sera confirmé dans le questionnaire complet.
          </Text>
        </HStack>

        {/* Résultats */}
        <Collapse in={!!recs}>
          {recs && (
            <MotionCard
              mt={3}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <HStack justify="space-between" gap={3} flexWrap="wrap">
                    <HStack>
                      <Icon as={CheckCircleIcon} color="green.300"/>
                      <Text fontWeight={700}>Recommandations (aperçu)</Text>
                    </HStack>
                    <Badge colorScheme="purple" variant="solid">Triées par pertinence</Badge>
                  </HStack>

                  {recs.map((r, idx)=> (
                    <Box key={idx} p={4} border="1px solid" borderColor="whiteAlpha.300" borderRadius="lg" bg="whiteAlpha.100">
                      <HStack justify="space-between" align="start" flexWrap="wrap" gap={3}>
                        <VStack align="start" spacing={1}>
                          <Text fontWeight={700}>{r.label}</Text>
                          <Text fontSize="sm" opacity={0.85}>
                            {r.reasons.join(" • ")}
                          </Text>
                        </VStack>
                        <VStack align="end" minW="220px">
                          <Text><b>Score:</b> {r.score}</Text>
                          <Text><b>Budget estimé:</b> {r.budget.toLocaleString("fr-CA")} $</Text>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}

                  <Divider opacity={0.2}/>
                  <HStack>
                    <Button as="a" href="/questionnaire" variant="neon">Questionnaire complet</Button>
                    <Button as="a" href="/register" variant="soft">Créer mon compte</Button>
                  </HStack>

                  <Text fontSize="xs" opacity={0.7}>
                    Ces estimations sont pédagogiques. Les règles évoluent; un conseiller vérifiera et ajustera votre dossier.
                  </Text>
                </VStack>
              </CardBody>
            </MotionCard>
          )}
        </Collapse>

        {loading && !recs && (
          <HStack opacity={0.8}>
            <Spinner size="sm"/>
            <Text fontSize="sm">Analyse des programmes disponibles…</Text>
          </HStack>
        )}
      </VStack>
    </MotionBox>
  );
}

// -------------------------------------------------------------
// Sous-composants UI
// -------------------------------------------------------------

function FieldHint({ label }: { label: string }) {
  return (
    <Tooltip
      label={label}
      hasArrow
      borderRadius="md"
      p={3}
      bg="rgba(17,16,30,0.9)"
      border="1px solid"
      borderColor="whiteAlpha.200"
    >
      <Box as="span" display="inline-flex" alignItems="center" cursor="help" aria-label={label}>
        <InfoIcon boxSize={4} opacity={0.9} />
      </Box>
    </Tooltip>
  );
}

function FormBlock({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <FormControl minW="220px" flex="1">
      <HStack align="center" justify="space-between" mb={1}>
        <FormLabel m={0}>{label}</FormLabel>
        {hint && <FieldHint label={hint}/>}
      </HStack>
      {children}
      {hint && <FormHelperText opacity={0.8}>{/* réservé si besoin */}</FormHelperText>}
    </FormControl>
  );
}

function SkillField({
  mode, label, value, onChange
}: {
  mode: AdvancedMode; label: string; value: number|""; onChange: (v:number|"")=>void;
}) {
  const min = mode === "CLB" ? 1 : 0;
  const max = mode === "CLB" ? 12 : 700;
  const step = mode === "CLB" ? 1 : 5;
  const ph = mode === "CLB" ? "CLB 1–12" : "0–700";
  return (
    <FormControl minW="220px" flex="1">
      <FormLabel>{label}</FormLabel>
      <NumberInput min={min} max={max} step={step}
                   value={value === "" ? "" : value}
                   onChange={(_,v)=> onChange(Number.isNaN(v) ? "" : v)}>
        <NumberInputField placeholder={ph} inputMode="decimal"/>
      </NumberInput>
      <FormHelperText>Plage: {min}–{max}{step===1? "" : ` (pas ${step})`}</FormHelperText>
    </FormControl>
  );
}

function labelForEdu(val: InputState["edu"]) {
  switch (val) {
    case "highschool": return "Secondaire";
    case "college": return "Collégial/Bac+2";
    case "bachelor": return "Baccalauréat";
    case "master": return "Maîtrise";
    case "phd": return "Doctorat";
    default: return "";
  }
}
