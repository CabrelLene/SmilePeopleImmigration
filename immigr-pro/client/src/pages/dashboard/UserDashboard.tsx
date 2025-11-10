// src/pages/dashboard/UserDashboard.tsx
import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  CircularProgress,
  CircularProgressLabel,
  Container,
  Divider,
  HStack,
  Heading,
  Icon,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftElement,
  Kbd,
  Link as ChakraLink,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  VStack,
  useDisclosure,
  useToast,
  Select,
  Alert,
  AlertIcon,
  Tooltip as ChakraTooltip,
  useColorModeValue,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import type { BoxProps } from "@chakra-ui/react";
import {
  ArrowForwardIcon,
  AttachmentIcon,
  CheckCircleIcon,
  DownloadIcon,
  EmailIcon,
  ExternalLinkIcon,
  InfoOutlineIcon,
  SearchIcon,
  TimeIcon,
  WarningTwoIcon,
  ViewIcon,
  RepeatIcon,
  CloseIcon,
  EditIcon,
} from "@chakra-ui/icons";
import { motion } from "framer-motion";
import FileDrop from "../../components/FileDrop";
import { api } from "../../api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/auth";

// Recharts
import {
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
} from "recharts";

/* ======= pdfjs (imports top-level + worker Vite) ======= */
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;


