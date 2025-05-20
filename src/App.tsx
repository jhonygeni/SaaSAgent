
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { AgentProvider } from "@/context/AgentContext";
import { ConnectionProvider } from "@/context/ConnectionContext";
import { ThemeProvider } from "next-themes";

import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import NewAgentPage from "./pages/NewAgentPage";
import ConnectPage from "./pages/ConnectPage";
import PlansPage from "./pages/PlansPage";
import TestAgentPage from "./pages/TestAgentPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" enableSystem attribute="class">
      <TooltipProvider>
        <UserProvider>
          <AgentProvider>
            <ConnectionProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/novo-agente" element={<NewAgentPage />} />
                  <Route path="/conectar" element={<ConnectPage />} />
                  <Route path="/planos" element={<PlansPage />} />
                  <Route path="/testar/:id" element={<TestAgentPage />} />
                  <Route path="/entrar" element={<LoginPage />} />
                  <Route path="/registrar" element={<RegisterPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ConnectionProvider>
          </AgentProvider>
        </UserProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
