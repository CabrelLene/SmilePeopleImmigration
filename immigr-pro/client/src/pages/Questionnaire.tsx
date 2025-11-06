import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { api } from "../api";
import { SimpleGrid, Input, Select, NumberInput, NumberInputField, Button, HStack, Text } from "@chakra-ui/react";
import QuestionCard from "../components/QuestionCard";
import Loader from "../components/Loader";
import { useNavigate } from "react-router-dom";

const TOTAL = 5;

export default function Questionnaire(){
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ const t=setTimeout(()=>setLoading(false),1400); return ()=>clearTimeout(t);},[]);
  const [step, setStep] = useState(0);
  const { register, handleSubmit, getValues } = useForm({ defaultValues: {
    age: 27, edu:"bachelor", ieltsOverall: 6.5, expYears: 3, jobOffer:"no", province:"Québec",
    isInternationalStudent: "no"
  }});

  const save = async (key: string, data: any) => {
    await api.saveStep(key, data);
  };

  if (loading) return <Loader onDone={()=>setLoading(false)}/>;

  return (
    <form onSubmit={handleSubmit(async () => {
      // persist last step & evaluate
      await save("destination", { province: getValues("province") });
      const res = await api.evaluate();
      nav("/result", { state: res });
    })}>
      {step===0 && (
        <QuestionCard step={0} total={TOTAL} title="Votre profil"
          desc="Âge et statut étudiant (si applicable)."
          onNext={async()=>{ await save("profile",{ age: getValues("age") , }); setStep(1); }}>
          <HStack>
            <NumberInput min={18} max={60} defaultValue={27}>
              <NumberInputField {...register("age",{valueAsNumber:true})}/>
            </NumberInput>
            <Select {...register("isInternationalStudent")}>
              <option value="no">Pas étudiant international</option>
              <option value="yes">Étudiant international</option>
            </Select>
          </HStack>
        </QuestionCard>
      )}

      {step===1 && (
        <QuestionCard step={1} total={TOTAL} title="Études"
          onNext={async()=>{ await save("education",{ level: getValues("edu") }); setStep(2); }}>
          <Select {...register("edu")}>
            <option value="highschool">Secondaire</option>
            <option value="college">Collégial</option>
            <option value="bachelor">Baccalauréat</option>
            <option value="master">Maîtrise</option>
            <option value="phd">Doctorat</option>
          </Select>
        </QuestionCard>
      )}

      {step===2 && (
        <QuestionCard step={2} total={TOTAL} title="Langues (IELTS global)"
          onNext={async()=>{ await save("language",{ ieltsOverall: getValues("ieltsOverall") }); setStep(3); }}>
          <NumberInput step={0.5} min={4} max={9} defaultValue={6.5}>
            <NumberInputField {...register("ieltsOverall",{valueAsNumber:true})}/>
          </NumberInput>
          <Text opacity={0.7}>Vous pourrez préciser CLB et TEF/TCF plus tard.</Text>
        </QuestionCard>
      )}

      {step===3 && (
        <QuestionCard step={3} total={TOTAL} title="Expérience & offre d’emploi"
          onNext={async()=>{ await save("work",{ years: getValues("expYears"), jobOffer: getValues("jobOffer")==="yes" }); setStep(4); }}>
          <HStack>
            <NumberInput min={0} max={30} defaultValue={3}><NumberInputField {...register("expYears",{valueAsNumber:true})}/></NumberInput>
            <Select {...register("jobOffer")}>
              <option value="no">Pas d’offre pour l’instant</option>
              <option value="yes">J’ai une offre validée</option>
            </Select>
          </HStack>
        </QuestionCard>
      )}

      {step===4 && (
        <QuestionCard step={4} total={TOTAL} title="Destination"
          onNext={() => {} /* handled by submit */}>
          <HStack>
            <Input placeholder="Province (ex: Québec)" {...register("province")}/>
            <Button type="submit" colorScheme="purple">Voir mon résultat</Button>
          </HStack>
        </QuestionCard>
      )}
    </form>
  );
}
