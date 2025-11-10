// src/pages/Questionnaire.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  HStack,
  Input,
  NumberInput,
  NumberInputField,
  Select,
  Stack,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { api } from "../api";
import QuestionCard from "../components/QuestionCard";
import Loader from "../components/Loader";

const MotionDiv = motion.div;

// ====== CONFIG DES ÉTAPES ======
const TOTAL = 6;

type FormVals = {
  // Étape 0 – Profil
  age: number;
  married: "no" | "yes";
  household: number;
  isInternationalStudent: "no" | "yes";

  // Étape 1 – Études
  edu: "highschool" | "college" | "bachelor" | "master" | "phd";
  hasCanadianStudy: "no" | "yes";
  hasEDE: "no" | "yes";

  // Étape 2 – Langues
  ieltsOverall: number;
  langAdvanced: "no" | "yes";
  langMode: "CLB" | "TEF" | "TCF";
  clbL?: number;
  clbS?: number;
  clbR?: number;
  clbW?: number;
  tefL?: number;
  tefS?: number;
  tefR?: number;
  tefW?: number;
  tcfL?: number;
  tcfS?: number;
  tcfR?: number;
  tcfW?: number;

  // Étape 3 – Expérience & emploi
  expForeign: number; // années hors Canada
  expCanada: number;  // années au Canada
  noc: "0" | "A" | "B" | "C" | "D"; // simplifié
  jobOffer: "no" | "yes";
  lmiaExempt: "no" | "yes";

  // Étape 4 – Destination & fonds
  province: string;
  fundsCAD: number;

  // Étape 5 – Liens familiaux / parrainage (orientation)
  relationSponsor: "none" | "spouse" | "parent" | "child";
  relativeInCanada: "no" | "yes";
};

