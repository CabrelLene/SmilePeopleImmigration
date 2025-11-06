import { ChakraProvider } from "@chakra-ui/react";
import theme from "./theme";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell";
import Landing from "./pages/Landing";
import Questionnaire from "./pages/Questionnaire";
import Result from "./pages/Result";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import UserDashboard from "./pages/dashboard/UserDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import { AuthProvider, useAuth } from "./store/auth";
import AuroraBackground from "./components/AuroraBackground";

function Private({children}:{children:any}) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}
function AdminOnly({children}:{children:any}) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <Navigate to="/" />;
}

export default function App(){
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
        <AuroraBackground />
          <Shell>
            <Routes>
              <Route path="/" element={<Landing/>}/>
              <Route path="/questionnaire" element={<Questionnaire/>}/>
              <Route path="/result" element={<Result/>}/>
              <Route path="/login" element={<Login/>}/>
              <Route path="/register" element={<Register/>}/>
              <Route path="/dashboard" element={<Private><UserDashboard/></Private>}/>
              <Route path="/admin" element={<AdminOnly><AdminDashboard/></AdminOnly>}/>
            </Routes>
          </Shell>
        </BrowserRouter>
      </AuthProvider>
    </ChakraProvider>
  );
}
