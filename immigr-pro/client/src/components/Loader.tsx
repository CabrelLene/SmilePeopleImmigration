import { Center, Spinner, Text, VStack, useBoolean } from "@chakra-ui/react";
import { useEffect } from "react";

export default function Loader({onDone}:{onDone:()=>void}) {
  const [show, setShow] = useBoolean(true);
  useEffect(() => {
    const t = setTimeout(() => { setShow.off(); onDone(); }, 2000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <Center h="100dvh">
      <VStack spacing={4}>
        <Spinner size="xl" thickness="4px" />
        <Text fontSize="xl" opacity={0.8}>Analyse des programmes disponibles…</Text>
      </VStack>
    </Center>
  );
}
