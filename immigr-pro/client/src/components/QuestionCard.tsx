import { Card, CardBody, Heading, Text, VStack, Button } from "@chakra-ui/react";
import Stepper from "./Stepper";

export default function QuestionCard({title, desc, children, onNext, step, total}:{title:string;desc?:string;children:any;onNext:()=>void;step:number;total:number}) {
  return (
    <Card>
      <CardBody>
        <Stepper total={total} current={step}/>
        <VStack align="stretch" spacing={4}>
          <Heading size="md">{title}</Heading>
          {desc && <Text opacity={0.8}>{desc}</Text>}
          <div>{children}</div>
          <Button alignSelf="flex-end" onClick={onNext} colorScheme="purple">Suivant</Button>
        </VStack>
      </CardBody>
    </Card>
  );
}
