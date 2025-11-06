import { useRef } from "react";
import { Box, Text } from "@chakra-ui/react";

export default function FileDrop({onFile}:{onFile:(f:File)=>void}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Box p={6} border="2px dashed" borderColor="whiteAlpha.300" borderRadius="16px"
      onClick={()=>ref.current?.click()} textAlign="center" cursor="pointer">
      <Text>Déposer un fichier ici, ou cliquer pour sélectionner</Text>
      <input ref={ref} type="file" hidden onChange={e=>{
        const f = e.target.files?.[0]; if (f) onFile(f);
      }}/>
    </Box>
  );
}
