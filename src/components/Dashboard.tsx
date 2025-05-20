
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

export function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container mx-auto py-8">
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
    <div className="flex flex-col min-h-screen">
      <DashboardHeader />
      <div className="container mx-auto py-8 space-y-8 px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold mb-6">Visão Geral</h2>
            <DashboardAnalytics />
          </div>
          
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Dicas Rápidas</CardTitle>
                <CardDescription>
                  Como melhorar seus agentes de IA
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                    <div className="bg-primary/10 rounded-full p-1 h-5 w-5 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-medium text-primary">1</span>
                    </div>
                    <span className="text-sm">Adicione pelo menos 5 perguntas frequentes para melhorar as respostas</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="bg-primary/10 rounded-full p-1 h-5 w-5 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-medium text-primary">2</span>
                    </div>
                    <span className="text-sm">Forneça informações detalhadas sobre sua empresa e serviços</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="bg-primary/10 rounded-full p-1 h-5 w-5 flex items-center justify-center mt-0.5">
                      <span className="text-xs font-medium text-primary">3</span>
                    </div>
                    <span className="text-sm">Teste seu agente regularmente para verificar a qualidade das respostas</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => navigate("/planos")} className="w-full">
                  Faça upgrade para mais recursos
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        
        <div className="pt-4">
          <InterestedClients />
        </div>
        
        <div className="pt-4">
          <AgentList />
        </div>
      </div>
    </div>
  );
}
