
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "@/context/UserContext";
import { AgentProvider } from "@/context/AgentContext";
import { ConnectionProvider } from "@/context/ConnectionContext";
import { ThemeProvider } from "next-themes";
import { logStep } from "@/utils/diagnostic";
import { memo, useMemo } from "react";

import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import NewAgentPage from "./pages/NewAgentPage";
import ConnectPage from "./pages/ConnectPage";
import PlansPage from "./pages/PlansPage";
import TestAgentPage from "./pages/TestAgentPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import NotFound from "./pages/NotFound";
import UserProfilePage from "./pages/UserProfilePage";
import EmailConfirmationPage from "./pages/EmailConfirmationPage";
import EmailConfirmSuccessPage from "./pages/EmailConfirmSuccessPage";
import ResendConfirmationPage from "./pages/ResendConfirmationPage";
import { DebugDashboard } from "@/components/DebugDashboard";

// Query client singleton para evitar re-criações
const queryClient = logStep('Query Client Creation', () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        console.log(`Query failed ${failureCount} times:`, error);
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Evita refetches desnecessários
      refetchOnMount: false, // Evita refetches desnecessários
    },
  },
}));

import injectAuthDebugger from "@/utils/injectAuthDebugger";
import { AuthDiagnosticButton } from "@/components/AuthDiagnosticButton";

// Injeta o debugger em desenvolvimento apenas uma vez
if (process.env.NODE_ENV !== 'production') {
  injectAuthDebugger();
}

// Memoizar as rotas para evitar re-renders desnecessários
const AppRoutes = memo(() => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/debug-dashboard" element={<DebugDashboard />} />
    <Route path="/novo-agente" element={<NewAgentPage />} />
    <Route path="/conectar" element={<ConnectPage />} />
    <Route path="/planos" element={<PlansPage />} />
    <Route path="/testar/:id" element={<TestAgentPage />} />
    <Route path="/entrar" element={<LoginPage />} />
    <Route path="/registrar" element={<RegisterPage />} />
    <Route path="/perfil" element={<UserProfilePage />} />
    <Route path="/confirmar-email" element={<EmailConfirmationPage />} />
    <Route path="/confirmar-email-sucesso" element={<EmailConfirmSuccessPage />} />
    <Route path="/reenviar-confirmacao" element={<ResendConfirmationPage />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
));

AppRoutes.displayName = 'AppRoutes';

const App = memo(() => {
  console.log('🎯 App: Renderizando componente (otimizado)');
  
  // Memoizar componentes de debug para desenvolvimento
  const debugComponents = useMemo(() => {
    if (process.env.NODE_ENV === 'production') return null;
    
    return <AuthDiagnosticButton />;
  }, []);
  
  return logStep('App Component Render', () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" enableSystem attribute="class">
        <TooltipProvider>
          <UserProvider>
            <AgentProvider>
              <ConnectionProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  {debugComponents}
                  <AppRoutes />
                </BrowserRouter>
              </ConnectionProvider>
            </AgentProvider>
          </UserProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  ));
});

App.displayName = 'App';

export default App;
