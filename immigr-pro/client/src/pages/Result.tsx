import { useLocation, Link } from "react-router-dom";
import { Box, Button, Card, CardBody, Heading, HStack, Stat, StatLabel, StatNumber, Text, VStack } from "@chakra-ui/react";

export default function Result(){
  const { state } = useLocation() as any;
  if (!state) return <Text>Revenir au <Link to="/questionnaire">questionnaire</Link></Text>;
  const { program, score, budget, breakdown } = state;

  return (
    <Card>
      <CardBody>
        <VStack align="stretch" spacing={5}>
          <Heading size="lg">{program}</Heading>
          <HStack>
            <Stat><StatLabel>Score (approx.)</StatLabel><StatNumber>{score}</StatNumber></Stat>
            <Stat><StatLabel>Budget estimé</StatLabel><StatNumber>{budget.toLocaleString("fr-CA")} $</StatNumber></Stat>
          </HStack>
          <Box opacity={0.8} fontSize="sm">
            <b>Note:</b> Ce résultat est une approximation pédagogique basée sur vos réponses. Une validation officielle peut donner un résultat différent.
          </Box>
          <HStack>
            <Button as={Link} to="/register" colorScheme="purple">Être accompagné</Button>
            <Button as={Link} to="/questionnaire" variant="glass">Recommencer</Button>
          </HStack>
          <Box fontSize="sm" opacity={0.7}>Détails: {JSON.stringify(breakdown)}</Box>
        </VStack>
      </CardBody>
    </Card>
  );
}
