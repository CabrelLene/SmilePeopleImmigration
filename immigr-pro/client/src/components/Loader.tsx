import { Center, Text, VStack, Box, keyframes } from "@chakra-ui/react";
import { useEffect } from "react";

const spin = keyframes`
  0% { transform: rotate(0deg) }
  100% { transform: rotate(360deg) }
`;

export default function Loader({onDone}:{onDone:()=>void}) {
  useEffect(() => {
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <Center h="100dvh">
      <VStack spacing={5}>
        <Box
          w="64px" h="64px" borderRadius="full" position="relative"
          _before={{
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            background: "conic-gradient(from 0deg, var(--chakra-colors-brand-400), var(--chakra-colors-purple-300), var(--chakra-colors-brand-500))",
            animation: `${spin} 1.2s linear infinite`,
            WebkitMask: "radial-gradient(farthest-side, #0000 60%, #000 61%)",
            mask: "radial-gradient(farthest-side, #0000 60%, #000 61%)"
          }}
        />
        <Text fontSize="xl" opacity={0.85}>Analyse des programmes disponibles…</Text>
      </VStack>
    </Center>
  );
}
