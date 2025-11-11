import { Box, HStack, Image } from "@chakra-ui/react";
import { keyframes } from "@chakra-ui/react";

const scroll = keyframes`
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
`;

export default function TrustMarquee() {
  return (
    <Box overflow="hidden" w="100%" py={6} opacity={0.9}>
      <HStack
        gap={10}
        minW="200%"
        animation={`${scroll} 22s linear infinite`}
      >
        {Array.from({ length: 2 }).map((_, k) => (
          <HStack key={k} gap={10}>
            {/* Remplace par tes logos (SVG/PNG) */}
            <Image src="/logos/cic.png" alt="IRCC" h="28px" opacity={0.85}/>
            <Image src="/logos/quebec.png" alt="Québec" h="28px" opacity={0.85}/>
            <Image src="/logos/ontario.png" alt="Ontario" h="28px" opacity={0.85}/>
            <Image src="/logos/bc.png" alt="British Columbia" h="28px" opacity={0.85}/>
            <Image src="/logos/alberta.jpeg" alt="Alberta" h="28px" opacity={0.85}/>
          </HStack>
        ))}
      </HStack>
    </Box>
  );
}