export default function Questionnaire() {
  const nav = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const { register, handleSubmit, getValues, watch, setValue } = useForm<FormVals>({
    defaultValues: {
      // Étape 0
      age: 27,
      married: "no",
      household: 1,
      isInternationalStudent: "no",
      // Étape 1
      edu: "bachelor",
      hasCanadianStudy: "no",
      hasEDE: "no",
      // Étape 2
      ieltsOverall: 6.5,
      langAdvanced: "no",
      langMode: "CLB",
      // Étape 3
      expForeign: 3,
      expCanada: 0,
      noc: "A",
      jobOffer: "no",
      lmiaExempt: "no",
      // Étape 4
      province: "Québec",
      fundsCAD: 15000,
      // Étape 5
      relationSponsor: "none",
      relativeInCanada: "no"
    }
  });

  const langAdvancedOn = watch("langAdvanced") === "yes";
  const langMode = watch("langMode");

  const save = async (key: string, data: any) => {
    await api.saveStep(key, data);
  };

  const fadeIn = {
    initial: { opacity: 0, y: 10, scale: 0.995 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.22 }
  };

  if (loading) return <Loader onDone={() => setLoading(false)} />;

  // ====== HANDLERS NEXT/BACK ======
  const next = async () => setStep((s) => Math.min(TOTAL - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // ====== SUBMIT FINAL ======
  const onSubmit = handleSubmit(async () => {
    try {
      // Étape finale : persist destination + fonds + famille
      await save("destination", { province: getValues("province"), funds: getValues("fundsCAD") });
      await save("family", {
        relationSponsor: getValues("relationSponsor"),
        relativeInCanada: getValues("relativeInCanada") === "yes"
      });

      // Appel d’évaluation globale
      const res = await api.evaluate();
      nav("/result", { state: res });
    } catch (e: any) {
      toast({
        title: "Évaluation impossible",
        description: e?.message?.replace(/"/g, "") || "Réessayez dans un instant.",
        status: "error",
        isClosable: true
      });
    }
  });

  return (
    <form onSubmit={onSubmit}>
      {/* ÉTAPE 0 – PROFIL */}
      {step === 0 && (
        <MotionDiv key="step-0" {...fadeIn}>
          <QuestionCard
            step={0}
            total={TOTAL}
            title="Votre profil"
            desc="Âge, situation familiale et statut étudiant."
            onBack={undefined}
            onNext={async () => {
              const vals = getValues();
              // Validations minimales conformes aux barèmes
              if (vals.age < 18 || vals.age > 60) {
                toast({ title: "Âge invalide", description: "Âge entre 18 et 60 ans.", status: "warning" });
                return;
              }
              if (vals.household < 1) setValue("household", 1);
              await save("profile", {
                age: vals.age,
                married: vals.married === "yes",
                household: vals.household,
                isInternationalStudent: vals.isInternationalStudent === "yes"
              });
              next();
            }}
          >
            <VStack align="stretch" spacing={3}>
              <HStack>
                <NumberInput min={18} max={60} defaultValue={27}>
                  <NumberInputField {...register("age", { valueAsNumber: true })} />
                </NumberInput>
                <Select {...register("married")}>
                  <option value="no">Célibataire</option>
                  <option value="yes">Marié(e) / Conjoint(e)</option>
                </Select>
                <NumberInput min={1} max={10} defaultValue={1}>
                  <NumberInputField placeholder="Taille ménage" {...register("household", { valueAsNumber: true })} />
                </NumberInput>
              </HStack>
              <HStack>
                <Select {...register("isInternationalStudent")}>
                  <option value="no">Pas étudiant international</option>
                  <option value="yes">Étudiant international</option>
                </Select>
              </HStack>
            </VStack>
          </QuestionCard>
        </MotionDiv>
      )}

      {/* ÉTAPE 1 – ÉTUDES */}
      {step === 1 && (
        <MotionDiv key="step-1" {...fadeIn}>
          <QuestionCard
            step={1}
            total={TOTAL}
            title="Études"
            desc="Plus haut diplôme, études au Canada et évaluation des diplômes (EDE)."
            onBack={back}
            onNext={async () => {
              const v = getValues();
              await save("education", {
                level: v.edu,
                hasCanadianStudy: v.hasCanadianStudy === "yes",
                hasEDE: v.hasEDE === "yes"
              });
              next();
            }}
          >
            <VStack align="stretch" spacing={3}>
              <Select {...register("edu")}>
                <option value="highschool">Secondaire</option>
                <option value="college">Collégial</option>
                <option value="bachelor">Baccalauréat</option>
                <option value="master">Maîtrise</option>
                <option value="phd">Doctorat</option>
              </Select>
              <HStack>
                <Select {...register("hasCanadianStudy")}>
                  <option value="no">Pas d’études au Canada</option>
                  <option value="yes">Études au Canada (cert./diplôme)</option>
                </Select>
                <Select {...register("hasEDE")}>
                  <option value="no">EDE non réalisée</option>
                  <option value="yes">EDE réalisée</option>
                </Select>
              </HStack>
            </VStack>
          </QuestionCard>
        </MotionDiv>
      )}

      {/* ÉTAPE 2 – LANGUES */}
      {step === 2 && (
        <MotionDiv key="step-2" {...fadeIn}>
          <QuestionCard
            step={2}
            total={TOTAL}
            title="Compétences linguistiques"
            desc="IELTS global ou saisie avancée CLB/TEF/TCF par compétence."
            onBack={back}
            onNext={async () => {
              const v = getValues();
              // base
              const payload: any = { ieltsOverall: v.ieltsOverall };
              // avancé optionnel
              if (v.langAdvanced === "yes") {
                payload.advanced = { mode: v.langMode };
                if (v.langMode === "CLB") {
                  if ([v.clbL, v.clbS, v.clbR, v.clbW].some((x) => !x)) {
                    toast({ title: "Champs manquants", description: "Complétez CLB L/S/R/W.", status: "warning" });
                    return;
                  }
                  payload.advanced.L = v.clbL; payload.advanced.S = v.clbS; payload.advanced.R = v.clbR; payload.advanced.W = v.clbW;
                }
                if (v.langMode === "TEF") {
                  if ([v.tefL, v.tefS, v.tefR, v.tefW].some((x) => x === undefined)) {
                    toast({ title: "Champs manquants", description: "Complétez TEF L/S/R/W.", status: "warning" });
                    return;
                  }
                  payload.advanced.L = v.tefL; payload.advanced.S = v.tefS; payload.advanced.R = v.tefR; payload.advanced.W = v.tefW;
                }
                if (v.langMode === "TCF") {
                  if ([v.tcfL, v.tcfS, v.tcfR, v.tcfW].some((x) => x === undefined)) {
                    toast({ title: "Champs manquants", description: "Complétez TCF L/S/R/W.", status: "warning" });
                    return;
                  }
                  payload.advanced.L = v.tcfL; payload.advanced.S = v.tcfS; payload.advanced.R = v.tcfR; payload.advanced.W = v.tcfW;
                }
              }
              await save("language", payload);
              next();
            }}
          >
            <VStack align="stretch" spacing={3}>
              <NumberInput step={0.5} min={4} max={9} defaultValue={6.5}>
                <NumberInputField {...register("ieltsOverall", { valueAsNumber: true })} />
              </NumberInput>

              <HStack>
                <Select {...register("langAdvanced")}>
                  <option value="no">Mode simple</option>
                  <option value="yes">Mode avancé (par compétence)</option>
                </Select>
                <Collapse in={langAdvancedOn} animateOpacity style={{ width: "100%" }}>
                  <HStack>
                    <Select {...register("langMode")} w="full">
                      <option value="CLB">CLB</option>
                      <option value="TEF">TEF</option>
                      <option value="TCF">TCF</option>
                    </Select>
                  </HStack>
                </Collapse>
              </HStack>

              {/* Champs avancés repliables */}
              <Collapse in={langAdvancedOn && langMode === "CLB"} animateOpacity>
                <GridLang
                  labels={["CLB – L","CLB – S","CLB – R","CLB – W"]}
                  regs={[
                    register("clbL", { valueAsNumber: true }),
                    register("clbS", { valueAsNumber: true }),
                    register("clbR", { valueAsNumber: true }),
                    register("clbW", { valueAsNumber: true }),
                  ]}
                  min={1} max={12} step={1} placeholder="1–12"
                />
              </Collapse>
              <Collapse in={langAdvancedOn && langMode === "TEF"} animateOpacity>
                <GridLang
                  labels={["TEF – L","TEF – S","TEF – R","TEF – W"]}
                  regs={[
                    register("tefL", { valueAsNumber: true }),
                    register("tefS", { valueAsNumber: true }),
                    register("tefR", { valueAsNumber: true }),
                    register("tefW", { valueAsNumber: true }),
                  ]}
                  min={0} max={700} step={5} placeholder="0–700"
                />
              </Collapse>
              <Collapse in={langAdvancedOn && langMode === "TCF"} animateOpacity>
                <GridLang
                  labels={["TCF – L","TCF – S","TCF – R","TCF – W"]}
                  regs={[
                    register("tcfL", { valueAsNumber: true }),
                    register("tcfS", { valueAsNumber: true }),
                    register("tcfR", { valueAsNumber: true }),
                    register("tcfW", { valueAsNumber: true }),
                  ]}
                  min={0} max={700} step={5} placeholder="0–700"
                />
              </Collapse>

              <Text opacity={0.75} fontSize="sm">
                Les conversions officielles sont appliquées côté système. Cette saisie affine la recommandation.
              </Text>
            </VStack>
          </QuestionCard>
        </MotionDiv>
      )}

      {/* ÉTAPE 3 – EXPÉRIENCE & EMPLOI */}
      {step === 3 && (
        <MotionDiv key="step-3" {...fadeIn}>
          <QuestionCard
            step={3}
            total={TOTAL}
            title="Expérience & offre d’emploi"
            desc="Années d’expérience (hors Canada / au Canada), niveau NOC et offre."
            onBack={back}
            onNext={async () => {
              const v = getValues();
              if (v.expForeign < 0 || v.expCanada < 0) {
                toast({ title: "Vérifiez les années", description: "Valeurs minimales 0.", status: "warning" });
                return;
              }
              await save("work", {
                foreignYears: v.expForeign,
                canadianYears: v.expCanada,
                noc: v.noc,
                jobOffer: v.jobOffer === "yes",
                lmiaExempt: v.lmiaExempt === "yes"
              });
              next();
            }}
          >
            <VStack align="stretch" spacing={3}>
              <HStack>
                <NumberInput min={0} max={30} defaultValue={3}>
                  <NumberInputField placeholder="Hors Canada (années)" {...register("expForeign", { valueAsNumber: true })} />
                </NumberInput>
                <NumberInput min={0} max={10} defaultValue={0}>
                  <NumberInputField placeholder="Au Canada (années)" {...register("expCanada", { valueAsNumber: true })} />
                </NumberInput>
              </HStack>
              <HStack>
                <Select {...register("noc")}>
                  <option value="0">NOC 0 (gestion)</option>
                  <option value="A">NOC A (professionnel)</option>
                  <option value="B">NOC B (technique)</option>
                  <option value="C">NOC C</option>
                  <option value="D">NOC D</option>
                </Select>
                <Select {...register("jobOffer")}>
                  <option value="no">Pas d’offre validée</option>
                  <option value="yes">Offre validée</option>
                </Select>
                <Select {...register("lmiaExempt")}>
                  <option value="no">LMIA requise</option>
                  <option value="yes">Dispense LMIA (exemption)</option>
                </Select>
              </HStack>
              <Text opacity={0.75} fontSize="sm">
                Pour CEC : ≥ 1 an d’expérience au Canada. Pour FSW : ≥ 1 an d’expérience qualifiée + langue (CLB ≥ 7). FST : critères métiers spécialisés.
              </Text>
            </VStack>
          </QuestionCard>
        </MotionDiv>
      )}

      {/* ÉTAPE 4 – DESTINATION & FONDS */}
      {step === 4 && (
        <MotionDiv key="step-4" {...fadeIn}>
          <QuestionCard
            step={4}
            total={TOTAL}
            title="Destination & fonds"
            desc="Province visée et fonds disponibles (FSW/PNP)."
            onBack={back}
            onNext={async () => {
              const v = getValues();
              if (!v.province || v.fundsCAD < 0) {
                toast({ title: "Champs manquants", description: "Province et fonds requis.", status: "warning" });
                return;
              }
              await save("destination", { province: v.province, funds: v.fundsCAD });
              next();
            }}
          >
            <VStack align="stretch" spacing={3}>
              <HStack>
                <Input placeholder="Province (ex: Québec, Ontario…)" {...register("province")} />
                <NumberInput min={0} step={500} defaultValue={15000}>
                  <NumberInputField placeholder="Fonds (CAD)" {...register("fundsCAD", { valueAsNumber: true })} />
                </NumberInput>
              </HStack>
              <Text opacity={0.75} fontSize="sm">
                Les seuils financiers varient selon la taille du ménage et le programme. Valeur indicative.
              </Text>
            </VStack>
          </QuestionCard>
        </MotionDiv>
      )}

      {/* ÉTAPE 5 – FAMILLE / PARRAINAGE */}
      {step === 5 && (
        <MotionDiv key="step-5" {...fadeIn}>
          <QuestionCard
            step={5}
            total={TOTAL}
            title="Famille & parrainage"
            desc="Lien familial pour parrainage et présence de proches au Canada."
            onBack={back}
            onNext={() => {/* handled by submit button */}}
          >
            <VStack align="stretch" spacing={4}>
              <HStack>
                <Select {...register("relationSponsor")}>
                  <option value="none">Aucun parrainage envisagé</option>
                  <option value="spouse">Conjoint(e)</option>
                  <option value="parent">Parent</option>
                  <option value="child">Enfant</option>
                </Select>
                <Select {...register("relativeInCanada")}>
                  <option value="no">Pas de proche au Canada</option>
                  <option value="yes">Proche citoyen/PR au Canada</option>
                </Select>
              </HStack>

              <HStack justify="space-between" mt={2}>
                <Box />
                <Button type="submit" variant="neon">Voir mon résultat</Button>
              </HStack>
            </VStack>
          </QuestionCard>
        </MotionDiv>
      )}
    </form>
  );
}

/* ================== Sous-composants locaux ================== */

function GridLang({
  labels,
  regs,
  min,
  max,
  step,
  placeholder
}: {
  labels: string[];
  regs: any[];
  min: number;
  max: number;
  step: number;
  placeholder: string;
}) {
  return (
    <Stack direction={{ base: "column", md: "row" }} spacing={3}>
      {labels.map((lab, i) => (
        <NumberInput key={lab} min={min} max={max} step={step} w={{ base: "100%", md: "25%" }}>
          <NumberInputField placeholder={lab + " " + placeholder} {...regs[i]} />
        </NumberInput>
      ))}
    </Stack>
  );
}
