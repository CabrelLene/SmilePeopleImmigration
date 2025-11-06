import { useForm } from "react-hook-form";
import { useAuth } from "../../store/auth";
import { Button, Card, CardBody, Heading, Input, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function Register(){
  const { register:reg, handleSubmit } = useForm();
  const { register:doRegister } = useAuth();
  const nav = useNavigate();
  return (
    <Card maxW="md" mx="auto"><CardBody>
      <VStack as="form" spacing={4}
        onSubmit={handleSubmit(async (v:any)=>{ await doRegister(v); nav("/dashboard"); })}>
        <Heading size="md">Créer un compte</Heading>
        <Input placeholder="Nom complet" {...reg("fullName")}/>
        <Input placeholder="Email" {...reg("email")}/>
        <Input placeholder="Mot de passe" type="password" {...reg("password")}/>
        <Button type="submit" colorScheme="purple" w="full">Créer</Button>
      </VStack>
    </CardBody></Card>
  );
}
