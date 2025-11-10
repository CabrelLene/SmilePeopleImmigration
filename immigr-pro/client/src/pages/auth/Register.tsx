// src/pages/auth/Register.tsx
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
  Progress,
  SimpleGrid,
  Text,
  VStack,
  useBreakpointValue,
  useToast
} from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { motion } from "framer-motion";

const MCard = motion(Card);

type FormVals = {
  fullName: string;
  email: string;
  password: string;
  confirm: string;
  accept: boolean;
};

export default function Register() {
  const { register: reg, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormVals>({
    defaultValues: { fullName: "", email: "", password: "", confirm: "", accept: false }
  });
  const { register: doRegister } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);

  const isMobile = useBreakpointValue({ base: true, md: false });
  const fullNameVal = watch("fullName");
  const emailVal = watch("email");
  const pwVal = watch("password");
  const confirmVal = watch("confirm");

  const strength = useMemo(() => scorePassword(pwVal || ""), [pwVal]);
  const pwMatch = pwVal && confirmVal && pwVal === confirmVal;

  const onSubmit = async (v: FormVals) => {
    if (!v.accept) {
      toast({ title: "Veuillez accepter les Conditions", status: "warning" });
      return;
    }
    if (v.password !== v.confirm) {
      toast({ title: "Les mots de passe ne correspondent pas", status: "error" });
      return;
    }
    try {
      // ✅ Appel corrigé : register(fullName, email, password)
      await doRegister(v.fullName, v.email, v.password);
      nav("/dashboard");
    } catch (e: any) {
      toast({
        title: "Inscription impossible",
        description: e?.message?.replace(/"/g, "") || "Réessayez dans un instant.",
        status: "error",
        duration: 4000,
        isClosable: true
      });
    }
  };

  return (
    <SimpleGrid columns={{ base: 1, lg: 12 }} gap={{ base: 6, lg: 10 }} alignItems="stretch">
      {/* Panneau gauche - message & illustration */}
      <Box
        as={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        gridColumn={{ base: "1 / -1", lg: "1 / 7" }}
        display="flex"
        alignItems="center"
      >
        <Box
          w="full"
          p={{ base: 2, md: 6, xl: 10 }}
          borderRadius="2xl"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          backdropFilter="blur(10px)"
        >
          <VStack align="flex-start" spacing={5}>
            <Avatar size="lg" name="ImmigrPro" />
            <Heading
              size={isMobile ? "xl" : "2xl"}
              lineHeight="1.1"
              bgGradient="linear(to-r, brand.400, purple.300)"
              bgClip="text"
            >
              Créez votre compte
            </Heading>
            <Text fontSize={{ base: "md", md: "lg" }} opacity={0.9} maxW="3xl">
              Un espace unique pour <b>vos informations</b>, <b>vos documents</b> et le suivi de votre <b>procédure</b>.
              Notre interface élégante vous accompagne à chaque étape.
            </Text>
            <HStack spacing={3} flexWrap="wrap">
              <TagPill>UI glassmorphism</TagPill>
              <TagPill>PWA installable</TagPill>
              <TagPill>Chiffrement</TagPill>
              <TagPill>Responsive</TagPill>
            </HStack>
          </VStack>
        </Box>
      </Box>

      {/* Panneau droit - Formulaire premium */}
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
          {/* Cadre dégradé premium */}
          <Box p="2px" borderRadius="2xl"
               bgGradient="conic-gradient(from 120deg, rgba(145,94,254,0.6), rgba(46,187,255,0.4), rgba(145,94,254,0.6))">
            <CardBody
              borderRadius="2xl"
              bg="rgba(17,16,30,0.7)"
              border="1px solid"
              borderColor="whiteAlpha.200"
              backdropFilter="blur(12px)"
              p={{ base: 6, md: 8 }}
            >
              <VStack as="form" spacing={5} align="stretch" onSubmit={handleSubmit(onSubmit)}>
                <Heading size="lg" textAlign="center" mb={2}>Créer un compte</Heading>

                {/* Nom complet */}
                <FloatingField
                  id="fullName"
                  label="Nom complet"
                  isActive={!!fullNameVal}
                  error={errors.fullName?.message}
                >
                  <Input
                    id="fullName"
                    placeholder=" "
                    {...reg("fullName", { required: "Le nom est requis" })}
                    isInvalid={!!errors.fullName}
                  />
                </FloatingField>

                {/* Email */}
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
                    {...reg("email", { required: "L’email est requis" })}
                    isInvalid={!!errors.email}
                  />
                </FloatingField>

                {/* Mot de passe */}
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
                      {...reg("password", {
                        required: "Le mot de passe est requis",
                        minLength: { value: 8, message: "Au moins 8 caractères" }
                      })}
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

                {/* Jauge de robustesse */}
                <Box>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="sm" opacity={0.85}>Robustesse du mot de passe</Text>
                    <Text fontSize="xs" opacity={0.7}>{strength.label}</Text>
                  </HStack>
                  <Progress
                    value={strength.value}
                    size="sm"
                    borderRadius="full"
                    colorScheme={strength.color}
                    bg="whiteAlpha.200"
                  />
                </Box>

                {/* Confirmation */}
                <FloatingField
                  id="confirm"
                  label="Confirmer le mot de passe"
                  isActive={!!confirmVal}
                  error={
                    errors.confirm?.message ||
                    (pwVal && confirmVal && !pwMatch ? "Les mots de passe ne correspondent pas" : undefined)
                  }
                >
                  <InputGroup>
                    <Input
                      id="confirm"
                      placeholder=" "
                      type={showPw2 ? "text" : "password"}
                      {...reg("confirm", { required: "La confirmation est requise" })}
                      isInvalid={!!errors.confirm || (pwVal && confirmVal && !pwMatch)}
                    />
                    <InputRightElement>
                      <IconButton
                        aria-label={showPw2 ? "Masquer" : "Afficher"}
                        variant="soft"
                        size="sm"
                        icon={showPw2 ? <ViewOffIcon/> : <ViewIcon/>}
                        onClick={() => setShowPw2(v => !v)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FloatingField>

                {/* Conditions + lien login */}
                <HStack justify="space-between" align="center">
                  <Checkbox {...reg("accept")}>J’accepte les <ChakraLink as={Link} to="/terms" textDecoration="underline">Conditions</ChakraLink></Checkbox>
                  <Text fontSize="sm" opacity={0.85}>
                    Déjà un compte ? <ChakraLink as={Link} to="/login" textDecoration="underline">Se connecter</ChakraLink>
                  </Text>
                </HStack>

                {/* CTA */}
                <Button
                  type="submit"
                  variant="neon"
                  w="full"
                  h="52px"
                  fontSize="md"
                  isLoading={isSubmitting}
                  loadingText="Création…"
                  as={motion.button}
                  whileTap={{ scale: 0.98 }}
                >
                  Créer mon compte
                </Button>

                {/* Divider “ou” */}
                <HStack w="full" opacity={0.85}>
                  <Divider />
                  <Text fontSize="sm">ou</Text>
                  <Divider />
                </HStack>

                {/* SSO placeholders */}
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

                <Text fontSize="xs" opacity={0.6} textAlign="center">
                  En créant un compte, vous acceptez nos Conditions d’utilisation et notre Politique de confidentialité.
                </Text>
              </VStack>
            </CardBody>
          </Box>
        </MCard>
      </Box>
    </SimpleGrid>
  );
}

/* ---------- Petits composants & helpers UI réutilisables ---------- */

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

      <Box p="1px" borderRadius="xl"
           bgGradient="linear(to-r, rgba(145,94,254,0.35), rgba(46,187,255,0.25))">
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

// Score simple du mot de passe (longueur + diversité)
function scorePassword(pw: string) {
  let score = 0;
  if (!pw) return { value: 0, label: "Très faible", color: "red" as const };
  const length = pw.length;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasNum = /\d/.test(pw);
  const hasSym = /[^A-Za-z0-9]/.test(pw);

  score += Math.min(length, 12) * 6; // 72 max
  score += (hasLower ? 6 : 0) + (hasUpper ? 6 : 0) + (hasNum ? 6 : 0) + (hasSym ? 10 : 0);

  const value = Math.min(100, score);
  let label: string = "Très faible";
  let color: "red" | "orange" | "yellow" | "green" = "red";

  if (value >= 75) { label = "Fort"; color = "green"; }
  else if (value >= 55) { label = "Moyen"; color = "yellow"; }
  else if (value >= 35) { label = "Faible"; color = "orange"; }

  return { value, label, color };
}
