
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function PricingPlans() {
  const { user, setPlan } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSelectPlan = async (plan: "free" | "starter" | "growth") => {
    if (!user) {
      navigate("/registrar");
      return;
    }
    
    if (plan === "free") {
      setPlan(plan);
      toast({
        title: "Plano atualizado",
        description: "Você está utilizando o plano Grátis.",
      });
      navigate("/dashboard");
      return;
    }
    
    setLoading(plan);
    
    // Simulate payment processing
    setTimeout(() => {
      setPlan(plan);
      setLoading(null);
      toast({
        title: "Plano atualizado com sucesso",
        description: `Você agora está utilizando o plano ${plan === "starter" ? "Starter" : "Growth"}.`,
      });
      navigate("/dashboard");
    }, 2000);
  };

  const isCurrentPlan = (plan: string) => {
    return user?.plan === plan;
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comece grátis e faça upgrade conforme sua empresa cresce
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Plano Free */}
        <div className={`rounded-xl border ${isCurrentPlan("free") ? "border-brand-500 bg-brand-50/50 shadow-md" : ""} overflow-hidden`}>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-2xl mb-1">Grátis</h3>
                <p className="text-muted-foreground">Para começar</p>
              </div>
              {isCurrentPlan("free") && (
                <div className="bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Atual
                </div>
              )}
            </div>
            <div className="mt-6 mb-6">
              <span className="text-4xl font-bold">R$0</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <Button 
              className="w-full mb-6" 
              variant={isCurrentPlan("free") ? "secondary" : "default"}
              onClick={() => handleSelectPlan("free")}
              disabled={isCurrentPlan("free")}
            >
              {isCurrentPlan("free") ? "Plano atual" : "Selecionar plano"}
            </Button>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>100 mensagens/mês</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>1 agente IA</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>1 número WhatsApp conectado</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Smart bot pause</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Lead notification</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Respostas de texto e áudio</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Plano Starter */}
        <div className={`rounded-xl border ${isCurrentPlan("starter") ? "border-brand-500 bg-brand-50/50 shadow-md" : ""} overflow-hidden`}>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-2xl mb-1">Starter</h3>
                <p className="text-muted-foreground">Para pequenos negócios</p>
              </div>
              {isCurrentPlan("starter") && (
                <div className="bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Atual
                </div>
              )}
            </div>
            <div className="mt-6 mb-6">
              <span className="text-4xl font-bold">R$199</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <Button 
              className="w-full mb-6" 
              variant={isCurrentPlan("starter") ? "secondary" : "default"}
              onClick={() => handleSelectPlan("starter")}
              disabled={isCurrentPlan("starter") || loading !== null}
              loading={loading === "starter"}
            >
              {loading === "starter" ? "Processando..." : 
               isCurrentPlan("starter") ? "Plano atual" : "Selecionar plano"}
            </Button>
            <ul className="space-y-3">
              <li className="flex items-center font-medium">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>2.500 mensagens/mês</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>1 agente IA</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>1 número WhatsApp conectado</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Smart bot pause</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Lead notification</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Respostas de texto e áudio</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Suporte prioritário</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Plano Growth */}
        <div className={`rounded-xl border ${isCurrentPlan("growth") ? "border-brand-500 bg-brand-50/50 shadow-md" : ""} overflow-hidden relative`}>
          <div className="absolute -top-4 inset-x-0 flex justify-center">
            <div className="bg-brand-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Popular
            </div>
          </div>
          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-2xl mb-1">Growth</h3>
                <p className="text-muted-foreground">Para empresas em expansão</p>
              </div>
              {isCurrentPlan("growth") && (
                <div className="bg-brand-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                  Atual
                </div>
              )}
            </div>
            <div className="mt-6 mb-6">
              <span className="text-4xl font-bold">R$249</span>
              <span className="text-muted-foreground">/mês</span>
            </div>
            <Button 
              className="w-full mb-6" 
              variant={isCurrentPlan("growth") ? "secondary" : "default"}
              onClick={() => handleSelectPlan("growth")}
              disabled={isCurrentPlan("growth") || loading !== null}
              loading={loading === "growth"}
            >
              {loading === "growth" ? "Processando..." : 
               isCurrentPlan("growth") ? "Plano atual" : "Selecionar plano"}
            </Button>
            <ul className="space-y-3">
              <li className="flex items-center font-medium">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>5.000 mensagens/mês</span>
              </li>
              <li className="flex items-center font-medium">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>3 agentes IA</span>
              </li>
              <li className="flex items-center font-medium">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>2 números WhatsApp conectados</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Smart bot pause</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Lead notification</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Respostas de texto e áudio</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-center">
                <Check className="h-4 w-4 mr-2 text-brand-500" />
                <span>Análise avançada de conversas</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
