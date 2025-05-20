
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

export function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
        {/* Dashboard Analytics */}
        <div className="grid grid-cols-1 gap-6">
          <div className="w-full">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Visão Geral</h2>
            <DashboardAnalytics />
          </div>
        </div>
        
        {/* Interested Clients Section - Ensure it's responsive */}
        <div className="pt-2 md:pt-4">
          <InterestedClients />
        </div>
        
        {/* Agent List Section */}
        <div className="pt-2 md:pt-4">
          <AgentList />
        </div>
      </div>
    </div>
  );
}
