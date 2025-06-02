import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button-extensions";
import { AlertCircle, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AgentList } from "@/components/AgentList";
import { DashboardHeader } from "@/components/DashboardHeader";
import { DashboardAnalytics } from "@/components/DashboardAnalytics";
import { InterestedClients } from "@/components/InterestedClients";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useState, useRef } from "react";
import { useConnection } from "@/context/ConnectionContext";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useAgent } from "@/context/AgentContext";
import { ErrorState } from "@/components/ErrorState";
import { throttledSubscriptionCheck, resetSubscriptionCache } from "@/lib/subscription-throttle";
import { WhatsAppStatusCard } from "@/components/WhatsAppStatusCard";

export function Dashboard() {
  const { user, checkSubscriptionStatus, isLoading: isUserLoading } = useUser();
  const { loadAgentsFromSupabase, isLoading: isLoadingAgents, agents } = useAgent();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { connectionStatus } = useConnection();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [forceShowContent, setForceShowContent] = useState(false);
  const dashboardLoadedRef = useRef(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Check if redirected from successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get('checkout_success');
    
    if (checkoutSuccess && user) {
      // Limpar cache antes de recarregar status da assinatura
      resetSubscriptionCache();
      
      // Refresh subscription status after successful checkout
      checkSubscriptionStatus();
      
      toast({
        title: "Assinatura ativada",
        description: "Sua assinatura foi ativada com sucesso. Aproveite seu novo plano!",
      });
    }
  }, [searchParams, user, checkSubscriptionStatus, toast]);
  
  // Force complete loading after a timeout to prevent infinite spinner
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Dashboard loading timed out - forcing completion");
        setIsLoading(false);
        if (loadAttempts > 2) {
          setForceShowContent(true); // Force show content even with errors
        }
      }
    }, 5000); // Optimized from 8 seconds to 5 seconds max loading time
    
    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);
  
  // Load data when component mounts or when user changes
  useEffect(() => {
    // Evitar recarregar se já carregamos com sucesso anteriormente
    if (dashboardLoadedRef.current && agents.length > 0) {
      console.log("Dashboard já carregado anteriormente, ignorando nova carga");
      setIsLoading(false);
      return;
    }
    
    const loadDashboard = async () => {
      try {
        // Não iniciar carregamento caso o usuário esteja sendo carregado
        if (isUserLoading) {
          console.log("Usuário ainda está carregando, aguardando...");
          return;
        }
        
        setIsLoading(true);
        setLoadError(null);
        setLoadAttempts(prev => prev + 1);
        console.log(`Dashboard loading attempt ${loadAttempts + 1}`);
        
        // Se não temos usuário após várias tentativas, redirecione para login
        if (!user && loadAttempts >= 2) {
          console.warn("Usuário não encontrado após múltiplas tentativas, redirecionando para login");
          navigate("/entrar");
          return;
        }
        
        // Only try to load agents if we have a user and we haven't exceeded max attempts
        if (user && loadAttempts < 3) {
          try {
            // Set a timeout promise to race against the agent loading
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Dashboard loading timed out")), 5000)
            );
            
            // Race between actual loading and timeout - if timeout wins, we catch the error below
            await Promise.race([
              loadAgentsFromSupabase(),
              timeoutPromise
            ]);
            
            // Marcar como carregado para evitar recargas desnecessárias
            dashboardLoadedRef.current = true;
          } catch (loadError) {
            console.error("Failed to load agents:", loadError);
            // Don't set error state yet - we'll still show the dashboard
            // Just log it and continue
          }
        }
        
        // Always complete loading, regardless of errors
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setLoadError("Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.");
        
        // Critical: Still set loading to false even when there's an error
        setIsLoading(false);
        
        // Only show toast for first few attempts to avoid spamming the user
        if (loadAttempts <= 2) {
          toast({
            title: "Erro ao carregar dashboard",
            description: "Tentando mostrar o conteúdo disponível.",
            variant: "destructive",
          });
        }
      }
    };
    
    loadDashboard();
    
    // Set a backup to ensure loading state is turned off even if something fails
    const backupTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Forcing dashboard loading state to complete");
        setIsLoading(false);
        setForceShowContent(true);
      }
    }, 10000); // 10 seconds absolute maximum
    
    return () => clearTimeout(backupTimeout);
  }, [user, toast, loadAgentsFromSupabase, isUserLoading, navigate]);

  // Handler to retry loading if it fails
  const handleRetryLoading = () => {
    setLoadAttempts(0);
    setLoadError(null);
    setIsLoading(true);
    setForceShowContent(false);
    dashboardLoadedRef.current = false; // Reset the loaded state
    
    // Limpar cache antes de recarregar
    resetSubscriptionCache();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await checkSubscriptionStatus();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Se o usuário ainda está carregando, mostre um indicador de carregamento
  if (isUserLoading) {
    return (
      <div className="container mx-auto p-4 md:py-8 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Verificando sessão...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 md:py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span>Acesso não autorizado</span>
            </CardTitle>
            <CardDescription>
              Você precisa estar logado para acessar o dashboard.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/entrar")}>
              Fazer Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto py-4 md:py-6 space-y-6 md:space-y-8 px-4 md:px-6">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground text-sm">Carregando dashboard...</p>
            {loadAttempts > 1 && (
              <p className="text-xs text-muted-foreground">Tentativa {loadAttempts}...</p>
            )}
          </div>
        ) : loadError && !forceShowContent ? (
          // Error state - but only show if we're not forcing content
          <div className="rounded-md bg-destructive/10 p-6">
            <ErrorState 
              errorMessage={loadError}
              isAuthError={false}
              onRetry={handleRetryLoading}
            />
          </div>
        ) : (
          <>
            {/* Show warning if there were errors but we're forcing content */}
            {loadError && forceShowContent && (
              <div className="rounded-md bg-amber-50 p-4 text-amber-800 mb-4 border border-amber-200">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-sm">Atenção: Alguns dados podem não estar disponíveis</h3>
                    <p className="text-xs mt-1">Ocorreu um erro ao carregar dados completos do dashboard. Mostrando conteúdo disponível.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200 px-2 py-1 h-auto text-xs"
                      onClick={handleRetryLoading}
                    >
                      Tentar recarregar
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Dashboard Analytics - even if there are errors, try to show what we can */}
            <div className="grid grid-cols-1 gap-6">
              <div className="w-full">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Visão Geral</h2>
                <DashboardAnalytics />
              </div>
            </div>
            
            {/* WhatsApp Status Card */}
            <div className="grid grid-cols-1 gap-4">
              <WhatsAppStatusCard />
            </div>
            
            {/* Interested Clients Section */}
            <div className="pt-2 md:pt-4">
              <InterestedClients />
            </div>
            
            {/* Agent List Section */}
            <div className="pt-2 md:pt-4">
              <AgentList />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
