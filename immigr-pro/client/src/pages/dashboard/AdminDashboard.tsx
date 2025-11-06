import { useEffect, useState } from "react";
import { api } from "../../api";
import { Badge, Button, Card, CardBody, Heading, HStack, Select, SimpleGrid, Text, VStack } from "@chakra-ui/react";

export default function AdminDashboard(){
  const [apps,setApps] = useState<any[]>([]);
  const [loading,setLoading]=useState(false);
  useEffect(()=>{ (async()=>{ setLoading(true); setApps(await api.listApps()); setLoading(false); })(); },[]);
  if (loading) return <Text>Chargement…</Text>;
  return (
    <VStack align="stretch" spacing={4}>
      <Heading size="md">Dossiers</Heading>
      <SimpleGrid columns={{base:1, md:2}} gap={4}>
        {apps.map(a=>(
          <Card key={a._id}><CardBody>
            <HStack justify="space-between">
              <Heading size="sm">{a.user.fullName} <Badge>{a.user.email}</Badge></Heading>
              <Badge variant="solid" colorScheme="purple">{a.status}</Badge>
            </HStack>
            <Text mt={2}>Programme suggéré: <b>{a.programSuggestion || "—"}</b></Text>
            <Text>Budget estimé: {a.budgetEstimate ? `${a.budgetEstimate} $` : "—"}</Text>
            <HStack mt={3}>
              <Select defaultValue={a.status} onChange={async e=>{
                const updated = await api.setStatus(a._id, e.target.value);
                setApps(prev=>prev.map(p => p._id===a._id ? updated : p));
              }}>
                <option value="draft">draft</option>
                <option value="submitted">submitted</option>
                <option value="review">review</option>
                <option value="waiting-info">waiting-info</option>
                <option value="in-progress">in-progress</option>
                <option value="done">done</option>
              </Select>
              <Button variant="glass" onClick={()=>alert(JSON.stringify(a.answers,null,2))}>Voir réponses</Button>
            </HStack>
          </CardBody></Card>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
