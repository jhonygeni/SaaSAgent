import { useUser } from "@/context/UserContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { ErrorState } from "@/components/ErrorState";

export function Dashboard() {
  const { user, checkSubscriptionStatus, isLoading: isUserLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const isMounted = useRef(true);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  // Check if redirected from successful checkout
  useEffect(() => {
    if (!isMounted.current) return;

    const checkoutSuccess = searchParams.get('checkout_success');
    if (checkoutSuccess && user) {
      checkSubscriptionStatus();
      toast({
        title: "Assinatura ativada",
        description: "Sua assinatura foi ativada com sucesso. Aproveite seu novo plano!",
      });
    }
  }, [searchParams, user, checkSubscriptionStatus, toast]);

  // Load dashboard data
  useEffect(() => {
    if (!isMounted.current || isUserLoading) return;

    const loadDashboard = async () => {
      try {
        if (!user) {
          navigate("/entrar", { replace: true });
          return;
        }

        setIsLoading(true);
        setLoadError(null);

        // Simular carregamento para evitar loop infinito
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (isMounted.current) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
        if (isMounted.current) {
          setLoadError("Não foi possível carregar os dados do dashboard");
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    // Force complete loading after timeout
    loadTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
      }
    }, 5000);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [user, isUserLoading, navigate]);

  // Loading state
  if (isUserLoading || isLoading) {
    return (
      <div className="container mx-auto p-4 md:py-8 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
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
            <Button onClick={() => navigate("/entrar", { replace: true })}>
              Fazer Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Dashboard content
  return (
    <div className="container mx-auto py-6 space-y-8">
      <DashboardHeader />
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <ErrorState
            errorMessage={loadError}
            onRetry={() => {
              if (isMounted.current) {
                setLoadError(null);
                setIsLoading(true);
              }
            }}
          />
        ) : (
          <>
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
