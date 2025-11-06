import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: { initialColorMode: "dark", useSystemColorMode: false },
  fonts: {
    heading: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    body: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
  },
  styles: {
    global: {
      "html, body, #root": {
        height: "100%",
        background: "linear-gradient(135deg,#0f0a1f,#1a093b)"
      }
    }
  },
  colors: {
    brand: {
      50:"#f1eaff",100:"#d9c7ff",200:"#c1a4ff",300:"#a981fe",400:"#915efe",
      500:"#7a3dfa",600:"#5e2fd0",700:"#4623a1",800:"#2f1772",900:"#1a0b44"
    }
  },
  components: {
    Button: {
      baseStyle: { borderRadius: "14px" },
      variants: {
        glass: {
          bg: "whiteAlpha.100",
          backdropFilter: "blur(8px)",
          _hover: { bg: "whiteAlpha.200" }
        }
      }
    },
    Card: {
      baseStyle: {
        container: {
          borderRadius: "20px",
          bg: "whiteAlpha.100",
          border: "1px solid",
          borderColor: "whiteAlpha.200",
          backdropFilter: "blur(10px)"
        }
      }
    }
  }
});

export default theme;
