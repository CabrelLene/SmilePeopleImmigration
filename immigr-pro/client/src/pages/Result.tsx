import { Link } from "react-router-dom";
import { Badge, Box, Button, Card, CardBody, Heading, HStack, Stat, StatLabel, StatNumber, Text, VStack } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MCard = motion(Card);

export default function Result(){
  const state = (history.state && (history.state as any).usr) || (window as any).__ROUTER_STATE__ || null;
  // routing normal:
  const loc = (state ? { state } : ({} as any));
  const s = (loc.state || (window.history.state && window.history.state.usr)) as any;

  if (!s) return <Text>Revenir au <Link to="/questionnaire">questionnaire</Link></Text>;

  const { program, score, budget, breakdown } = s;

  return (
    <MCard initial={{opacity:0, y:8}} animate={{opacity:1,y:0}} transition={{duration:0.25}}>
      <CardBody>
        <VStack align="stretch" spacing={6}>
          <HStack justify="space-between" flexWrap="wrap" gap={2}>
            <Heading size="lg">{program}</Heading>
            <Badge colorScheme="purple" variant="solid">Recommandation automatique</Badge>
          </HStack>

          <HStack spacing={10} flexWrap="wrap">
            <Box>
              <Stat>
                <StatLabel>Score (approx.)</StatLabel>
                <StatNumber>{score}</StatNumber>
              </Stat>
            </Box>
            <Box>
              <Stat>
                <StatLabel>Budget estimé</StatLabel>
                <StatNumber>{budget.toLocaleString("fr-CA")} $</StatNumber>
              </Stat>
            </Box>
          </HStack>

          <Box opacity={0.85} fontSize="sm" bg="whiteAlpha.100" p={4} borderRadius="xl" border="1px solid" borderColor="whiteAlpha.200">
            <b>Note :</b> ce résultat est une estimation pédagogique basée sur vos réponses. Un conseiller validera et ajustera votre dossier si nécessaire.
          </Box>

          <HStack>
            <Button as={Link} to="/register" variant="neon">Être accompagné maintenant</Button>
            <Button as={Link} to="/questionnaire" variant="soft">Recommencer</Button>
          </HStack>

          <Box fontSize="sm" opacity={0.7}>
            Détails: {JSON.stringify(breakdown)}
          </Box>
        </VStack>
      </CardBody>
    </MCard>
  );
}
