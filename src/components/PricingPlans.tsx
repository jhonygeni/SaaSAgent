import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function PricingPlans() {
  const { user, setPlan } = useUser();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    
    try {
      setLoading(plan);
      console.log("Iniciando checkout para plano:", plan);
      
      // Call Supabase Edge Function to create Stripe checkout
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId: plan },
      });

      console.log("Resposta do checkout:", { data, error });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.url) {
        throw new Error("No checkout URL returned");
      }
      
      console.log("Redirecionando para:", data.url);
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: `Ocorreu um erro ao criar a sessão de pagamento: ${err.message}. Por favor, tente novamente.`,
      });
      setLoading(null);
    }
  };

  const isCurrentPlan = (plan: string) => {
    return user?.plan === plan;
  };

  const openCustomerPortal = async () => {
    if (!user) return;
    
    try {
      setLoading("manage");
      console.log("Abrindo portal do cliente");
      
      const { data, error } = await supabase.functions.invoke("customer-portal", {});
      console.log("Resposta do portal:", { data, error });
      
      if (error) {
        throw new Error(error.message);
      }

      if (!data?.url) {
        throw new Error("No portal URL returned");
      }
      
      console.log("Redirecionando para portal:", data.url);
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Customer portal error:", err);
      toast({
        variant: "destructive",
        title: "Erro ao abrir portal",
        description: `Não foi possível abrir o portal de gerenciamento: ${err.message}. Tente novamente.`,
      });
      setLoading(null);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Escolha seu plano</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Comece grátis e faça upgrade conforme sua empresa cresce
        </p>
      </div>

      {user && user.plan !== "free" && (
        <div className="mb-8 max-w-5xl mx-auto">
          <div className="bg-muted/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-medium">Gerenciar sua assinatura atual</h3>
              <p className="text-sm text-muted-foreground">
                Atualize seu método de pagamento ou cancele sua assinatura
              </p>
            </div>
            <Button 
              onClick={openCustomerPortal} 
              disabled={loading === "manage"}
              loading={loading === "manage"}
            >
              Gerenciar Assinatura
            </Button>
          </div>
        </div>
      )}

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
