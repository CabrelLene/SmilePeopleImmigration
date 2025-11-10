import { Box, BoxProps } from "@chakra-ui/react";

export default function GradientFrame({ children, ...props }: BoxProps) {
  return (
    <Box p="2px" borderRadius="2xl"
         bgGradient="conic-gradient(from 120deg, rgba(145,94,254,0.6), rgba(46,187,255,0.35), rgba(145,94,254,0.6))"
         {...props}>
      <Box borderRadius="2xl"
           bg="rgba(17,16,30,0.75)"
           border="1px solid"
           borderColor="whiteAlpha.200"
           backdropFilter="blur(10px)">
        {children}
      </Box>
    </Box>
  );
}
