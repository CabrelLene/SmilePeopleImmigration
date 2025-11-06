import { Box, keyframes } from "@chakra-ui/react";

const float = keyframes`
  0% { transform: translateY(0px) }
  50% { transform: translateY(-16px) }
  100% { transform: translateY(0px) }
`;
const drift = keyframes`
  0% { transform: rotate(0deg) scale(1) }
  50% { transform: rotate(10deg) scale(1.06) }
  100% { transform: rotate(0deg) scale(1) }
`;

export default function AuroraBackground() {
  return (
    <Box
      position="fixed"
      inset={0}
      zIndex={0}
      _before={{
        content: '""',
        position: "absolute",
        inset: "-20%",
        background:
          "radial-gradient(40% 30% at 20% 20%, rgba(145,94,254,0.35) 0%, rgba(145,94,254,0) 60%)," +
          "radial-gradient(35% 30% at 80% 10%, rgba(122,61,250,0.35) 0%, rgba(122,61,250,0) 60%)," +
          "radial-gradient(30% 25% at 50% 80%, rgba(46,187,255,0.28) 0%, rgba(46,187,255,0) 60%)",
        filter: "blur(40px) saturate(140%)",
        animation: `${drift} 18s ease-in-out infinite`
      }}
      _after={{
        content: '""',
        position: "absolute",
        left: "10%",
        top: "65%",
        width: "580px",
        height: "580px",
        background: "radial-gradient(50% 50% at 50% 50%, rgba(255,255,255,0.06), rgba(255,255,255,0))",
        filter: "blur(20px)",
        animation: `${float} 8s ease-in-out infinite`
      }}
      pointerEvents="none"
    />
  );
}
