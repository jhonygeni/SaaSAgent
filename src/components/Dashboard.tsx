
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
  const { loadAgentsFromSupabase, isLoading: isLoadingAgents } = useAgent();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { connectionStatus } = useConnection();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams] = useSearchParams();
  
  // Load data when component mounts or when user changes
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        // If user is logged in, refresh agent data from Supabase
        if (user) {
          await loadAgentsFromSupabase();
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading dashboard:", error);
        toast({
          title: "Erro ao carregar dashboard",
          description: "Não foi possível carregar os dados do dashboard.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };
    
    loadDashboard();
  }, [user, toast, loadAgentsFromSupabase]);
  
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
        {isLoading || isLoadingAgents ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
