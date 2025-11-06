import { Box, HStack } from "@chakra-ui/react";
import { motion } from "framer-motion";

const MBox = motion(Box);

/**
 * Stepper animé (spring). La largeur s'anime à chaque changement de `current`.
 */
export default function Stepper({ total, current }: { total: number; current: number }) {
  const progress = ((current + 1) / total) * 100;

  return (
    <Box>
      <Box position="relative" h="8px" bg="whiteAlpha.200" borderRadius="full" overflow="hidden" mb={3}>
        <MBox
          position="absolute"
          left={0}
          top={0}
          height="100%"
          bgGradient="linear(to-r, brand.500, purple.300)"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
        />
      </Box>

      <HStack spacing={2}>
        {Array.from({ length: total }).map((_, i) => (
          <Box
            key={i}
            w="10px"
            h="10px"
            borderRadius="full"
            bg={i <= current ? "brand.500" : "whiteAlpha.400"}
            transition="background 200ms ease"
          />
        ))}
      </HStack>
    </Box>
  );
}
