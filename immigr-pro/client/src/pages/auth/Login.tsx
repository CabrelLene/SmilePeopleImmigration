import { useForm } from "react-hook-form";
import { useAuth } from "../../store/auth";
import { Button, Card, CardBody, Heading, Input, VStack } from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";

export default function Login(){
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const nav = useNavigate();
  return (
    <Card maxW="md" mx="auto"><CardBody>
      <VStack as="form" spacing={4}
        onSubmit={handleSubmit(async (v:any)=>{ await login(v.email, v.password); nav("/dashboard"); })}>
        <Heading size="md">Connexion</Heading>
        <Input placeholder="Email" {...register("email")}/>
        <Input placeholder="Mot de passe" type="password" {...register("password")}/>
        <Button type="submit" colorScheme="purple" w="full">Se connecter</Button>
        <Button as={Link} to="/register" variant="glass" w="full">Créer un compte</Button>
      </VStack>
    </CardBody></Card>
  );
}
