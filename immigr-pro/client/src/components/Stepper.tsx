import { HStack, Box } from "@chakra-ui/react";
export default function Stepper({total,current}:{total:number; current:number}) {
  return (
    <HStack spacing={2} mb={4}>
      {Array.from({length: total}).map((_,i)=>(
        <Box key={i} h="8px" flex="1" borderRadius="full"
          bg={i<=current? "brand.500":"whiteAlpha.300"} />
      ))}
    </HStack>
  );
}
