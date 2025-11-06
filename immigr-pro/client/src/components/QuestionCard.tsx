import { Card, CardBody, Heading, Text, VStack, HStack, Button } from "@chakra-ui/react";
import { motion } from "framer-motion";
import Stepper from "./Stepper";

const MotionCard = motion(Card);
const MotionButton = motion(Button);

type Props = {
  title: string;
  desc?: string;
  children: React.ReactNode;
  onNext: () => void | Promise<void>;
  onBack?: () => void;
  step: number;
  total: number;
};

export default function QuestionCard({ title, desc, children, onNext, onBack, step, total }: Props) {
  return (
    <MotionCard
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
    >
      <CardBody>
        {/* La Stepper est ce qui spring quand step change (cf. Stepper.tsx) */}
        <Stepper total={total} current={step} />

        <VStack align="stretch" spacing={4} mt={2}>
          <Heading size="md">{title}</Heading>
          {desc && <Text opacity={0.85}>{desc}</Text>}

          <div>{children}</div>

          <HStack justify="space-between" pt={2}>
            <Button
              onClick={onBack}
              variant="soft"
              isDisabled={!onBack}
              visibility={onBack ? "visible" : "hidden"}
            >
              Précédent
            </Button>

            {/* Micro-bounce sur le clic + halo glow (neon) */}
            <MotionButton
              onClick={onNext}
              variant="neon"
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              Suivant
            </MotionButton>
          </HStack>
        </VStack>
      </CardBody>
    </MotionCard>
  );
}
