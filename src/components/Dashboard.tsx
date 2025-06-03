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
import { supabase } from "@/integrations/supabase/client";

const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;

export function Dashboard() {
  const { user, checkSubscriptionStatus, isLoading: isUserLoading } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const isMounted = useRef(true);
  const loadTimeoutRef = useRef<NodeJS.Timeout>();
  const authChecked = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

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

  // Verificar autenticação com retry
  useEffect(() => {
    const checkAuth = async () => {
      if (!isMounted.current || authChecked.current || retryCount.current >= maxRetries) return;
      
      try {
        console.log(`Tentativa ${retryCount.current + 1} de verificar autenticação`);
        
        // Verificar se temos uma sessão armazenada
        const storedSession = localStorage.getItem(storageKey);
        if (!storedSession) {
          throw new Error("Sessão não encontrada");
        }

        // Tentar obter a sessão atual
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (!session) {
          if (retryCount.current < maxRetries - 1) {
            console.log("Sem sessão, tentando novamente em 1 segundo");
            retryCount.current++;
            setTimeout(checkAuth, 1000);
            return;
          }
          throw new Error("Sem sessão após todas as tentativas");
        }
        
        // Tentar atualizar o token
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.warn("Erro ao atualizar token:", refreshError);
        } else if (refreshData.session) {
          console.log("Token atualizado com sucesso");
        }
        
        console.log("Sessão encontrada:", session.user.email);
        authChecked.current = true;
        
        if (isMounted.current) {
          setIsLoading(false);
          await checkSubscriptionStatus();
        }
      } catch (error: any) {
        console.error("Erro ao verificar autenticação:", error);
        if (retryCount.current < maxRetries - 1) {
          console.log("Erro na verificação, tentando novamente em 1 segundo");
          retryCount.current++;
          setTimeout(checkAuth, 1000);
        } else {
          if (isMounted.current) {
            setLoadError("Erro ao verificar autenticação");
            // Limpar tokens e redirecionar para login
            localStorage.removeItem(storageKey);
            localStorage.removeItem('auth_token');
            navigate("/entrar", { replace: true });
          }
        }
      }
    };

    checkAuth();
  }, [navigate, checkSubscriptionStatus]);

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
    if (!isMounted.current || isUserLoading || !authChecked.current) return;

    const loadDashboard = async () => {
      try {
        if (!user) {
          navigate("/entrar", { replace: true });
          return;
        }

        setIsLoading(true);
        setLoadError(null);

        // Simular carregamento para evitar loop infinito
        await new Promise(resolve => setTimeout(resolve, 1500));
        
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

    // Força completar carregamento após timeout
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
  if (isUserLoading || (isLoading && !authChecked.current)) {
    return (
      <div className="container mx-auto p-4 md:py-8 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p>Verificando sessão{retryCount.current > 0 ? ` (Tentativa ${retryCount.current}/${maxRetries})` : ""}...</p>
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
                retryCount.current = 0;
                authChecked.current = false;
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
