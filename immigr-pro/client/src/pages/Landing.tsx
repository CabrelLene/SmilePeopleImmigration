import { Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";

export default function Landing(){
  return (
    <VStack spacing={8} align="center" textAlign="center">
      <Heading size="2xl" bgGradient="linear(to-r, brand.400, purple.300)" bgClip="text">
        Votre parcours d’immigration, clarifié
      </Heading>
      <Text fontSize="lg" opacity={0.85}>
        Répondez à quelques questions. Nous proposons un programme et un budget estimé, puis on vous accompagne de A à Z.
      </Text>
      <HStack>
        <Button as={Link} to="/questionnaire" colorScheme="purple" size="lg">Commencer</Button>
        <Button as={Link} to="/register" variant="glass" size="lg">Créer un compte</Button>
      </HStack>
      <Box opacity={0.6}>PWA installable – fonctionne hors-ligne pour vos brouillons.</Box>
    </VStack>
  );
}
