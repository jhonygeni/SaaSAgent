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
import { resetSubscriptionCache } from "@/lib/subscription-throttle";

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
        setIsLoading(false);
        if (loadAttempts > 2) {
          setForceShowContent(true);
        }
      }
    }, 5000);
    
    return () => clearTimeout(loadingTimeout);
  }, [isLoading, loadAttempts]);
  
  // Load data when component mounts or when user changes
  useEffect(() => {
    if (dashboardLoadedRef.current && agents.length > 0) {
      setIsLoading(false);
      return;
    }
    
    const loadDashboard = async () => {
      try {
        if (isUserLoading) {
          return;
        }
        
        setIsLoading(true);
        setLoadError(null);
        setLoadAttempts(prev => prev + 1);
        
        if (!user && loadAttempts >= 2) {
          navigate("/entrar");
          return;
        }
        
        if (user && loadAttempts < 3) {
          try {
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Tempo limite excedido")), 5000)
            );
            
            await Promise.race([
              loadAgentsFromSupabase(),
              timeoutPromise
            ]);
            
            dashboardLoadedRef.current = true;
          } catch (loadError) {
            console.error("Erro ao carregar agentes:", loadError);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        setLoadError("Não foi possível carregar os dados do dashboard. Tente novamente mais tarde.");
        setIsLoading(false);
        
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
    
    const backupTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setForceShowContent(true);
      }
    }, 10000);
    
    return () => clearTimeout(backupTimeout);
  }, [user, toast, loadAgentsFromSupabase, isUserLoading, navigate, loadAttempts, agents.length]);

  const handleRetryLoading = () => {
    setLoadAttempts(0);
    setLoadError(null);
    setIsLoading(true);
    setForceShowContent(false);
    dashboardLoadedRef.current = false;
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
    <div className="container mx-auto py-6 space-y-8">
      <DashboardHeader />
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : loadError && !forceShowContent ? (
          <ErrorState
            errorMessage="Não foi possível carregar os dados do dashboard. Por favor, tente novamente."
            onRetry={handleRetryLoading}
          />
        ) : (
          <>
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
            
            <div className="grid grid-cols-1 gap-6">
              <div className="w-full">
                <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Visão Geral</h2>
                <DashboardAnalytics />
              </div>
            </div>
            
            <div className="pt-2 md:pt-4">
              <InterestedClients />
            </div>
            
            <div className="pt-2 md:pt-4">
              <AgentList />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
