// src/pages/auth/Login.tsx
import { useForm } from "react-hook-form";
import { useAuth } from "../../store/auth";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link as ChakraLink,
  SimpleGrid,
  Text,
  VStack,
  useBreakpointValue,
  useToast
} from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MCard = motion(Card);

type FormVals = {
  email: string;
  password: string;
  remember?: boolean;
};

export default function Login() {
  const { register, handleSubmit, formState: { errors, isSubmitting }, watch } = useForm<FormVals>();
  const { login } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [showPw, setShowPw] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const emailVal = watch("email");
  const pwVal = watch("password");

  const onSubmit = async (v: FormVals) => {
    try {
      const usr = await login(v.email, v.password, v.remember);
      const role = (usr.role || "user").toLowerCase();
      nav(role === "admin" ? "/admin" : "/dashboard");
    } catch (e: any) {
      toast({
        title: "Échec de la connexion",
        description: e?.message?.replace(/"/g, "") || "Vérifiez vos identifiants.",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <SimpleGrid
      columns={{ base: 1, lg: 12 }}
      gap={{ base: 6, lg: 10 }}
      alignItems="stretch"
    >
      {/* Panneau gauche - message & illustration */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ gridColumn: '1 / -1' }}
      >
        <Box
          w="full"
          p={{ base: 2, md: 6, xl: 10 }}
          borderRadius="2xl"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="blur(10px)"
          gridColumn={{ base: "1 / -1", lg: "1 / 7" }}
          display="flex"
          alignItems="center"
        >
          <Box w="full">
            <VStack align="flex-start" spacing={5}>
              <Avatar size="lg" name="ImmigrPro" />
              <Heading
                size={isMobile ? "xl" : "2xl"}
                lineHeight="1.1"
                bgGradient="linear(to-r, brand.400, purple.300)"
                bgClip="text"
              >
                Smile Immigration
              </Heading>
              <Text fontSize={{ base: "md", md: "lg" }} opacity={0.9} maxW="3xl">
                Accédez à votre espace sécurisé pour <b>déposer vos documents</b>, suivre votre <b>dossier</b> en temps réel,
                et bénéficier d’un accompagnement <b>professionnel</b> pas à pas.
              </Text>
              <HStack spacing={3} flexWrap="wrap">
                <TagPill>UI glassmorphism</TagPill>
                <TagPill>Installable PWA</TagPill>
                <TagPill>Sécurisé</TagPill>
                <TagPill>Responsive</TagPill>
              </HStack>
            </VStack>
          </Box>
        </Box>
      </motion.div>

      {/* Panneau droit - Formulaire */}
      <Box gridColumn={{ base: "1 / -1", lg: "7 / -1" }} display="flex" alignItems="center">
        <MCard
          maxW="lg"
          mx="auto"
          w="full"
          bg="transparent"
          initial={{ opacity: 0, y: 8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25 } as any}
        >
          {/* Gradient frame */}
          <Box
            p="2px"
            borderRadius="2xl"
            bgGradient="conic-gradient(from 120deg, rgba(145,94,254,0.6), rgba(46,187,255,0.4), rgba(145,94,254,0.6))"
          >
            <CardBody
              borderRadius="2xl"
              bg="rgba(17,16,30,0.7)"
              border="1px solid"
              borderColor="whiteAlpha.200"
              backdropFilter="blur(12px)"
              p={{ base: 6, md: 8 }}
            >
              <VStack
                as="form"
                spacing={5}
                onSubmit={handleSubmit(onSubmit)}
                align="stretch"
              >
                <Heading size="lg" textAlign="center" mb={2}>
                  Connexion
                </Heading>

                {/* Email - label flottant */}
                <FloatingField
                  id="email"
                  label="Email"
                  isActive={!!emailVal}
                  error={errors.email?.message}
                >
                  <Input
                    id="email"
                    type="email"
                    placeholder=" "
                    {...register("email", { required: "L’email est requis" })}
                    isInvalid={!!errors.email}
                  />
                </FloatingField>

                {/* Password - label flottant + toggle */}
                <FloatingField
                  id="password"
                  label="Mot de passe"
                  isActive={!!pwVal}
                  error={errors.password?.message}
                >
                  <InputGroup>
                    <Input
                      id="password"
                      placeholder=" "
                      type={showPw ? "text" : "password"}
                      {...register("password", { required: "Le mot de passe est requis" })}
                      isInvalid={!!errors.password}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPw ? "Masquer" : "Afficher"}
                        variant="soft"
                        size="sm"
                        icon={showPw ? <ViewOffIcon/> : <ViewIcon/>}
                        onClick={() => setShowPw(v => !v)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FloatingField>

                <HStack justify="space-between" align="center">
                  <Checkbox {...register("remember")}>Se souvenir de moi</Checkbox>
                  <ChakraLink as={Link} to="/reset" opacity={0.9} _hover={{ opacity: 1, textDecoration: "underline" }}>
                    Mot de passe oublié ?
                  </ChakraLink>
                </HStack>

                {/* CTA principal */}
                <Button
                  type="submit"
                  variant="neon"
                  w="full"
                  h="52px"
                  fontSize="md"
                  isLoading={isSubmitting}
                  loadingText="Connexion…"
                  whileTap={{ scale: 0.98 }}
                  as={motion.button}
                >
                  Se connecter
                </Button>

                {/* Divider “ou” */}
                <HStack w="full" opacity={0.85}>
                  <Divider />
                  <Text fontSize="sm">ou</Text>
                  <Divider />
                </HStack>

                {/* SSO (placeholders) */}
                <HStack w="full" spacing={3}>
                  <Button
                    w="full"
                    variant="soft"
                    onClick={() => toast({ title: "Google SSO bientôt disponible", status: "info" })}
                  >
                    Continuer avec Google
                  </Button>
                  <Button
                    w="full"
                    variant="soft"
                    onClick={() => toast({ title: "Microsoft SSO bientôt disponible", status: "info" })}
                  >
                    Continuer avec Microsoft
                  </Button>
                </HStack>

                {/* Lien register */}
                <Text fontSize="sm" opacity={0.8} textAlign="center">
                  Nouveau ici ?{" "}
                  <ChakraLink as={Link} to="/register" textDecoration="underline">
                    Créer un compte
                  </ChakraLink>
                </Text>

                <Text fontSize="xs" opacity={0.6} textAlign="center">
                  En vous connectant, vous acceptez nos Conditions d’utilisation et notre Politique de confidentialité.
                </Text>
              </VStack>
            </CardBody>
          </Box>
        </MCard>
      </Box>
    </SimpleGrid>
  );
}

/* ---------- Petits composants UI réutilisables ---------- */

// Pastilles stylées
function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <Box
      px={3}
      py={1}
      borderRadius="full"
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      fontSize="sm"
      backdropFilter="blur(6px)"
    >
      {children}
    </Box>
  );
}

// Champ avec label flottant (placeholder = " ")
function FloatingField({
  id,
  label,
  isActive,
  error,
  children
}: {
  id: string;
  label: string;
  isActive: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <FormControl id={id} position="relative">
      <FormLabel
        position="absolute"
        left={3}
        top={isActive ? "-2" : "3"}
        px={2}
        zIndex={1}
        fontSize={isActive ? "xs" : "sm"}
        bg="rgba(17,16,30,0.85)"
        borderRadius="md"
        color={isActive ? "brand.300" : "whiteAlpha.800"}
        transition="all 160ms ease"
        pointerEvents="none"
        border="1px solid"
        borderColor={isActive ? "whiteAlpha.300" : "transparent"}
      >
        {label}
      </FormLabel>

      <Box
        p="1px"
        borderRadius="xl"
        bgGradient="linear(to-r, rgba(145,94,254,0.35), rgba(46,187,255,0.25))"
      >
        <Box
          borderRadius="xl"
          bg="rgba(17,16,30,0.75)"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="blur(8px)"
        >
          {children}
        </Box>
      </Box>

      {error && (
        <Text color="red.300" fontSize="sm" mt={2}>
          {error}
        </Text>
      )}
    </FormControl>
  );
}
