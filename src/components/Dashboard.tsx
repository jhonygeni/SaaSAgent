
import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button-extensions";
import { AlertCircle } from "lucide-react";
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
import { useEffect, useState } from "react";
import { useConnection } from "@/context/ConnectionContext";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useAgent } from "@/context/AgentContext";

export function Dashboard() {
  const { user, checkSubscriptionStatus } = useUser();
  const { loadAgentsFromSupabase, isLoading: isLoadingAgents, agents } = useAgent();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { connectionStatus } = useConnection();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Set a maximum loading time to prevent infinite loading
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (isLoading && loadAttempts > 2) {
        console.log("Dashboard loading timed out");
        setIsLoading(false);
        setLoadError("O carregamento do dashboard demorou mais do que o esperado. Os dados podem estar incompletos.");
      }
    }, 10000); // 10 seconds max loading time
    
    return () => clearTimeout(loadingTimeout);
  }, [isLoading, loadAttempts]);
  
  // Load data when component mounts or when user changes
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        setLoadAttempts(prev => prev + 1);
        console.log(`Dashboard loading attempt ${loadAttempts + 1}`);
        
        // If user is logged in, refresh agent data from Supabase
        if (user) {
          await Promise.race([
            loadAgentsFromSupabase(), 
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Timeout loading agents")), 8000)
            )
          ]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        setLoadError("Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.");
        toast({
          title: "Erro ao carregar dashboard",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        });
        // Critical: Still set loading to false even when there's an error
        setIsLoading(false);
      }
    };
    
    loadDashboard();
    
    // Set a backup to ensure loading state is turned off even if something fails
    const backupTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Forcing dashboard loading state to complete");
        setIsLoading(false);
      }
    }, 15000); // 15 seconds absolute maximum
    
    return () => clearTimeout(backupTimeout);
  }, [user, toast, loadAgentsFromSupabase, loadAttempts]);
  
  // Check if redirected from successful checkout
  useEffect(() => {
    const checkoutSuccess = searchParams.get('checkout_success');
    
    if (checkoutSuccess && user) {
      // Refresh subscription status after successful checkout
      checkSubscriptionStatus();
      
      toast({
        title: "Assinatura ativada",
        description: "Sua assinatura foi ativada com sucesso. Aproveite seu novo plano!",
      });
    }
  }, [searchParams, user, checkSubscriptionStatus, toast]);

  // Handler to retry loading if it fails
  const handleRetryLoading = () => {
    setLoadAttempts(0);
    setLoadError(null);
    setIsLoading(true);
  };

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
        ) : loadError ? (
          // Error state
          <div className="rounded-md bg-destructive/10 p-6 flex flex-col items-center text-center">
            <AlertCircle className="h-10 w-10 text-destructive mb-4" />
            <h3 className="font-medium text-lg mb-2">Erro ao carregar o dashboard</h3>
            <p className="text-muted-foreground mb-4">{loadError}</p>
            <Button onClick={handleRetryLoading}>Tentar novamente</Button>
          </div>
        ) : (
          <>
            {/* Dashboard Analytics */}
            <div className="grid grid-cols-1 gap-6">
              <div className="w-full">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Visão Geral</h2>
                <DashboardAnalytics />
              </div>
            </div>
            
            {/* Connection Status Indicator - Only show if connectionStatus is available */}
            {connectionStatus && (
              <div className="grid grid-cols-1 gap-4">
                <Card className={`border-l-4 ${
                  connectionStatus === "connected" 
                    ? "border-l-green-500" 
                    : connectionStatus === "failed" 
                      ? "border-l-red-500" 
                      : "border-l-yellow-500"
                }`}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-base flex items-center space-x-2">
                      <span>Status WhatsApp:</span>
                      <span className={
                        connectionStatus === "connected" 
                          ? "text-green-500" 
                          : connectionStatus === "failed" 
                            ? "text-red-500" 
                            : "text-yellow-500"
                      }>
                        {connectionStatus === "connected" 
                          ? "Conectado" 
                          : connectionStatus === "failed" 
                            ? "Desconectado" 
                            : "Aguardando conexão"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}
            
            {/* Interested Clients Section - Ensure it's responsive */}
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
