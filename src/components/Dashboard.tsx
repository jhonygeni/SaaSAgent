
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { formatLimit } from "@/lib/utils";
import { AgentList } from "@/components/AgentList";
import { AlertCircle, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  
  const messageUsage = user ? (user.messageCount / user.messageLimit) * 100 : 0;
  
  useEffect(() => {
    // Animate progress bar
    const timer = setTimeout(() => {
      setProgress(messageUsage);
    }, 100);
    return () => clearTimeout(timer);
  }, [messageUsage]);

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
    <div className="container mx-auto py-8">
      <div className="flex flex-col lg:flex-row gap-8 mb-8 items-start">
        <Card className="w-full lg:w-2/3">
          <CardHeader>
            <CardTitle>Bem-vindo, {user.name}!</CardTitle>
            <CardDescription>
              Gerencie seus agentes de IA e acompanhe o uso da plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Uso de mensagens</span>
                  <span className="text-sm text-muted-foreground">
                    {formatLimit(user.messageCount, user.messageLimit)}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              
              {messageUsage > 80 && (
                <div className="bg-amber-50 p-3 rounded-md text-sm text-amber-800 border border-amber-200">
                  Você está se aproximando do limite de mensagens do seu plano.
                  <Button variant="link" className="p-0 ml-1 h-auto text-amber-800 underline" onClick={() => navigate("/planos")}>
                    Faça upgrade
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex justify-between items-center w-full">
              <span className="text-sm text-muted-foreground">
                Plano: <span className="capitalize font-medium">{user.plan === "free" ? "Grátis" : user.plan}</span>
              </span>
              <Button variant="outline" size="sm" asChild>
                <span onClick={() => navigate("/planos")} className="cursor-pointer">
                  Gerenciar Plano
                  <ChevronRight className="ml-1 h-4 w-4" />
                </span>
              </Button>
            </div>
          </CardFooter>
        </Card>
        
        <Card className="w-full lg:w-1/3">
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
        </Card>
      </div>
      
      <AgentList />
    </div>
  );
}
