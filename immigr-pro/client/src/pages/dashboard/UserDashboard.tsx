import { useState } from "react";
import { api } from "../../api";
import { Box, Button, Card, CardBody, Heading, SimpleGrid, Text, useToast } from "@chakra-ui/react";
import FileDrop from "../../components/FileDrop";

export default function UserDashboard(){
  const [docs,setDocs] = useState<any[]>([]);
  const toast = useToast();

  return (
    <SimpleGrid columns={{base:1, md:2}} gap={6}>
      <Card><CardBody>
        <Heading size="md" mb={4}>Mon dossier</Heading>
        <Text opacity={0.8}>Chargez vos documents (passeport, diplômes, preuves d’emploi, etc.).</Text>
        <Box mt={4}>
          <FileDrop onFile={async (f)=>{
            const d = await api.upload(f);
            setDocs(prev=>[d,...prev]);
            toast({ title: "Document téléchargé", status: "success"});
          }}/>
        </Box>
        <Box mt={4}>
          {docs.map(d => <Box key={d._id} mb={2}>{d.originalName} – <a href={d.url} target="_blank">voir</a></Box>)}
        </Box>
      </CardBody></Card>

      <Card><CardBody>
        <Heading size="md" mb={4}>Étapes</Heading>
        <Text>• Questionnaire complété ➜ résultat obtenu</Text>
        <Text>• Un conseiller vous contactera pour valider et lancer la procédure.</Text>
        <Button mt={4} variant="glass" onClick={()=>window.open("mailto:contact@immigrpro.local")}>Contacter un conseiller</Button>
      </CardBody></Card>
    </SimpleGrid>
  );
}
