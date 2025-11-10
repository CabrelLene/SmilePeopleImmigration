import {
  Avatar,
  Box,
  Button,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useColorMode,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";
import { SearchIcon, SunIcon, MoonIcon } from "@chakra-ui/icons";

export default function Topbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={20}
      px={{ base: 4, md: 6 }}
      py={3}
      backdropFilter="blur(10px)"
      bg="whiteAlpha.100"
      borderBottom="1px solid"
      borderColor="whiteAlpha.200"
    >
      <HStack justify="space-between" align="center" gap={4}>
        {/* Logo / Home */}
        <HStack as={Link} to="/" spacing={3}>
          <Box
            w="10"
            h="10"
            borderRadius="lg"
            bgGradient="linear(to-br, brand.500, purple.300)"
          />
          <Text fontWeight={700}>ImmigrPro</Text>
        </HStack>

        {/* Recherche */}
        <InputGroup maxW="420px" display={{ base: "none", md: "block" }}>
          <InputLeftElement>
            <SearchIcon />
          </InputLeftElement>
          <Input placeholder="Rechercher…" variant="filled" />
        </InputGroup>

        <HStack spacing={3}>
          {/* Bouton Admin visible uniquement si admin */}
          {user?.role === "admin" && (
            <Button as={Link} to="/admin" variant="glass" size="sm">
              Admin
            </Button>
          )}

          <IconButton
            aria-label="Basculer le thème"
            icon={colorMode === "light" ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            variant="ghost"
          />

          {/* Menu utilisateur */}
          <Menu>
            <MenuButton>
              <HStack spacing={2}>
                <Avatar size="sm" name={user?.fullName || user?.email} src={user?.photoUrl || undefined} />
                <Box display={{ base: "none", md: "block" }} textAlign="left">
                  <Text fontWeight={600} noOfLines={1}>
                    {user?.fullName || "Compte"}
                  </Text>
                  <Text fontSize="xs" opacity={0.7} noOfLines={1}>
                    {user?.email}
                  </Text>
                </Box>
              </HStack>
            </MenuButton>
            <MenuList>
              <MenuItem as={Link} to="/dashboard">Mon espace</MenuItem>
              {user?.role === "admin" && <MenuItem as={Link} to="/admin">Administration</MenuItem>}
              <MenuItem onClick={() => nav("/questionnaire")}>Questionnaire</MenuItem>
              <MenuItem onClick={() => { logout(); nav("/login"); }}>Déconnexion</MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </HStack>
    </Box>
  );
}
