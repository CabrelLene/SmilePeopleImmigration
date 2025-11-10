// src/pages/dashboard/AdminDashboard.tsx
import React from "react";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Container,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  GridItem,
  HStack,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Kbd,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  Textarea,
  Tooltip as ChakraTooltip,
  useDisclosure,
  useToast,
  useColorModeValue,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VStack,
  Switch,
  Skeleton,
} from "@chakra-ui/react";
import {
  ChevronDownIcon,
  DownloadIcon,
  ExternalLinkIcon,
  SearchIcon,
  SettingsIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import { motion } from "framer-motion";
import { api } from "../../api";
import { getSocket } from "../../lib/socket";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RTooltip,
  Legend,
} from "recharts";

/* -------------------- Helpers URL absolue -------------------- */
const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_ORIGIN = (() => {
  try {
    return new URL(RAW_BASE).origin;
  } catch {
    return "http://localhost:4000";
  }
})();
const toAbsoluteUrl = (u?: string) => {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  return `${API_ORIGIN}${u.startsWith("/") ? u : `/${u}`}`;
};
/* ------------------------------------------------------------ */

const MCard = motion(Card);
const glassBg = (a = 0.12) => `rgba(255,255,255,${a})`;
const borderAlpha = 0.22;
const lift = {
  whileHover: { y: -4, scale: 1.01 },
  transition: { type: "spring", stiffness: 240, damping: 18 },
};

type AppLite = {
  _id: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  programSuggestion?: string;
  budgetEstimate?: number;
  user: { _id: string; fullName?: string; email?: string; photoUrl?: string };
  answers?: Record<string, any>;
  files?: Array<{ id?: string; url: string; name: string; size?: number; mimeType?: string }>;
  score?: number;
};

type SortKey = "createdAt" | "updatedAt" | "status" | "score" | "budgetEstimate" | "name";

/* -------------------- ChartBox: garde-fou Recharts --------------------
   - Mesure le conteneur avec ResizeObserver
   - Ne rend le chart que si width > 0 et height > 0
----------------------------------------------------------------------- */
function ChartBox({
  height = 200,
  children,
}: {
  height?: number;
  children: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr && cr.width > 0 && height > 0) {
        setReady(true);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  return (
    <Box ref={ref} w="100%" minW={0} height={`${height}px`}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : (
        <Skeleton height={`${height}px`} borderRadius="md" />
      )}
    </Box>
  );
}

