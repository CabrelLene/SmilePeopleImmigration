import { Box, Button, Heading, HStack, Text, VStack } from "@chakra-ui/react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Link } from "react-router-dom";

const MotionBox = motion(Box);

export default function ParallaxHero() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rX = useTransform(y, [-50, 50], [8, -8]);
  const rY = useTransform(x, [-50, 50], [-8, 8]);

  function onMove(e: React.MouseEvent) {
    const { left, top, width, height } = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const px = e.clientX - left - width / 2;
    const py = e.clientY - top - height / 2;
    x.set(Math.max(-50, Math.min(50, px / 6)));
    y.set(Math.max(-50, Math.min(50, py / 6)));
  }

  return (
    <MotionBox
      onMouseMove={onMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      perspective="900px"
      textAlign="center"
      pb={{ base: 10, md: 14 }}
    >
      <MotionBox
        style={{ rotateX: rX, rotateY: rY }}
        mx="auto"
        p={{ base: 6, md: 10 }}
        borderRadius="2xl"
        bg="whiteAlpha.100"
        border="1px solid"
        borderColor="whiteAlpha.200"
        backdropFilter="blur(12px)"
      >
        <Heading size={{ base: "xl", md: "2xl" }} lineHeight="1.1">
          Le <Box as="span" bgGradient="linear(to-r, brand.400, purple.300)" bgClip="text">fast-track</Box> vers votre immigration au Canada
        </Heading>
        <Text opacity={0.9} mt={4} fontSize={{ base: "md", md: "lg" }}>
          Évaluez votre profil en 2 minutes. Programme suggéré & budget estimé — puis on vous accompagne.
        </Text>
        <HStack justify="center" spacing={3} mt={6} flexWrap="wrap">
          <Button as={Link} to="/questionnaire" variant="neon" size="lg">Évaluer mon profil</Button>
          <Button as={Link} to="/register" variant="soft" size="lg">Créer un compte</Button>
        </HStack>
      </MotionBox>
    </MotionBox>
  );
}
