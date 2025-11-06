import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: { initialColorMode: "dark", useSystemColorMode: false },
  styles: {
    global: {
      "html, body, #root": {
        height: "100%",
        background: "linear-gradient(135deg,#0f0a1f,#0b0a1f)"
      },
      "::selection": { background: "rgba(145,94,254,0.35)" }
    }
  },
  fonts: {
    heading: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    body: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
  },
  radii: {
    xl: "16px",
    "2xl": "24px",
  },
  shadows: {
    soft: "0 10px 30px rgba(0,0,0,0.25)",
    glow: "0 0 0 1px rgba(145,94,254,0.5), 0 0 30px rgba(145,94,254,0.35)"
  },
  colors: {
    brand: {
      50:"#f1eaff",100:"#d9c7ff",200:"#c1a4ff",300:"#a981fe",400:"#915efe",
      500:"#7a3dfa",600:"#5e2fd0",700:"#4623a1",800:"#2f1772",900:"#1a0b44"
    }
  },
  components: {
    Button: {
      baseStyle: { borderRadius: "14px", fontWeight: 600 },
      variants: {
        glass: {
          bg: "whiteAlpha.100",
          border: "1px solid",
          borderColor: "whiteAlpha.200",
          backdropFilter: "blur(8px)",
          _hover: { bg: "whiteAlpha.200" }
        },
        neon: {
          bgGradient: "linear(to-r, brand.500, purple.300)",
          color: "white",
          boxShadow: "glow",
          _hover: { filter: "brightness(1.08)" },
          _active: { filter: "brightness(0.98)" }
        },
        soft: {
          bg: "whiteAlpha.100",
          color: "white",
          _hover: { bg: "whiteAlpha.200" }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "24px",
          bg: "whiteAlpha.70",
          _dark: { bg: "whiteAlpha.100" },
          border: "1px solid",
          borderColor: "whiteAlpha.200",
          backdropFilter: "blur(12px)",
          boxShadow: "soft"
        }
      }
    },
    Input: {
      variants: {
        filled: {
          field: {
            bg: "whiteAlpha.100",
            border: "1px solid",
            borderColor: "whiteAlpha.200",
            _hover: { bg: "whiteAlpha.200" },
            _focusVisible: { borderColor: "brand.500", boxShadow: "0 0 0 1px var(--chakra-colors-brand-500)" }
          }
        }
      },
      defaultProps: { variant: "filled" }
    },
    Select: { defaultProps: { variant: "filled" }},
    NumberInput: { defaultProps: { variant: "filled" }},
    Textarea: { defaultProps: { variant: "filled" }}
  }
});

export default theme;