export default function AdminDashboard() {
  const toast = useToast();

  // --- état liste côté serveur ---
  const [loading, setLoading] = React.useState(true);
  const [apps, setApps] = React.useState<AppLite[]>([]);
  const [total, setTotal] = React.useState(0);
  const [pageCount, setPageCount] = React.useState(1);

  // --- filtres/tri/pagination (server-driven) ---
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  // Sélection (sur la page courante)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  // Drawer détail
  const detail = useDisclosure();
  const [current, setCurrent] = React.useState<AppLite | null>(null);

  // Aperçu doc (modal)
  const preview = useDisclosure();
  const [previewDoc, setPreviewDoc] = React.useState<{ url: string; name: string; mimeType?: string } | null>(null);

  // Paramètres (auto refresh)
  const settings = useDisclosure();
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  // charger liste
  const load = React.useCallback(async () => {
    try {
      setLoading(true);
      const resp = await api.adminList({
        q,
        status: statusFilter,
        sort: sortKey,
        dir: sortDir,
        page,
        pageSize,
      });
      const normalized: AppLite[] = (resp.items || []).map((a: any) => ({
        ...a,
        user: {
          ...a.user,
          photoUrl: a.user?.photoUrl ? toAbsoluteUrl(a.user.photoUrl) : undefined,
        },
        files: (a.files || []).map((f: any) => ({ ...f, url: toAbsoluteUrl(f.url) })),
      }));
      setApps(normalized);
      setTotal(resp.total || 0);
      setPageCount(resp.pageCount || 1);
      setSelectedIds([]);
    } catch (e: any) {
      toast({ title: "Impossible de charger les dossiers", description: e?.message, status: "error" });
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter, sortKey, sortDir, page]);

  // Effets : initial + filtres + websocket
  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const s = getSocket();
    const onUpd = () => load();
    s.on("app:updated", onUpd);
    s.on("app:created", onUpd);
    s.on("file:uploaded", onUpd);
    let t: number | undefined;
    if (autoRefresh) t = window.setInterval(load, 15000);
    return () => {
      s.off("app:updated", onUpd);
      s.off("app:created", onUpd);
      s.off("file:uploaded", onUpd);
      if (t) clearInterval(t);
    };
  }, [autoRefresh, load]);

  // Sélection page courante
  const allVisibleIds = React.useMemo(() => apps.map((a) => a._id), [apps]);
  const allSelected = selectedIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id));
  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedIds(allVisibleIds);
    else setSelectedIds([]);
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelectedIds((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));
  };

  // Changer statut (unitaire)
  const changeStatus = async (id: string, status: string) => {
    try {
      const updated = await api.adminUpdate(id, { status });
      setApps((prev) => prev.map((p) => (p._id === id ? { ...p, ...updated } : p)));
      toast({ title: "Statut mis à jour", status: "success" });
    } catch (e: any) {
      toast({ title: "Échec mise à jour statut", description: e?.message, status: "error" });
    }
  };

  // Bulk status
  const bulkStatus = async (status: string) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      try {
        const updated = await api.adminUpdate(id, { status });
        setApps((prev) => prev.map((p) => (p._id === id ? { ...p, ...updated } : p)));
      } catch {}
    }
    setSelectedIds([]);
    toast({ title: `Statut appliqué à ${selectedIds.length} dossier(s)`, status: "success" });
  };

  // Export CSV (liste courante)
  const exportCSV = () => {
    const rows = [["id","fullName","email","status","program","budget","score","createdAt","updatedAt"]];
    for (const a of apps) {
      rows.push([
        a._id,
        a.user?.fullName || "",
        a.user?.email || "",
        a.status || "",
        a.programSuggestion || "",
        String(a.budgetEstimate ?? ""),
        String(a.score ?? ""),
        a.createdAt || "",
        a.updatedAt || "",
      ]);
    }
    const csv = rows.map(r => r.map(v => `"${(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dossiers-page${page}-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Ouvrir détail
  const openDetail = (a: AppLite) => {
    setCurrent(a);
    detail.onOpen();
  };

  // Aperçu doc
  const openPreview = (doc: { url: string; name: string; mimeType?: string }) => {
    setPreviewDoc({ ...doc, url: toAbsoluteUrl(doc.url) });
    preview.onOpen();
  };

  const statuses = ["draft","submitted","review","waiting-info","in-progress","done"] as const;
  const byStatus = statuses.map(s => ({ name: s, value: apps.filter(a=>a.status===s).length }));
  const PIE_COLORS = ["#7a3dfa","#915efe","#5e2fd0","#b69cff","#dcccff","#e9e0ff"];

  return (
    <Container maxW="container.xl" py={{ base: 6, md: 8 }} minW={0}>
      {/* HEADER BAR */}
      <MCard
        {...lift}
        backdropFilter="blur(12px)"
        bg={glassBg(0.14)}
        border="1px solid"
        borderColor={`rgba(255,255,255,${borderAlpha})`}
        minW={0}
      >
        <CardBody>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={3} minW={0}>
            <HStack minW={0}>
              <Heading size="md">Admin — Cockpit dossiers</Heading>
              <Tag colorScheme="purple" borderRadius="full">{total} dossiers</Tag>
            </HStack>

            <HStack spacing={3} minW={0}>
              <InputGroup w={{ base: "100%", md: "280px" }}>
                <InputLeftElement><SearchIcon /></InputLeftElement>
                <Input
                  placeholder="Rechercher (nom, email, programme…)"
                  value={q}
                  onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
                />
              </InputGroup>

              <Select value={statusFilter} onChange={(e)=>{ setStatusFilter(e.target.value); setPage(1); }} w="180px">
                <option value="all">Tous les statuts</option>
                {statuses.map(s=>(<option key={s} value={s}>{s}</option>))}
              </Select>

              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="glass">
                  Trier
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={()=>{ setSortKey("createdAt"); setPage(1); }}>Date création</MenuItem>
                  <MenuItem onClick={()=>{ setSortKey("updatedAt"); setPage(1); }}>Dernière maj</MenuItem>
                  <MenuItem onClick={()=>{ setSortKey("name"); setPage(1); }}>Nom</MenuItem>
                  <MenuItem onClick={()=>{ setSortKey("status"); setPage(1); }}>Statut</MenuItem>
                  <MenuItem onClick={()=>{ setSortKey("score"); setPage(1); }}>Score</MenuItem>
                  <MenuItem onClick={()=>{ setSortKey("budgetEstimate"); setPage(1); }}>Budget</MenuItem>
                </MenuList>
              </Menu>

              <Select value={sortDir} onChange={(e)=>{ setSortDir(e.target.value as "asc"|"desc"); setPage(1); }} w="120px">
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </Select>

              <Button leftIcon={<DownloadIcon />} variant="glass" onClick={exportCSV}>
                Export CSV
              </Button>

              <IconButton aria-label="Paramètres" icon={<SettingsIcon />} variant="glass" onClick={settings.onOpen} />
            </HStack>
          </HStack>

          {/* mini analytics */}
          <Box mt={4} p={3} borderRadius="lg" bg={glassBg(0.10)} border="1px solid" borderColor="whiteAlpha.200" minW={0}>
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} minW={0} alignItems="center">
              <HStack minW={0}>
                <Text opacity={0.8}>Répartition des statuts (page courante)</Text>
              </HStack>
              <Box minW={0}>
                <ChartBox height={160}>
                  <PieChart>
                    <Pie dataKey="value" data={byStatus} cx="50%" cy="50%" outerRadius={60} label>
                      {byStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <RTooltip />
                  </PieChart>
                </ChartBox>
              </Box>
            </SimpleGrid>
          </Box>
        </CardBody>
      </MCard>

      {/* BULK BAR */}
      <Card mt={4} backdropFilter="blur(10px)" bg={glassBg(0.12)} border="1px solid" borderColor={`rgba(255,255,255,${borderAlpha})`} minW={0}>
        <CardBody>
          <HStack justify="space-between" flexWrap="wrap" gap={3} minW={0}>
            <HStack minW={0}>
              <Checkbox isChecked={allSelected} onChange={(e)=>toggleAll(e.target.checked)}>Tout sélectionner (page)</Checkbox>
              <Text opacity={0.75}>{selectedIds.length} sélectionné(s)</Text>
            </HStack>
            <HStack minW={0}>
              <Menu>
                <MenuButton as={Button} rightIcon={<ChevronDownIcon />} isDisabled={selectedIds.length===0}>
                  Changer statut (sélection)
                </MenuButton>
                <MenuList>
                  {(["draft","submitted","review","waiting-info","in-progress","done"] as const).map(s=><MenuItem key={s} onClick={()=>bulkStatus(s)}>{s}</MenuItem>)}
                </MenuList>
              </Menu>
            </HStack>
          </HStack>
        </CardBody>
      </Card>

      {/* GRID DE DOSSIERS */}
      {loading ? (
        <HStack justify="center" mt={8}><Spinner /><Text>Chargement…</Text></HStack>
      ) : (
        <>
          {apps.length === 0 ? (
            <Card mt={6}><CardBody><Text>Aucun dossier pour ces critères.</Text></CardBody></Card>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4} mt={6} minW={0}>
              {apps.map((a) => (
                <MCard
                  key={a._id}
                  {...lift}
                  backdropFilter="blur(10px)"
                  bg={glassBg(0.12)}
                  border="1px solid"
                  borderColor={`rgba(255,255,255,${borderAlpha})`}
                  minW={0}
                >
                  <CardHeader pb={0}>
                    <HStack justify="space-between" align="start" minW={0}>
                      <HStack minW={0}>
                        <Checkbox
                          isChecked={selectedIds.includes(a._id)}
                          onChange={(e)=>toggleOne(a._id, e.target.checked)}
                        />
                        <Avatar
                          name={a.user?.fullName || a.user?.email || "Client"}
                          src={a.user?.photoUrl}
                          size="sm"
                        />
                        <VStack align="start" spacing={0} minW={0}>
                          <Text fontWeight="600" noOfLines={1}>
                            {a.user?.fullName || "Sans nom"}
                          </Text>
                          <Text fontSize="xs" opacity={0.75} noOfLines={1}>
                            {a.user?.email}
                          </Text>
                        </VStack>
                      </HStack>
                      <Badge variant="solid" colorScheme="purple">
                        {a.status}
                      </Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody pt={3}>
                    <VStack align="start" spacing={2}>
                      <Text>Programme : <b>{a.programSuggestion || "—"}</b></Text>
                      <Text>Budget : {a.budgetEstimate ? `${a.budgetEstimate} $` : "—"}</Text>
                      <HStack>
                        <Badge colorScheme="green">Score: {a.score ?? "—"}</Badge>
                      </HStack>

                      <HStack pt={1} spacing={2} flexWrap="wrap" minW={0}>
                        <Select
                          size="sm"
                          w="160px"
                          value={a.status}
                          onChange={(e)=>changeStatus(a._id, e.target.value)}
                        >
                          {(["draft","submitted","review","waiting-info","in-progress","done"] as const).map(s=><option key={s} value={s}>{s}</option>)}
                        </Select>
                        <Button size="sm" variant="glass" leftIcon={<ViewIcon />} onClick={()=>openDetail(a)}>
                          Ouvrir
                        </Button>
                        <Button
                          size="sm"
                          variant="glass"
                          leftIcon={<ExternalLinkIcon />}
                          onClick={()=>openDetail(a)}
                        >
                          Réponses
                        </Button>
                      </HStack>
                    </VStack>
                  </CardBody>
                </MCard>
              ))}
            </SimpleGrid>
          )}

          {/* Pagination (server) */}
          <HStack mt={6} justify="center" spacing={2}>
            <Button size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} isDisabled={page<=1}>Préc.</Button>
            <Text px={2}>Page {page} / {pageCount}</Text>
            <Button size="sm" onClick={()=>setPage(p=>Math.min(pageCount,p+1))} isDisabled={page>=pageCount}>Suiv.</Button>
          </HStack>
        </>
      )}

      {/* Drawer DÉTAIL */}
      <AppDetailDrawer
        isOpen={detail.isOpen}
        onClose={detail.onClose}
        app={current}
        onPreviewDoc={openPreview}
        onChangeProgram={async (program: string, budget?: number) => {
          if (!current) return;
          const updated = await api.adminUpdate(current._id, { programSuggestion: program, budgetEstimate: budget });
          const next = { ...current, ...updated };
          setApps(prev => prev.map(p => p._id === current._id ? next : p));
          setCurrent(next);
          toast({ title: "Programme mis à jour", status: "success" });
        }}
        onAddNote={async (text: string) => {
          if (!current) return;
          await api.adminAddNote(current._id, { text });
          toast({ title: "Note ajoutée", status: "success" });
        }}
        onAssign={async (who: string) => {
          if (!current) return;
          await api.adminUpdate(current._id, { counselor: who });
          toast({ title: `Assigné à ${who}`, status: "success" });
        }}
      />

      {/* Modal APERÇU simple (image/pdf via balise <object>) */}
      <Modal isOpen={preview.isOpen} onClose={preview.onClose} size="6xl">
        <ModalOverlay />
        <ModalContent
          backdropFilter="blur(8px)"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <ModalHeader>
            Aperçu — {previewDoc?.name}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {previewDoc ? (
              <Box h="70vh" borderRadius="lg" overflow="hidden" bg="blackAlpha.700">
                <object data={previewDoc.url} type={previewDoc.mimeType || "application/pdf"} width="100%" height="100%">
                  <Box p={4}>
                    <Text>Impossible d’afficher un aperçu intégré. <a href={previewDoc.url} target="_blank">Ouvrir dans un nouvel onglet</a></Text>
                  </Box>
                </object>
              </Box>
            ) : (
              <Text>Aucun document.</Text>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal Paramètres */}
      <Modal isOpen={settings.isOpen} onClose={settings.onClose}>
        <ModalOverlay />
        <ModalContent
          backdropFilter="blur(10px)"
          bg="whiteAlpha.100"
          border="1px solid"
          borderColor="whiteAlpha.200"
        >
          <ModalHeader>Paramètres admin</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <HStack justify="space-between">
              <Text>Rafraîchissement automatique</Text>
              <Switch isChecked={autoRefresh} onChange={(e)=>setAutoRefresh(e.target.checked)} />
            </HStack>
            <Text opacity={0.7} mt={2} fontSize="sm">
              Vérifie les nouveaux dossiers et mises à jour toutes les 15 secondes (en plus du temps réel).
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Container>
  );
}

/* -------------------- Drawer Détail Application -------------------- */

function AppDetailDrawer({
  isOpen,
  onClose,
  app,
  onPreviewDoc,
  onChangeProgram,
  onAddNote,
  onAssign,
}: {
  isOpen: boolean;
  onClose: () => void;
  app: AppLite | null;
  onPreviewDoc: (doc: { url: string; name: string; mimeType?: string }) => void;
  onChangeProgram: (program: string, budget?: number) => Promise<void>;
  onAddNote: (text: string) => Promise<void>;
  onAssign: (who: string) => Promise<void>;
}) {
  const [program, setProgram] = React.useState(app?.programSuggestion || "");
  const [budget, setBudget] = React.useState<number | undefined>(app?.budgetEstimate);
  const [note, setNote] = React.useState("");
  const [who, setWho] = React.useState("");

  React.useEffect(()=>{
    setProgram(app?.programSuggestion || "");
    setBudget(app?.budgetEstimate);
    setNote("");
    setWho("");
  },[app?._id]);

  const border = useColorModeValue("whiteAlpha.300","whiteAlpha.200");

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="xl">
      <DrawerOverlay />
      <DrawerContent
        backdropFilter="blur(12px)"
        bg="whiteAlpha.100"
        border="1px solid"
        borderColor="whiteAlpha.200"
      >
        <DrawerCloseButton />
        <DrawerHeader>
          {app ? (
            <HStack>
              <Avatar size="sm" src={app.user?.photoUrl} name={app.user?.fullName || app.user?.email} />
              <VStack align="start" spacing={0}>
                <Heading size="sm">{app.user?.fullName || "Sans nom"}</Heading>
                <Text fontSize="xs" opacity={0.75}>{app.user?.email}</Text>
              </VStack>
              <Tag colorScheme="purple" ml="auto">{app.status}</Tag>
            </HStack>
          ) : "Dossier"}
        </DrawerHeader>
        <DrawerBody>
          {app ? (
            <Tabs variant="soft-rounded" colorScheme="purple">
              <TabList flexWrap="wrap">
                <Tab>Profil</Tab>
                <Tab>Réponses</Tab>
                <Tab>Documents</Tab>
                <Tab>Notes & tâches</Tab>
                <Tab>Actions</Tab>
              </TabList>
              <TabPanels mt={3}>
                <TabPanel>
                  <SimpleGrid columns={{ base:1, md:2}} gap={4}>
                    <GridItem>
                      <Card bg={glassBg(0.10)} border="1px solid" borderColor={border}>
                        <CardBody>
                          <Heading size="sm" mb={2}>Coordonnées</Heading>
                          <Text><b>Nom : </b>{app.user?.fullName || "—"}</Text>
                          <Text><b>Email : </b>{app.user?.email || "—"}</Text>
                          <Text><b>Créé : </b>{app.createdAt || "—"}</Text>
                          <Text><b>MAJ : </b>{app.updatedAt || "—"}</Text>
                        </CardBody>
                      </Card>
                    </GridItem>
                    <GridItem>
                      <Card bg={glassBg(0.10)} border="1px solid" borderColor={border}>
                        <CardBody>
                          <Heading size="sm" mb={2}>Orientation</Heading>
                          <HStack>
                            <Text>Programme :</Text>
                            <Tag>{app.programSuggestion || "—"}</Tag>
                          </HStack>
                          <HStack mt={2}>
                            <Text>Budget :</Text>
                            <Tag colorScheme="orange">{app.budgetEstimate ? `${app.budgetEstimate} $` : "—"}</Tag>
                          </HStack>
                          <HStack mt={2}>
                            <Text>Score :</Text>
                            <Tag colorScheme="green">{app.score ?? "—"}</Tag>
                          </HStack>
                        </CardBody>
                      </Card>
                    </GridItem>
                  </SimpleGrid>
                </TabPanel>
                <TabPanel>
                  {app.answers ? (
                    <Card bg={glassBg(0.10)} border="1px solid" borderColor={border}>
                      <CardBody>
                        <pre style={{ whiteSpace:"pre-wrap", wordBreak:"break-word" }}>
{JSON.stringify(app.answers, null, 2)}
                        </pre>
                      </CardBody>
                    </Card>
                  ) : <Text>Aucune réponse enregistrée.</Text>}
                </TabPanel>
                <TabPanel>
                  <VStack align="stretch" spacing={3}>
                    {(app.files || []).length === 0 && <Text>Aucun document.</Text>}
                    {(app.files || []).map((f, i) => {
                      const abs = toAbsoluteUrl(f.url);
                      return (
                        <HStack
                          key={`${f.name}-${i}`}
                          justify="space-between"
                          p={3}
                          borderRadius="lg"
                          bg={glassBg(0.10)}
                          border="1px solid"
                          borderColor={border}
                        >
                          <HStack minW={0}>
                            <Badge variant="outline" colorScheme="purple">Doc</Badge>
                            <Text fontWeight="600" noOfLines={1}>{f.name}</Text>
                            <Text fontSize="xs" opacity={0.7}>
                              {f.mimeType || "—"}
                            </Text>
                          </HStack>
                          <HStack flexShrink={0}>
                            <ChakraTooltip label="Aperçu">
                              <IconButton
                                icon={<ViewIcon />}
                                aria-label="Aperçu"
                                variant="ghost"
                                onClick={()=>onPreviewDoc({ url: abs, name: f.name, mimeType: f.mimeType })}
                              />
                            </ChakraTooltip>
                            <IconButton
                              as="a"
                              href={abs}
                              target="_blank"
                              rel="noreferrer"
                              icon={<ExternalLinkIcon />}
                              aria-label="Ouvrir"
                              variant="ghost"
                            />
                            <IconButton
                              icon={<DownloadIcon />}
                              aria-label="Télécharger"
                              variant="ghost"
                              onClick={()=>window.open(abs, "_blank")}
                            />
                          </HStack>
                        </HStack>
                      );
                    })}
                  </VStack>
                </TabPanel>
                <TabPanel>
                  <Card bg={glassBg(0.10)} border="1px solid" borderColor={border}>
                    <CardBody>
                      <Heading size="sm">Nouvelle note / tâche</Heading>
                      <Textarea placeholder="Note interne ou tâche à vous-même…" mt={2} value={note} onChange={(e)=>setNote(e.target.value)} />
                      <HStack mt={2}>
                        <Button size="sm" onClick={()=>{ if(note.trim()) { onAddNote(note.trim()); setNote(""); } }}>
                          Ajouter
                        </Button>
                        <Text opacity={0.7} fontSize="sm">Astuce : commencez par <Kbd>@</Kbd>nom pour mentionner un collègue.</Text>
                      </HStack>
                      <Divider my={4} />
                      <Heading size="sm">Affecter un conseiller</Heading>
                      <HStack mt={2}>
                        <Input placeholder="Nom/Identifiant" value={who} onChange={(e)=>setWho(e.target.value)} />
                        <Button onClick={()=>{ if(who.trim()) onAssign(who.trim()); }}>Assigner</Button>
                      </HStack>
                    </CardBody>
                  </Card>
                </TabPanel>
                <TabPanel>
                  <Card bg={glassBg(0.10)} border="1px solid" borderColor={border}>
                    <CardBody>
                      <Heading size="sm">Changer programme & budget</Heading>
                      <SimpleGrid columns={{ base:1, md:2 }} gap={3} mt={2}>
                        <Input placeholder="Programme (texte libre)" value={program} onChange={(e)=>setProgram(e.target.value)} />
                        <Input type="number" placeholder="Budget estimé" value={budget ?? ""} onChange={(e)=>setBudget(e.target.value ? Number(e.target.value) : undefined)} />
                      </SimpleGrid>
                      <HStack mt={3}>
                        <Button variant="neon" onClick={()=>onChangeProgram(program, budget)}>Enregistrer</Button>
                        <Text opacity={0.7} fontSize="sm">S’applique immédiatement au dossier.</Text>
                      </HStack>
                    </CardBody>
                  </Card>
                </TabPanel>
              </TabPanels>
            </Tabs>
          ) : <Text>Aucun dossier sélectionné.</Text>}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
