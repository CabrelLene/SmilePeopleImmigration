import { Box, Container, Flex, Heading, HStack, Spacer, Button, Avatar } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Shell({children}:{children:React.ReactNode}) {
  const {user, logout} = useAuth();
  const nav = useNavigate();
  return (
    <Box minH="100dvh">
      <Container maxW="container.xl" py={4}>
        <Flex align="center" bg="whiteAlpha.100" p={3} borderRadius="14px" border="1px solid" borderColor="whiteAlpha.200">
          <Heading size="md" as={Link} to="/">ImmigrPro</Heading>
          <HStack spacing={6} ml={8}>
            <Link to="/questionnaire">Questionnaire</Link>
            <Link to="/dashboard">Espace</Link>
          </HStack>
          <Spacer/>
          {user ? (
            <HStack>
              <Avatar size="sm" name={user.fullName}/>
              <Button variant="glass" onClick={()=>{logout(); nav("/");}}>Déconnexion</Button>
            </HStack>
          ) : (
            <HStack>
              <Button as={Link} to="/login" variant="glass">Connexion</Button>
              <Button as={Link} to="/register" colorScheme="purple">Créer un compte</Button>
            </HStack>
          )}
        </Flex>
        <Box mt={6}>{children}</Box>
      </Container>
    </Box>
  );
}
