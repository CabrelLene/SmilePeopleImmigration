// src/pages/Landing.tsx
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  Container,
  Divider,
  GridItem,
  Heading,
  HStack,
  Icon,
  SimpleGrid,
  Stack,
  Text,
  VStack
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircleIcon,
  ChatIcon,
  LockIcon,
  StarIcon,
  TimeIcon
} from "@chakra-ui/icons";

const MBox = motion(Box);
const MCard = motion(Card);

// Variants d’animation
const fadeUp = { initial: { opacity: 0, y: 12 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-80px" }, transition: { duration: 0.35 } };
const fadeStagger = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function Landing() {
  return (
    <Container maxW="container.xl" py={{ base: 8, md: 12 }}>
      {/* HERO */}
      <MBox {...fadeUp} textAlign="center" mb={{ base: 10, md: 14 }}>
        <Badge colorScheme="purple" variant="solid" borderRadius="full" px={4} py={1} mb={3}>
          Nouveau • Évaluation rapide & gratuite
        </Badge>
        <Heading size={{ base: "xl", md: "2xl" }} lineHeight="1.1">
          Votre <Box as="span" bgGradient="linear(to-r, brand.400, purple.300)" bgClip="text">parcours d’immigration</Box> au Canada,
          <br /> simplifié, clair et accompagné.
        </Heading>
        <Text opacity={0.9} mt={4} fontSize={{ base: "md", md: "lg" }}>
          Un questionnaire intelligent ➜ une recommandation de programme ➜ un budget estimé ➜ un accompagnement professionnel.
        </Text>
        <HStack justify="center" spacing={3} mt={6} flexWrap="wrap">
          <Button as={Link} to="/questionnaire" variant="neon" size="lg">Évaluer mon profil</Button>
          <Button as={Link} to="/register" variant="soft" size="lg">Créer un compte</Button>
        </HStack>
        <HStack justify="center" spacing={3} mt={5} opacity={0.8} flexWrap="wrap">
          <MiniPill>Installable PWA</MiniPill>
          <MiniPill>Algorithme de recommandation</MiniPill>
          <MiniPill>Plateforme sécurisée</MiniPill>
        </HStack>
      </MBox>

      {/* METRICS */}
      <MBox {...fadeUp} mb={{ base: 12, md: 16 }}>
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
          <Metric number="300+" label="Dossiers accompagnés" />
          <Metric number="97%" label="Satisfaction" />
          <Metric number="24h" label="Première prise de contact" />
          <Metric number="10+" label="Voies d’immigration couvertes" />
        </SimpleGrid>
      </MBox>

      {/* SERVICES */}
      <MBox {...fadeUp} mb={{ base: 12, md: 16 }}>
        <SectionHeader
          title="Nos services"
          subtitle="De l’évaluation à l’obtention, on vous guide étape par étape."
        />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} gap={5} mt={6} as={motion.div} variants={fadeStagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <ServiceCard icon={CheckCircleIcon} title="Évaluation intelligente"
            desc="Un diagnostic basé sur les points officiels pour orienter votre stratégie." />
          <ServiceCard icon={ChatIcon} title="Accompagnement humain"
            desc="Un conseiller suit votre dossier, répond à vos questions et vous relance si besoin." />
          <ServiceCard icon={TimeIcon} title="Suivi en temps réel"
            desc="Timeline de votre dossier, étapes, notifications et délais estimés." />
          <ServiceCard icon={LockIcon} title="Sécurité & confidentialité"
            desc="Données chiffrées, documents stockés en toute sécurité." />
        </SimpleGrid>
      </MBox>

      {/* PROGRAMMES */}
      <MBox {...fadeUp} mb={{ base: 12, md: 16 }}>
        <SectionHeader
          title="Programmes d’immigration"
          subtitle="Nous couvrons les voies principales, fédérales et provinciales."
        />
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={5} mt={6} as={motion.div} variants={fadeStagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <ProgramCard title="Entrée Express" points={["Travailleurs qualifiés", "Calcul CRS", "Voies fédérales"]} />
          <ProgramCard title="PNP (Provinces)" points={["Nominations provinciales", "Volet offre d’emploi", "Stratégie par province"]} />
          <ProgramCard title="Étudiants internationaux" points={["CAQ/Lettre acceptation", "Permis d’études", "Passerelles vers RP"]} />
          <ProgramCard title="Travailleurs temporaires" points={["EIMT/Dispenses", "Permis de travail", "Mobilité internationale"]} />
          <ProgramCard title="Parrainage familial" points={["Conjoint/Conjointe", "Parents/Grands-parents", "Engagement financier"]} />
          <ProgramCard title="Résidence permanente" points={["Fédéral & Québec", "Arrima / MonCIC", "Dépôt et suivi dossier"]} />
        </SimpleGrid>
      </MBox>

      {/* TÉMOIGNAGES */}
      <MBox {...fadeUp} mb={{ base: 12, md: 16 }}>
        <SectionHeader
          title="Ils nous font confiance"
          subtitle="De vrais parcours, des résultats concrets."
        />
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={5} mt={6}>
          <Testimonial
            name="Fatou, Montréal"
            text="J’ai obtenu ma RP en 9 mois. L’équipe m’a aidée à choisir la bonne voie et à préparer un dossier solide."
          />
          <Testimonial
            name="Yacine, Québec"
            text="Processus clair et rassurant. Mes documents étaient vérifiés en 24h, et j’ai reçu des conseils précis."
          />
          <Testimonial
            name="Sofia, Toronto"
            text="Le questionnaire m’a proposé PNP Ontario. Tout a été rapide et transparent jusqu’à l’obtention."
          />
        </SimpleGrid>
      </MBox>

      {/* COMMENT ÇA MARCHE */}
      <MBox {...fadeUp} mb={{ base: 12, md: 16 }}>
        <SectionHeader
          title="Comment ça marche ?"
          subtitle="Une progression simple, sans zones d’ombre."
        />
        <SimpleGrid columns={{ base: 1, md: 5 }} gap={5} mt={6}>
          <Step number="1" title="Évaluer votre profil" />
          <Step number="2" title="Recevoir une recommandation" />
          <Step number="3" title="Créer votre compte sécurisé" />
          <Step number="4" title="Déposer vos documents" />
          <Step number="5" title="Être accompagné jusqu’au résultat" />
        </SimpleGrid>
      </MBox>

      {/* CTA FINAL */}
      <MCard
        initial={{ opacity: 0, y: 10, scale: 0.99 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.35 }}
      >
        <CardBody
          as={Stack}
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align="center"
          gap={6}
        >
          <Box>
            <Heading size="lg" mb={2}>Prêt à commencer votre aventure canadienne ?</Heading>
            <Text opacity={0.9}>
              Lancez le questionnaire, obtenez une recommandation et un budget estimé. On s’occupe du reste.
            </Text>
          </Box>
          <HStack>
            <Button as={Link} to="/questionnaire" variant="neon" size="lg">Évaluer mon admissibilité</Button>
            <Button as={Link} to="/register" variant="soft" size="lg">Créer un compte</Button>
          </HStack>
        </CardBody>
      </MCard>

      <Divider my={{ base: 10, md: 14 }} opacity={0.2} />

      {/* MINI FOOTER */}
      <VStack spacing={2} opacity={0.7} fontSize="sm">
        <HStack spacing={3}>
          <Icon as={StarIcon} />
          <Text>Interface moderne, sécurisée et responsive</Text>
        </HStack>
        <Text>© {new Date().getFullYear()} ImmigrPro — Tous droits réservés.</Text>
      </VStack>
    </Container>
  );
}

/* ========================= Composants locaux ========================= */

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <VStack spacing={2} align="start">
      <Heading size="lg">{title}</Heading>
      {subtitle && <Text opacity={0.85}>{subtitle}</Text>}
    </VStack>
  );
}

function MiniPill({ children }: { children: React.ReactNode }) {
  return (
    <Box
      px={3}
      py={1}
      borderRadius="full"
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      backdropFilter="blur(6px)"
      fontSize="sm"
    >
      {children}
    </Box>
  );
}

function Metric({ number, label }: { number: string; label: string }) {
  return (
    <Card>
      <CardBody textAlign="center">
        <Heading size="lg">{number}</Heading>
        <Text opacity={0.8}>{label}</Text>
      </CardBody>
    </Card>
  );
}

function ServiceCard({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <MCard variants={item} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
      <CardBody>
        <HStack align="start" spacing={4}>
          <Box
            p={2.5}
            borderRadius="lg"
            bg="whiteAlpha.100"
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Icon as={icon} boxSize={5} />
          </Box>
          <VStack align="start" spacing={1}>
            <Heading size="sm">{title}</Heading>
            <Text opacity={0.85}>{desc}</Text>
          </VStack>
        </HStack>
      </CardBody>
    </MCard>
  );
}

function ProgramCard({ title, points }: { title: string; points: string[] }) {
  return (
    <MCard whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
      <CardBody>
        <VStack align="start" spacing={3}>
          <Heading size="md">{title}</Heading>
          <VStack align="start" spacing={1} fontSize="sm" opacity={0.85}>
            {points.map((p, i) => (
              <HStack key={i} spacing={2}>
                <Icon as={CheckCircleIcon} />
                <Text>{p}</Text>
              </HStack>
            ))}
          </VStack>
          <Button as={Link} to="/questionnaire" variant="soft" mt={2}>Voir mon admissibilité</Button>
        </VStack>
      </CardBody>
    </MCard>
  );
}

function Testimonial({ name, text }: { name: string; text: string }) {
  return (
    <MCard whileHover={{ scale: 1.01 }}>
      <CardBody>
        <HStack spacing={3} mb={3}>
          <Avatar name={name} size="sm" />
          <VStack align="start" spacing={0}>
            <Text fontWeight={600}>{name}</Text>
            <Text fontSize="sm" opacity={0.7}>Dossier validé</Text>
          </VStack>
        </HStack>
        <Text opacity={0.95}>"{text}"</Text>
      </CardBody>
    </MCard>
  );
}

function Step({ number, title }: { number: string; title: string }) {
  return (
    <GridItem>
      <HStack align="start" spacing={4}>
        <Box
          minW="36px"
          h="36px"
          borderRadius="full"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
          display="grid"
          placeItems="center"
          fontWeight={700}
        >
          {number}
        </Box>
        <VStack align="start" spacing={1}>
          <Heading size="sm">{title}</Heading>
          <Text opacity={0.75} fontSize="sm">Expérience fluide, guidée et sécurisée.</Text>
        </VStack>
      </HStack>
    </GridItem>
  );
}
