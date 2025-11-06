import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  HStack,
  Spacer
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // init state on first paint
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <Box minH="100dvh" position="relative">
      {/* Topbar glass */}
      <Box
        position="sticky"
        top={0}
        zIndex={10}
        bg={scrolled ? "rgba(16,14,28,0.55)" : "transparent"}
        style={{ backdropFilter: scrolled ? "blur(10px)" : "none" }}
        borderBottom={scrolled ? "1px solid" : "none"}
        borderColor="whiteAlpha.200"
        transition="background 200ms ease, border-color 200ms ease"
      >
        <Container maxW="container.xl" py={3}>
          <Flex align="center" gap={3}>
            <Heading
              size="md"
              as={Link}
              to="/"
              bgGradient="linear(to-r, brand.400, purple.300)"
              bgClip="text"
            >
              ImmigrPro
            </Heading>

            <HStack spacing={6} ml={8}>
              <Button as={Link} to="/questionnaire" variant="soft" size="sm">
                Questionnaire
              </Button>
              <Button as={Link} to="/dashboard" variant="soft" size="sm">
                Espace
              </Button>
            </HStack>

            <Spacer />

            {user ? (
              <HStack>
                <Avatar size="sm" name={user.fullName} />
                <Button
                  variant="soft"
                  size="sm"
                  onClick={() => {
                    logout();
                    nav("/");
                  }}
                >
                  Déconnexion
                </Button>
              </HStack>
            ) : (
              <HStack>
                <Button as={Link} to="/login" variant="soft" size="sm">
                  Connexion
                </Button>
                <Button as={Link} to="/register" variant="neon" size="sm">
                  Créer un compte
                </Button>
              </HStack>
            )}
          </Flex>
        </Container>
      </Box>

      {/* Page container */}
      <Container maxW="container.xl" py={8} zIndex={1} position="relative">
        {children}
      </Container>
    </Box>
  );
}
