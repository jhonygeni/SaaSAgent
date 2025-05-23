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
      
      // Get the session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("No access token available");
      }

      // Call Supabase Edge Function to create Stripe checkout
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { planId: plan },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      console.log("Resposta do checkout:", { data, error });
      
      if (error) {
        console.error("Erro detalhado:", error);
        throw error;
      }
      
      if (!data?.url) {
        console.error("Resposta sem URL:", data);
        throw new Error("URL do checkout não retornada");
      }
      
      console.log("Redirecionando para:", data.url);
      window.location.href = data.url;
    } catch (err: any) {
      console.error("Erro detalhado do checkout:", err);
      
      let errorMessage = "Ocorreu um erro ao criar a sessão de pagamento. Por favor, tente novamente.";
      
      if (err?.message?.includes("STRIPE_SECRET_KEY")) {
        errorMessage = "Erro de configuração do sistema de pagamento. Por favor, contate o suporte.";
      } else if (err?.message?.includes("Rate limit")) {
        errorMessage = "Muitas tentativas de pagamento. Por favor, aguarde alguns minutos e tente novamente.";
      } else if (err?.message?.includes("Authentication")) {
        errorMessage = "Erro de autenticação. Por favor, faça login novamente.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erro ao processar pagamento",
        description: errorMessage,
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
      
      // Get the session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("No access token available");
      }

      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
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
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Escolha seu plano</h1>
        <p className="text-base text-muted-foreground max-w-xl mx-auto">
          Comece grátis e faça upgrade conforme sua empresa cresce
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Free */}
        <div className="flex flex-col items-center rounded-2xl border border-[#232A36] bg-[#111827] p-8 min-h-[480px] transition-all">
          <h3 className="font-extrabold text-2xl mb-1 text-white">Grátis</h3>
          <p className="text-sm text-neutral-400 mb-2">Para começar</p>
          <div className="text-4xl font-black text-white mb-1">R$0<span className='text-base font-normal text-neutral-400'>/mês</span></div>
          <Button className="w-full mb-4 mt-2 font-bold text-base bg-blue-600 hover:bg-blue-700 text-white" variant="default" onClick={() => handleSelectPlan("free")} disabled={isCurrentPlan("free")}>Selecionar plano</Button>
          <ul className="text-base space-y-2 text-left text-neutral-200 w-full mt-2">
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>100 mensagens/mês</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>1 agente IA</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>1 número WhatsApp conectado</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Smart bot pause</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Lead notification</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Respostas de texto e áudio</li>
          </ul>
        </div>
        {/* Growth - DESTAQUE */}
        <div className="relative flex flex-col items-center rounded-2xl border-2 border-blue-600 bg-[#151F33] p-8 min-h-[500px] scale-105 z-10 shadow-lg">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold px-4 py-1 rounded-full text-xs shadow border border-blue-400">Popular</span>
          <h3 className="font-extrabold text-2xl mb-1 text-white">Growth</h3>
          <p className="text-sm text-neutral-400 mb-2">Para empresas em expansão</p>
          <div className="text-4xl font-black text-white mb-1">R$249<span className='text-base font-normal text-neutral-400'>/mês</span></div>
          <Button className="w-full mb-4 mt-2 font-bold text-base bg-blue-600 hover:bg-blue-700 text-white" variant="default" onClick={() => handleSelectPlan("growth")} disabled={isCurrentPlan("growth") || loading !== null} loading={loading === "growth"}>Selecionar plano</Button>
          <ul className="text-base space-y-2 text-left text-neutral-200 w-full mt-2">
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>5.000 mensagens/mês</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>3 agentes IA</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>2 números WhatsApp conectados</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Smart bot pause</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Lead notification</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Respostas de texto e áudio</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Suporte prioritário</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Análise avançada de conversas</li>
          </ul>
        </div>
        {/* Starter */}
        <div className="flex flex-col items-center rounded-2xl border border-[#232A36] bg-[#111827] p-8 min-h-[480px] transition-all">
          <h3 className="font-extrabold text-2xl mb-1 text-white">Starter</h3>
          <p className="text-sm text-neutral-400 mb-2">Para pequenos negócios</p>
          <div className="text-4xl font-black text-white mb-1">R$199<span className='text-base font-normal text-neutral-400'>/mês</span></div>
          <Button className="w-full mb-4 mt-2 font-bold text-base bg-blue-600 hover:bg-blue-700 text-white" variant="default" onClick={() => handleSelectPlan("starter")} disabled={isCurrentPlan("starter") || loading !== null} loading={loading === "starter"}>Selecionar plano</Button>
          <ul className="text-base space-y-2 text-left text-neutral-200 w-full mt-2">
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>2.500 mensagens/mês</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>1 agente IA</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>1 número WhatsApp conectado</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Smart bot pause</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Lead notification</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Respostas de texto e áudio</li>
            <li className="flex items-center gap-2"><span className="text-blue-500">✓</span>Suporte prioritário</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
