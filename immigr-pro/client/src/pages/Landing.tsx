import { Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const MBox = motion(Box);
const MVStack = motion(VStack);

export default function Landing(){
  return (
    <MVStack spacing={8} align="center" textAlign="center"
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
      <Heading size="2xl" lineHeight="1.1">
        <Box as="span" bgGradient="linear(to-r, brand.400, purple.300)" bgClip="text">
          Votre parcours d’immigration,
        </Box>{" "}
        clarifié & élégant
      </Heading>
      <Text fontSize="lg" opacity={0.9} maxW="3xl">
        Répondez à quelques questions. Nous suggérons le meilleur programme, une estimation de budget, et vous guide pas à pas jusqu’à la réussite.
      </Text>
      <HStack>
        <Button as={Link} to="/questionnaire" variant="neon" size="lg">Commencer</Button>
        <Button as={Link} to="/register" variant="soft" size="lg">Créer un compte</Button>
      </HStack>
      <MBox
        mt={10} px={6} py={3} border="1px solid" borderColor="whiteAlpha.300" borderRadius="full"
        bg="whiteAlpha.100" backdropFilter="blur(8px)"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
      >
        PWA installable • Sauvegardes hors-ligne des brouillons • UI glassmorphism
      </MBox>
    </MVStack>
  );
}
