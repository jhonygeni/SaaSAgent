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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semiannual' | 'annual'>('monthly');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Configurações de preços e price IDs do Stripe
  const pricingConfig = {
    starter: {
      monthly: { price: 199, priceId: 'price_1RRBDsP1QgGAc8KHzueN2CJL' },
      semiannual: { price: 169, totalPrice: 1014, savings: 180, priceId: 'price_1RUGkFP1QgGAc8KHAXICojLH' },
      annual: { price: 149, totalPrice: 1791, savings: 597, priceId: 'price_1RUGkgP1QgGAc8KHctjcrt7h' }
    },
    growth: {
      monthly: { price: 249, priceId: 'price_1RRBEZP1QgGAc8KH71uKIH6i' },
      semiannual: { price: 211, totalPrice: 1270, savings: 224, priceId: 'price_1RUAt2P1QgGAc8KHr8K4uqXG' },
      annual: { price: 187, totalPrice: 2241, savings: 747, priceId: 'price_1RUAtVP1QgGAc8KH01aRe0Um' }
    }
  };

  const getPriceDisplay = (plan: 'starter' | 'growth') => {
    const config = pricingConfig[plan][billingCycle];
    switch (billingCycle) {
      case 'monthly':
        return `R$${config.price}/mês`;
      case 'semiannual':
        return `R$${config.price}/mês`;
      case 'annual':
        return `R$${config.price}/mês`;
    }
  };

  const getSubtitle = (plan: 'starter' | 'growth') => {
    const config = pricingConfig[plan][billingCycle];
    switch (billingCycle) {
      case 'monthly':
        return 'Cobrança mensal';
      case 'semiannual':
        return `Pagamento único de R$${(config as any).totalPrice} • Economize R$${(config as any).savings}`;
      case 'annual':
        return `Pagamento único de R$${(config as any).totalPrice} • Economize R$${(config as any).savings}`;
    }
  };

  const handleSelectPlan = async (plan: "free" | "starter" | "growth") => {
    // Verificar se o usuário está autenticado (se não estiver, redirecione para login em vez de registro)
    // Isso evita um possível loop quando o usuário acabou de se registrar
    if (!user) {
      toast({
        title: "Ação necessária",
        description: "Por favor, faça login antes de selecionar um plano.",
      });
      navigate("/entrar");
      return;
    }
    
    // Garante que temos uma sessão válida antes de continuar
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        toast({
          title: "Sessão expirada",
          description: "Sua sessão expirou. Por favor, faça login novamente.",
        });
        navigate("/entrar");
        return;
      }
    } catch (sessionError) {
      console.error("Erro ao verificar sessão:", sessionError);
      toast({
        title: "Erro de autenticação",
        description: "Não foi possível verificar sua sessão. Por favor, faça login novamente.",
      });
      navigate("/entrar");
      return;
    }
    
    if (plan === "free") {
      try {
        setPlan(plan);
        toast({
          title: "Plano atualizado",
          description: "Você está utilizando o plano Grátis.",
        });
        navigate("/dashboard");
      } catch (error) {
        console.error("Erro ao atualizar plano:", error);
        toast({
          title: "Erro ao atualizar plano",
          description: "Não foi possível atualizar seu plano. Por favor, tente novamente.",
        });
      }
      return;
    }
    
    try {
      setLoading(plan);
      console.log("Iniciando checkout para plano:", plan, "ciclo:", billingCycle);
      
      // Get the session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("No access token available");
      }

      // Determinar o price ID baseado no plano e ciclo de cobrança
      const priceId = pricingConfig[plan as 'starter' | 'growth'][billingCycle].priceId;
      console.log("Price ID selecionado:", priceId);

      // Call Supabase Edge Function to create Stripe checkout
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { 
          planId: plan,
          priceId: priceId,
          billingCycle: billingCycle
        },
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
        
        {/* Seletor de ciclo de cobrança */}
        <div className="flex flex-col items-center">
          <div className="flex justify-center items-center gap-4 mt-8">
            <div className={`px-4 py-2 rounded-full cursor-pointer transition-all ${billingCycle === 'monthly' 
              ? 'bg-blue-600 text-white font-semibold' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`} 
              onClick={() => setBillingCycle('monthly')}>
              Mensal
            </div>
            <div className={`px-4 py-2 rounded-full cursor-pointer transition-all ${billingCycle === 'semiannual' 
              ? 'bg-blue-600 text-white font-semibold' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              onClick={() => setBillingCycle('semiannual')}>
              Semestral
              <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">-15%</span>
            </div>
            <div className={`px-4 py-2 rounded-full cursor-pointer transition-all ${billingCycle === 'annual' 
              ? 'bg-blue-600 text-white font-semibold' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
              onClick={() => setBillingCycle('annual')}>
              Anual
              <span className="ml-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">-25%</span>
            </div>
          </div>
          <div className="mt-2 mb-4 text-sm text-neutral-400">
            {billingCycle === 'monthly' && 'Cobrança mensal sem compromisso. Cancele a qualquer momento.'}
            {billingCycle === 'semiannual' && 'Pagamento único a cada 6 meses com desconto especial.'}
            {billingCycle === 'annual' && 'Melhor valor! Pagamento único anual com economia máxima.'}
          </div>
        </div>
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
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white font-bold px-4 py-1 rounded-full text-xl shadow border border-blue-400">Popular</span>
          <h3 className="font-extrabold text-2xl mb-1 text-white">Growth</h3>
          <p className="text-sm text-neutral-400 mb-2">Para empresas em expansão</p>
          <div className="text-4xl font-black text-white mb-1">
            R${pricingConfig.growth[billingCycle].price}
            <span className='text-base font-normal text-neutral-400'>/mês</span>
          </div>
          <p className="text-xs text-neutral-400 h-8 text-center">
            {getSubtitle('growth')}
          </p>
          {isCurrentPlan("growth") ? (
            <Button 
              className="w-full mb-4 mt-2 font-bold text-base bg-green-600 hover:bg-green-700 text-white" 
              variant="default" 
              onClick={openCustomerPortal}
              disabled={loading !== null}
              loading={loading === "manage"}
            >
              Gerenciar assinatura
            </Button>
          ) : (
            <Button 
              className="w-full mb-4 mt-2 font-bold text-base bg-blue-600 hover:bg-blue-700 text-white" 
              variant="default" 
              onClick={() => handleSelectPlan("growth")} 
              disabled={loading !== null} 
              loading={loading === "growth"}
            >
              Selecionar plano
            </Button>
          )}
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
          <div className="text-4xl font-black text-white mb-1">
            R${pricingConfig.starter[billingCycle].price}
            <span className='text-base font-normal text-neutral-400'>/mês</span>
          </div>
          <p className="text-xs text-neutral-400 h-8 text-center">
            {getSubtitle('starter')}
          </p>
          {isCurrentPlan("starter") ? (
            <Button 
              className="w-full mb-4 mt-2 font-bold text-base bg-green-600 hover:bg-green-700 text-white" 
              variant="default" 
              onClick={openCustomerPortal}
              disabled={loading !== null}
              loading={loading === "manage"}
            >
              Gerenciar assinatura
            </Button>
          ) : (
            <Button 
              className="w-full mb-4 mt-2 font-bold text-base bg-blue-600 hover:bg-blue-700 text-white" 
              variant="default" 
              onClick={() => handleSelectPlan("starter")} 
              disabled={loading !== null} 
              loading={loading === "starter"}
            >
              Selecionar plano
            </Button>
          )}
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