/* -------------------- Helpers URL absolue (fix preview en dev) -------------------- */
const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_ORIGIN = (() => {
  try {
    return new URL(RAW_BASE).origin;
  } catch {
    return "http://localhost:4000";
  }
})();
function toAbsoluteUrl(u?: string) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_ORIGIN}${u.startsWith("/") ? u : `/${u}`}`;
}
/* ------------------------------------------------------------------------------- */

const MCard = motion(Card);

type DocItem = {
  _id: string; // id serveur (filename)
  name: string;
  url: string; // peut être relatif -> toAbsoluteUrl
  size: number;
  mimeType?: string;
  tag?: string;
};

const glassBg = (alpha = 0.1) => `rgba(255,255,255,${alpha})`;
const borderAlpha = 0.22;

// ⚠️ Fix typings Chakra x Framer : on cast ces props en any au moment de les spread
const liftProps: any = {
  whileHover: { y: -4, scale: 1.01 },
  transition: { type: "spring", stiffness: 240, damping: 18 },
};
const appear = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25 },
};

export default function UserDashboard() {
  const { user: authUser, setUser: setAuthUser } = useAuth() as any;
  const [user, setUser] = React.useState<any>(authUser || null);

  const [docs, setDocs] = React.useState<DocItem[]>([]);
  const [filter, setFilter] = React.useState<string>("all");
  const [q, setQ] = React.useState("");
  const [focusCard, setFocusCard] = React.useState<string | null>(null);

  const [stats, setStats] = React.useState({
    progress: 64,
    docCount: 0,
    score: 0,
    budget: 0,
    status: "En revue",
  });
  const [reco, setReco] = React.useState<{
    program: string;
    score: number;
    budget: number;
    recommendations: Array<{ label: string; score?: number }>;
  } | null>(null);

  const toast = useToast();
  const nav = useNavigate();
  const contactDisc = useDisclosure();

  // Modal aperçu doc
  const preview = useDisclosure();
  const [previewDoc, setPreviewDoc] = React.useState<DocItem | null>(null);
  const onPreview = (d: DocItem) => {
    setPreviewDoc({ ...d, url: toAbsoluteUrl(d.url) });
    preview.onOpen();
  };

  // Modal édition profil
  const editProfile = useDisclosure();
  const [editName, setEditName] = React.useState<string>("");
  const [editPhotoFile, setEditPhotoFile] = React.useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = React.useState<string>("");

  // Suppression différée (undo)
  const pendingTimers = React.useRef<Record<string, number>>({});
  const lastRemovedRef = React.useRef<DocItem | null>(null);

  // Charger le profil (si store vide) + normaliser photo URL
  React.useEffect(() => {
    (async () => {
      try {
        if (!authUser) {
          const r = await api.me?.(); // { user }
          const u = r?.user || null;
          if (u?.photoUrl) u.photoUrl = toAbsoluteUrl(u.photoUrl);
          setUser(u);
          setAuthUser?.(u);
        } else {
          const u = { ...authUser };
          if (u?.photoUrl) u.photoUrl = toAbsoluteUrl(u.photoUrl);
          setUser(u);
        }
      } catch {
        // silencieux
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger évaluation
  React.useEffect(() => {
    (async () => {
      try {
        const r = await api.evaluate();
        setReco({
          program: r.program,
          score: r.score,
          budget: r.budget,
          recommendations: r.recommendations || [],
        });
        setStats((s) => ({ ...s, score: r.score, budget: r.budget }));
      } catch {
        // silencieux si pas dispo
      }
    })();
  }, []);

  React.useEffect(() => {
    setStats((s) => ({ ...s, docCount: docs.length }));
  }, [docs.length]);

  // Upload -> lit d.file.id et normalise l’URL
  const handleFile = async (f: File) => {
    try {
      const d = await api.upload(f); // { ok, file:{ id,url,name,size,mimeType } }
      const item: DocItem = {
        _id: d.file.id,
        name: d.file.name || f.name,
        url: toAbsoluteUrl(d.file.url || "#"),
        size: d.file.size || f.size,
        mimeType: d.file.mimeType || f.type,
        tag: guessDocTag(d.file.name || f.name),
      };
      setDocs((prev) => [item, ...prev]);
      toast({ title: "Document téléchargé", status: "success" });
    } catch (e: any) {
      toast({ title: "Échec du téléchargement", status: "error" });
    }
  };

  // Suppression avec UNDO
  const handleDelete = (id: string) => {
    const toRemove = docs.find((d) => d._id === id);
    if (!toRemove) return;
    lastRemovedRef.current = toRemove;

    setDocs((prev) => prev.filter((d) => d._id !== id));

    const toastId = toast({
      duration: 5000,
      position: "bottom",
      render: ({ onClose }) => (
        <HStack
          p={3}
          borderRadius="lg"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.300"
          spacing={3}
        >
          <Text>Document supprimé.</Text>
          <Button
            size="sm"
            variant="solid"
            colorScheme="purple"
            onClick={() => {
              const doc = lastRemovedRef.current;
              if (doc) setDocs((prev) => [doc, ...prev]);
              if (pendingTimers.current[id]) {
                clearTimeout(pendingTimers.current[id]);
                delete pendingTimers.current[id];
              }
              onClose();
            }}
          >
            Annuler
          </Button>
          <IconButton
            aria-label="Fermer"
            icon={<CloseIcon boxSize={2.5} />}
            size="sm"
            variant="ghost"
            onClick={onClose}
          />
        </HStack>
      ),
    });

    const t = window.setTimeout(async () => {
      try {
        await api.deleteFile?.(id);
      } catch (e: any) {
        const doc = lastRemovedRef.current;
        if (doc && doc._id === id) setDocs((prev) => [doc, ...prev]);
        toast({
          title: "Suppression impossible",
          description: e?.message || "",
          status: "error",
        });
      } finally {
        delete pendingTimers.current[id];
        if (toastId) toast.close(toastId);
      }
    }, 5000);

    pendingTimers.current[id] = t;
  };

  const filteredDocs = docs
    .filter((d) => (filter === "all" ? true : d.tag === filter))
    .filter((d) =>
      q.trim()
        ? d.name.toLowerCase().includes(q.toLowerCase()) ||
          (d.tag || "").toLowerCase().includes(q.toLowerCase())
        : true
    );

  // Charts (démo)
  const clampedScore = Math.max(0, Math.min(600, stats.score || 0));
  const crsRadialData = [{ name: "CRS", value: clampedScore, fill: "#7a3dfa" }];
  const budgetPieData = [
    {
      name: "Frais gouvernementaux",
      value: Math.round((stats.budget || 0) * 0.5),
    },
    { name: "Honoraires", value: Math.round((stats.budget || 0) * 0.35) },
    {
      name: "Tests/Évaluations",
      value: Math.round((stats.budget || 0) * 0.15),
    },
  ];
  const timelineLineData = [
    { step: "Profil", days: 2 },
    { step: "Docs", days: 7 },
    { step: "Soumission", days: 3 },
    { step: "Biom.", days: 2 },
    { step: "Décision", days: 30 },
  ];
  const PIE_COLORS = ["#7a3dfa", "#915efe", "#5e2fd0"];
  const overlayBg = useColorModeValue("rgba(6,6,20,0.35)", "rgba(0,0,0,0.45)");

  const displayName =
    user?.fullName || user?.name || user?.email || "Votre profil";
  const avatarSrc = toAbsoluteUrl(user?.photoUrl);
  const avatarFallback = (displayName || "?").trim();

  // --- Handlers édition profil ---
  const openEditProfile = () => {
    setEditName(user?.fullName || user?.name || "");
    setEditPhotoFile(null);
    setEditPhotoPreview(user?.photoUrl ? toAbsoluteUrl(user.photoUrl) : "");
    editProfile.onOpen();
  };

  const onPickPhoto = (file?: File | null) => {
    if (!file) return;
    setEditPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setEditPhotoPreview(String(e.target?.result || ""));
    reader.readAsDataURL(file);
  };

  const onSaveProfile = async () => {
    try {
      let photoUrl: string | undefined = user?.photoUrl;

      // 1) Upload photo si fichier choisi
      if (editPhotoFile) {
        const up = await api.upload(editPhotoFile);
        photoUrl = up?.file?.url ? toAbsoluteUrl(up.file.url) : photoUrl;
      }

      // 2) Patch profil si endpoint dispo, sinon fallback local
      const patchable =
        typeof api.updateProfile === "function" ||
        // @ts-ignore
        !!api["updateProfile"];
      if (patchable) {
        const payload: any = {};
        if (editName && editName !== user?.fullName) payload.fullName = editName;
        if (photoUrl && photoUrl !== user?.photoUrl) payload.photoUrl = photoUrl;
        const r = await api.updateProfile(payload); // { user }
        const newUser = { ...(r?.user || user) };
        if (newUser?.photoUrl) newUser.photoUrl = toAbsoluteUrl(newUser.photoUrl);
        setUser(newUser);
        setAuthUser?.(newUser);
      } else {
        // Fallback : mise à jour locale
        const newUser = {
          ...(user || {}),
          fullName: editName || user?.fullName,
          photoUrl: photoUrl || user?.photoUrl,
        };
        setUser(newUser);
        setAuthUser?.(newUser);
      }

      toast({ title: "Profil mis à jour", status: "success" });
      editProfile.onClose();
    } catch (e: any) {
      toast({
        title: "Échec de la mise à jour",
        description: e?.message || "",
        status: "error",
      });
    }
  };

  return (
    <Container maxW="container.xl" py={{ base: 6, md: 8 }} position="relative">
      {/* Overlay Focus mode */}
      {focusCard && (
        <Box
          position="fixed"
          inset={0}
          bg={overlayBg}
          zIndex={10}
          onClick={() => setFocusCard(null)}
          cursor="zoom-out"
          transition="background 0.2s ease"
        />
      )}

      {/* Sidebar flottante */}
      <SidebarFloating
        progress={stats.progress}
        onJump={(to) => {
          const el = document.getElementById(to);
          if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      {/* HEADER */}
      <MCard
        id="header"
        {...appear}
        {...liftProps}
        style={focusStyle(focusCard === "header")}
        onClick={() => setFocusCard(focusCard === "header" ? null : "header")}
        backdropFilter="blur(12px)"
        bg={glassBg(0.14)}
        border="1px solid"
        borderColor={`rgba(255,255,255,${borderAlpha})`}
        boxShadow="0 10px 40px rgba(0,0,0,0.25), inset 0 0 1px rgba(255,255,255,0.15)"
      >
        <CardBody>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack>
              <Avatar name={avatarFallback} src={avatarSrc || undefined} />
              <Box>
                <Heading size="md">Bonjour {displayName} 👋</Heading>
                <Text opacity={0.8}>
                  Poursuivez votre parcours — votre dossier avance.
                </Text>
                <Button
                  size="xs"
                  leftIcon={<EditIcon />}
                  variant="ghost"
                  mt={1}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditProfile();
                  }}
                >
                  Éditer mon profil
                </Button>
              </Box>
            </HStack>

            <HStack spacing={3}>
              <Button
                variant="glass"
                leftIcon={<ArrowForwardIcon />}
                onClick={() => nav("/questionnaire")}
              >
                Continuer
              </Button>
              <Button
                variant="glass"
                leftIcon={<AttachmentIcon />}
                onClick={() =>
                  document.getElementById("hidden-file-input")?.click()
                }
              >
                Importer document
              </Button>
              <input
                id="hidden-file-input"
                type="file"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button
                variant="neon"
                leftIcon={<EmailIcon />}
                onClick={contactDisc.onOpen}
              >
                Contacter
              </Button>
            </HStack>
          </HStack>
        </CardBody>
      </MCard>

      {/* STATS */}
      <SimpleGrid id="stats" columns={{ base: 1, md: 4 }} gap={4} mt={6}>
        <StatCard
          title="Statut dossier"
          value={stats.status}
          icon={InfoOutlineIcon}
          accent="brand.400"
          sub="MAJ auto"
        />
        <StatCard
          title="Score estimé"
          value={reco?.score ?? "—"}
          icon={CheckCircleIcon}
          accent="green.300"
          sub={reco ? "CRS approx." : "En attente"}
        />
        <StatCard
          title="Budget (est.)"
          value={reco?.budget != null ? `${reco.budget} $` : "—"}
          icon={TimeIcon}
          accent="orange.300"
          sub={reco?.program ?? "Calcul en cours"}
        />
        <MCard
          {...liftProps}
          style={focusStyle(focusCard === "progress")}
          onClick={() =>
            setFocusCard(focusCard === "progress" ? null : "progress")
          }
          backdropFilter="blur(8px)"
          bg={glassBg(0.14)}
          border="1px solid"
          borderColor={`rgba(255,255,255,${borderAlpha})`}
        >
          <CardBody>
            <HStack justify="space-between">
              <VStack align="start" spacing={0}>
                <Text opacity={0.8} fontSize="sm">
                  Progression
                </Text>
                <Heading size="md">{stats.progress}%</Heading>
              </VStack>
              <CircularProgress value={stats.progress} size="64px">
                <CircularProgressLabel>
                  {stats.progress}%
                </CircularProgressLabel>
              </CircularProgress>
            </HStack>
            <Text mt={2} opacity={0.7} fontSize="sm">
              Étapes complétées
            </Text>
          </CardBody>
        </MCard>
      </SimpleGrid>

      {/* 3 colonnes : DOCS (2) + INSIGHTS */}
      <SimpleGrid columns={{ base: 1, xl: 3 }} gap={6} mt={6}>
        {/* DOCUMENTS */}
        <MCard
          id="documents"
          {...liftProps}
          style={focusStyle(focusCard === "docs")}
          onClick={() => setFocusCard(focusCard === "docs" ? null : "docs")}
          backdropFilter="blur(12px)"
          bg={glassBg(0.12)}
          border="1px solid"
          borderColor={`rgba(255,255,255,${borderAlpha})`}
          gridColumn={{ base: "auto", xl: "span 2" }}
        >
          <CardHeader pb={0}>
            <HStack justify="space-between" align="center">
              <Heading size="md">Documents</Heading>
              <HStack>
                <Select
                  size="sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  w="160px"
                >
                  <option value="all">Tous</option>
                  <option value="Passeport">Passeport</option>
                  <option value="Diplôme">Diplôme</option>
                  <option value="Expérience">Expérience</option>
                  <option value="Autre">Autre</option>
                </Select>
                <InputGroup size="sm" w="220px">
                  <InputLeftElement>
                    <SearchIcon />
                  </InputLeftElement>
                  <Input
                    placeholder="Rechercher…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </InputGroup>
              </HStack>
            </HStack>
          </CardHeader>
          <CardBody pt={4}>
            <FileDrop onFile={handleFile} />
            <Divider my={5} borderColor="whiteAlpha.300" />

            {filteredDocs.length === 0 ? (
              <EmptyState
                icon={AttachmentIcon}
                title="Aucun document"
                desc="Glissez-déposez un fichier ci-dessus ou utilisez le bouton Importer."
              />
            ) : (
              <VStack align="stretch" spacing={2}>
                {filteredDocs.map((d, i) => {
                  const abs = toAbsoluteUrl(d.url);
                  const key = d._id || `${d.name}-${i}`;
                  return (
                    <HStack
                      key={key}
                      justify="space-between"
                      p={3}
                      borderRadius="xl"
                      bg={glassBg(0.1)}
                      border="1px solid"
                      borderColor={`rgba(255,255,255,${borderAlpha})`}
                      _hover={{
                        bg: glassBg(0.16),
                        transform: "translateY(-1px)",
                      }}
                      transition="all .2s ease"
                      willChange="transform"
                    >
                      <HStack minW={0}>
                        <Badge variant="outline" colorScheme="purple">
                          {d.tag || "Fichier"}
                        </Badge>
                        <Text fontWeight="600" noOfLines={1}>
                          {d.name}
                        </Text>
                        <Text fontSize="xs" opacity={0.7} noOfLines={1}>
                          {(d.size / 1024).toFixed(1)} Ko • {d.mimeType || "—"}
                        </Text>
                      </HStack>
                      <HStack flexShrink={0}>
                        <ChakraTooltip label="Aperçu">
                          <IconButton
                            icon={<ViewIcon />}
                            aria-label="Aperçu"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPreview({ ...d, url: abs });
                            }}
                          />
                        </ChakraTooltip>
                        <IconButton
                          as={ChakraLink}
                          href={abs}
                          isExternal
                          icon={<ExternalLinkIcon />}
                          aria-label="Ouvrir"
                          variant="ghost"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <IconButton
                          icon={<DownloadIcon />}
                          aria-label="Télécharger"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(abs, "_blank");
                          }}
                        />
                        <IconButton
                          icon={<WarningTwoIcon />}
                          aria-label="Supprimer"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(d._id);
                          }}
                        />
                      </HStack>
                    </HStack>
                  );
                })}
              </VStack>
            )}
          </CardBody>
        </MCard>

        {/* INSIGHTS / CHARTS */}
        <Stack id="insights" spacing={6} minW={0}>
          <MCard
            {...liftProps}
            style={focusStyle(focusCard === "crs")}
            onClick={() => setFocusCard(focusCard === "crs" ? null : "crs")}
            backdropFilter="blur(10px)"
            bg={glassBg(0.12)}
            border="1px solid"
            borderColor={`rgba(255,255,255,${borderAlpha})`}
            minW={0}
          >
            <CardHeader pb={1}>
              <Heading size="sm">Répartition CRS (approx.)</Heading>
            </CardHeader>
            <CardBody h="200px" minH="200px" minW={0}>
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="40%"
                  outerRadius="100%"
                  data={crsRadialData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" background cornerRadius={8} />
                  <RTooltip />
                  <Legend />
                </RadialBarChart>
              </ResponsiveContainer>
            </CardBody>
          </MCard>

          <MCard
            {...liftProps}
            style={focusStyle(focusCard === "budget")}
            onClick={() => setFocusCard(focusCard === "budget" ? null : "budget")}
            backdropFilter="blur(10px)"
            bg={glassBg(0.12)}
            border="1px solid"
            borderColor={`rgba(255,255,255,${borderAlpha})`}
            minW={0}
          >
            <CardHeader pb={1}>
              <Heading size="sm">Distribution Budget (est.)</Heading>
            </CardHeader>
            <CardBody h="220px" minH="220px" minW={0}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    dataKey="value"
                    data={budgetPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {budgetPieData.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_COLORS[idx % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardBody>
          </MCard>

          <MCard
            {...liftProps}
            style={focusStyle(focusCard === "timeline")}
            onClick={() =>
              setFocusCard(focusCard === "timeline" ? null : "timeline")
            }
            backdropFilter="blur(10px)"
            bg={glassBg(0.12)}
            border="1px solid"
            borderColor={`rgba(255,255,255,${borderAlpha})`}
            minW={0}
          >
            <CardHeader pb={1}>
              <Heading size="sm">Délais (indicatifs)</Heading>
            </CardHeader>
            <CardBody h="240px" minH="240px" minW={0}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={timelineLineData}
                  margin={{ top: 10, right: 16, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="step" />
                  <YAxis />
                  <RTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="days"
                    stroke="#7a3dfa"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </MCard>
        </Stack>
      </SimpleGrid>

      {/* ASSISTANCE */}
      <MCard
        id="assist"
        {...appear}
        {...liftProps}
        style={focusStyle(focusCard === "assist")}
        onClick={() => setFocusCard(focusCard === "assist" ? null : "assist")}
        mt={6}
        backdropFilter="blur(12px)"
        bg={glassBg(0.14)}
        border="1px solid"
        borderColor={`rgba(255,255,255,${borderAlpha})`}
      >
        <CardHeader pb={0}>
          <HStack justify="space-between">
            <Heading size="md">Centre d’assistance</Heading>
            <HStack opacity={0.75}>
              <Kbd>?</Kbd>
              <Text fontSize="sm">
                Astuce : clic sur une carte pour activer le mode Focus
              </Text>
            </HStack>
          </HStack>
        </CardHeader>
        <CardBody>
          <Tabs variant="soft-rounded" colorScheme="purple">
            <TabList>
              <Tab>Recommandation</Tab>
              <Tab>Notifications</Tab>
              <Tab>Conseils</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                {reco ? (
                  <VStack align="start" spacing={2}>
                    <Text>
                      Programme pressenti:{" "}
                      <Tag colorScheme="purple" size="md" borderRadius="full">
                        {reco?.program ?? "—"}
                      </Tag>
                    </Text>
                    <HStack>
                      <Badge colorScheme="green">Score: {reco?.score ?? 0}</Badge>
                      <Badge colorScheme="orange">
                        Budget: {reco?.budget ?? 0} $
                      </Badge>
                    </HStack>
                    {(reco?.recommendations?.length ?? 0) > 1 && (
                      <>
                        <Text opacity={0.8} fontSize="sm" mt={2}>
                          Alternatives :
                        </Text>
                        <VStack align="start" spacing={1}>
                          {(reco?.recommendations?.slice(1, 4) ?? []).map(
                            (r, i) => (
                              <HStack key={`${r.label}-${i}`} spacing={2}>
                                <Icon as={CheckCircleIcon} />
                                <Text>{r.label}</Text>
                              </HStack>
                            )
                          )}
                        </VStack>
                      </>
                    )}
                    <Button
                      mt={3}
                      variant="soft"
                      onClick={() => nav("/questionnaire")}
                    >
                      Ajuster mes réponses
                    </Button>
                  </VStack>
                ) : (
                  <EmptyState
                    icon={InfoOutlineIcon}
                    title="Pas de recommandation"
                    desc="Complétez le questionnaire pour obtenir votre programme et un budget estimé."
                    ctaLabel="Lancer le questionnaire"
                    onCta={() => nav("/questionnaire")}
                  />
                )}
              </TabPanel>

              <TabPanel>
                <VStack align="stretch" spacing={3}>
                  <Notice
                    type="info"
                    text="Votre conseiller vous contactera sous 24–48h par email."
                  />
                  <Notice
                    type="success"
                    text="Votre score a été recalculé — aucune action requise."
                  />
                  <Notice
                    type="warning"
                    text="Ajoutez un passeport valide pour accélérer la suite."
                  />
                </VStack>
              </TabPanel>

              <TabPanel>
                <Text opacity={0.85}>
                  Préparez des scans nets (PDF) de vos diplômes, relevés de
                  notes, attestations d’emploi et certificats linguistiques.
                </Text>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </CardBody>
      </MCard>

      {/* MODAL APERÇU DOC */}
      <PreviewModal
        isOpen={preview.isOpen}
        onClose={preview.onClose}
        doc={previewDoc}
      />

      {/* MODAL ÉDITION PROFIL */}
      <EditProfileModal
        isOpen={editProfile.isOpen}
        onClose={editProfile.onClose}
        name={editName}
        setName={setEditName}
        photoPreview={editPhotoPreview}
        onPickPhoto={onPickPhoto}
        onSave={onSaveProfile}
      />
    </Container>
  );
}

/* ========================= Composants locaux ========================= */

function Notice({
  type,
  text,
}: {
  type: "info" | "success" | "warning" | "error";
  text: string;
}) {
  return (
    <Alert
      status={type}
      variant="subtle"
      borderRadius="lg"
      bg="whiteAlpha.100"
      border="1px solid"
      borderColor="whiteAlpha.200"
      alignItems="start"
    >
      <AlertIcon />
      <Text>{text}</Text>
    </Alert>
  );
}

function StatCard({
  title,
  value,
  icon,
  accent,
  sub,
}: {
  title: string;
  value: string | number;
  icon: any;
  accent?: string;
  sub?: string;
}) {
  return (
    <MCard
      {...liftProps}
      backdropFilter="blur(10px)"
      bg={glassBg(0.12)}
      border="1px solid"
      borderColor={`rgba(255,255,255,${borderAlpha})`}
      boxShadow="0 10px 30px rgba(0,0,0,0.25)"
    >
      <CardBody>
        <HStack justify="space-between" align="start">
          <VStack align="start" spacing={0}>
            <Text opacity={0.8} fontSize="sm">
              {title}
            </Text>
            <Heading size="md">{value}</Heading>
            {sub && (
              <Text opacity={0.6} fontSize="xs">
                {sub}
              </Text>
            )}
          </VStack>
          <Box
            p={2.5}
            borderRadius="lg"
            bg={glassBg(0.1)}
            border="1px solid"
            borderColor={`rgba(255,255,255,${borderAlpha})`}
          >
            <Icon as={icon} color={accent} boxSize={5} />
          </Box>
        </HStack>
      </CardBody>
    </MCard>
  );
}

function EmptyState({
  icon,
  title,
  desc,
  ctaLabel,
  onCta,
}: {
  icon: any;
  title: string;
  desc?: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  return (
    <VStack py={6} opacity={0.9}>
      <Icon as={icon} boxSize={7} />
      <Heading size="sm" mt={2}>
        {title}
      </Heading>
      {desc && (
        <Text fontSize="sm" opacity={0.8} textAlign="center">
          {desc}
        </Text>
      )}
      {ctaLabel && (
        <Button size="sm" mt={2} variant="soft" onClick={onCta}>
          {ctaLabel}
        </Button>
      )}
    </VStack>
  );
}

function guessDocTag(name: string) {
  const n = name.toLowerCase();
  if (n.includes("passport") || n.includes("passeport")) return "Passeport";
  if (n.includes("diplom") || n.includes("degree")) return "Diplôme";
  if (n.includes("cv") || n.includes("resume")) return "Expérience";
  return "Autre";
}

/* ---------- Aperçu inline (images / PDF multipages + zoom) ---------- */
function PreviewModal({
  isOpen,
  onClose,
  doc,
}: {
  isOpen: boolean;
  onClose: () => void;
  doc: DocItem | null;
}) {
  const [zoom, setZoom] = React.useState(1);
  React.useEffect(() => {
    if (isOpen) setZoom(1);
  }, [isOpen]);

  const isImage =
    !!doc?.mimeType?.startsWith("image") ||
    /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(doc?.name || "");
  const isPDF =
    doc?.mimeType === "application/pdf" || /\.pdf$/i.test(doc?.name || "");
  const absUrl = toAbsoluteUrl(doc?.url);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(2px)" />
      <ModalContent bg="transparent" boxShadow="none">
        <ModalCloseButton color="whiteAlpha.900" />
        <ModalBody display="grid" placeItems="center" p={4}>
          <VStack spacing={3} w="full" h="full">
            <HStack justify="space-between" w="full" color="whiteAlpha.900">
              <HStack>
                <Icon as={ViewIcon} />
                <Text fontWeight="600" noOfLines={1} maxW="60vw">
                  {doc?.name}
                </Text>
              </HStack>
              <HStack>
                <ChakraTooltip label="Zoom -">
                  <IconButton
                    aria-label="zoom out"
                    icon={<RepeatIcon transform="rotate(90deg)" />}
                    onClick={() =>
                      setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(1)))
                    }
                  />
                </ChakraTooltip>
                <Text minW="48px" textAlign="center">
                  {Math.round(zoom * 100)}%
                </Text>
                <ChakraTooltip label="Zoom +">
                  <IconButton
                    aria-label="zoom in"
                    icon={<RepeatIcon />}
                    onClick={() =>
                      setZoom((z) => Math.min(3, +(z + 0.1).toFixed(1)))
                    }
                  />
                </ChakraTooltip>
              </HStack>
            </HStack>

            <Box
              flex="1"
              w="full"
              bg="blackAlpha.700"
              borderRadius="2xl"
              overflow="hidden"
              display="grid"
              placeItems="center"
              p={2}
            >
              {isImage && (
                <Image
                  src={absUrl}
                  maxH="85vh"
                  objectFit="contain"
                  transform={`scale(${zoom})`}
                  transition="transform .15s linear"
                />
              )}
              {isPDF && (
                <Box w="100%" h="85vh">
                  <PdfMultiPageViewer url={absUrl} zoom={zoom} />
                </Box>
              )}
              {!isImage && !isPDF && (
                <Text color="whiteAlpha.900" opacity={0.9}>
                  Aperçu non disponible pour ce type de fichier.
                </Text>
              )}
            </Box>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/* ---------- PDF multipages (pdfjs-dist) ---------- */
function PdfMultiPageViewer({ url, zoom }: { url: string; zoom: number }) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [doc, setDoc] = React.useState<any>(null);
  const [page, setPage] = React.useState<number>(1);
  const [total, setTotal] = React.useState<number>(1);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        if (cancel) return;
        setDoc(pdf);
        setTotal(pdf.numPages);
        setPage(1);
      } catch (e) {
        console.error("pdf load error", e);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [url]);

  React.useEffect(() => {
    (async () => {
      if (!doc || !canvasRef.current) return;
      try {
        const currentPage = await doc.getPage(page);
        const viewport = currentPage.getViewport({ scale: 1 * zoom });
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const renderContext = {
          canvasContext: ctx,
          viewport,
          transform: [dpr, 0, 0, dpr, 0, 0],
        };
        await currentPage.render(renderContext).promise;
      } catch {}
    })();
  }, [doc, page, zoom]);

  const next = () => setPage((p) => Math.min(total, p + 1));
  const prev = () => setPage((p) => Math.max(1, p - 1));

  return (
    <VStack h="full" w="full" spacing={3}>
      <HStack justify="space-between" w="full" color="whiteAlpha.900">
        <HStack>
          <Button size="sm" onClick={prev} isDisabled={page <= 1}>
            Préc.
          </Button>
          <Button size="sm" onClick={next} isDisabled={page >= total}>
            Suiv.
          </Button>
        </HStack>
        <Text fontSize="sm">
          Page {page} / {total}
        </Text>
      </HStack>
      <Box
        flex="1"
        w="full"
        display="grid"
        placeItems="center"
        overflow="auto"
        bg="black"
        borderRadius="lg"
      >
        {loading ? (
          <Text color="whiteAlpha.800" p={4}>
            Chargement PDF…
          </Text>
        ) : (
          <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />
        )}
      </Box>
    </VStack>
  );
}

/* ---------- Sidebar flottante ---------- */
function SidebarFloating({
  progress,
  onJump,
}: {
  progress: number;
  onJump: (id: string) => void;
}) {
  const items = [
    { id: "header", label: "Accueil" },
    { id: "stats", label: "Statistiques" },
    { id: "documents", label: "Documents" },
    { id: "insights", label: "Insights" },
    { id: "assist", label: "Assistance" },
  ];
  return (
    <Floating top={{ base: 8, md: 24 }} right={{ base: 4, md: 6 }} zIndex={11}>
      <Card
        backdropFilter="blur(10px)"
        bg={glassBg(0.16)}
        border="1px solid"
        borderColor={`rgba(255,255,255,${borderAlpha})`}
        boxShadow="0 10px 40px rgba(0,0,0,0.28)"
        p={3}
      >
        <VStack spacing={3}>
          <CircularProgress value={progress} size="68px" color="purple.300">
            <CircularProgressLabel>{progress}%</CircularProgressLabel>
          </CircularProgress>
          <Divider borderColor="whiteAlpha.300" />
          <VStack spacing={2} align="stretch" minW="150px">
            {items.map((it) => (
              <Button
                key={it.id}
                size="sm"
                variant="ghost"
                onClick={() => onJump(it.id)}
              >
                {it.label}
              </Button>
            ))}
          </VStack>
        </VStack>
      </Card>
    </Floating>
  );
}

function Floating(props: BoxProps) {
  return <Box position="fixed" {...props} />;
}

function focusStyle(active: boolean): React.CSSProperties {
  return active
    ? {
        position: "relative",
        zIndex: 12,
        transform: "scale(1.02) translateY(-2px)",
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.45), inset 0 0 2px rgba(255,255,255,0.25)",
        transition:
          "transform .18s cubic-bezier(.2,.8,.2,1), box-shadow .2s ease",
        willChange: "transform",
        cursor: "zoom-out",
      }
    : { cursor: "zoom-in" };
}

/* ---------- Modal Édition de profil ---------- */
function EditProfileModal({
  isOpen,
  onClose,
  name,
  setName,
  photoPreview,
  onPickPhoto,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  setName: (s: string) => void;
  photoPreview: string;
  onPickPhoto: (f?: File | null) => void;
  onSave: () => void;
}) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent
        backdropFilter="blur(12px)"
        bg="whiteAlpha.100"
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        <ModalHeader>Éditer mon profil</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <HStack>
              <Avatar size="xl" src={photoPreview || undefined} />
              <VStack align="start" spacing={2}>
                <Button
                  leftIcon={<AttachmentIcon />}
                  variant="soft"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choisir une photo
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  display="none"
                  onChange={(e) => onPickPhoto(e.target.files?.[0])}
                />
                <Text fontSize="xs" opacity={0.7}>
                  PNG/JPG/WebP, 5 Mo max recommandé.
                </Text>
              </VStack>
            </HStack>

            <FormControl>
              <FormLabel>Nom complet</FormLabel>
              <Input
                placeholder="Votre nom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button mr={3} variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="neon" onClick={onSave}>
            Enregistrer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
