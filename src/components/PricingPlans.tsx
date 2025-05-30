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
          <div className="flex justify-center items-center gap-2 mt-8 bg-gray-800/50 p-2 rounded-xl backdrop-blur-sm border border-gray-700">
            <button 
              className={`px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium ${billingCycle === 'monthly' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`} 
              onClick={() => setBillingCycle('monthly')}>
              Mensal
            </button>
            <button 
              className={`px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium relative ${billingCycle === 'semiannual' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
              onClick={() => setBillingCycle('semiannual')}>
              Semestral
              <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">-15%</span>
            </button>
            <button 
              className={`px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium relative ${billingCycle === 'annual' 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700/50'}`}
              onClick={() => setBillingCycle('annual')}>
              Anual
              <span className="absolute -top-2 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">-25%</span>
            </button>
          </div>
          <div className="mt-4 mb-6 text-sm text-neutral-400 max-w-md text-center">
            {billingCycle === 'monthly' && '💳 Cobrança mensal sem compromisso. Cancele a qualquer momento.'}
            {billingCycle === 'semiannual' && '💰 Pagamento único a cada 6 meses com desconto especial.'}
            {billingCycle === 'annual' && '🎯 Melhor valor! Pagamento único anual com economia máxima.'}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        {/* Free */}
        <div className="flex flex-col items-center rounded-2xl border border-[#232A36] bg-gradient-to-br from-[#111827] to-[#1F2937] p-8 min-h-[480px] transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/50 hover:border-gray-600">
          <div className="mb-4 p-3 rounded-full bg-gray-700/50">
            <span className="text-2xl">🚀</span>
          </div>
          <h3 className="font-extrabold text-2xl mb-1 text-white">Grátis</h3>
          <p className="text-sm text-neutral-400 mb-4">Para começar</p>
          <div className="text-4xl font-black text-white mb-4">R$0<span className='text-base font-normal text-neutral-400'>/mês</span></div>
          <Button 
            className="w-full mb-6 mt-2 font-bold text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg transition-all duration-300 hover:shadow-blue-600/25" 
            variant="default" 
            onClick={() => handleSelectPlan("free")} 
            disabled={isCurrentPlan("free")}>
            {isCurrentPlan("free") ? "✓ Plano Atual" : "Começar Grátis"}
          </Button>
          <ul className="text-sm space-y-3 text-left text-neutral-200 w-full">
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>100 mensagens/mês</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>1 agente IA</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>1 número WhatsApp conectado</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>Smart bot pause</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>Lead notification</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>Respostas de texto e áudio</li>
          </ul>
        </div>
        {/* Growth - DESTAQUE */}
        <div className="relative flex flex-col items-center rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-[#151F33] to-[#1E293B] p-8 min-h-[500px] scale-105 z-10 shadow-2xl shadow-blue-600/20 transition-all duration-300 hover:shadow-blue-600/30">
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold px-6 py-2 rounded-full text-sm shadow-lg border border-blue-400 animate-pulse">
            ⭐ Mais Popular
          </span>
          <div className="mb-4 p-3 rounded-full bg-blue-600/20 border border-blue-500/30">
            <span className="text-2xl">🚀</span>
          </div>
          <h3 className="font-extrabold text-2xl mb-1 text-white">Growth</h3>
          <p className="text-sm text-blue-300 mb-2">Para empresas em expansão</p>
          <div className="text-4xl font-black text-white mb-1">
            <span className="bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent">
              R${pricingConfig.growth[billingCycle].price}
            </span>
            <span className='text-base font-normal text-neutral-400'>/mês</span>
          </div>
          <p className="text-xs text-blue-400 h-8 text-center font-medium">
            {getSubtitle('growth')}
          </p>
          {isCurrentPlan("growth") ? (
            <Button 
              className="w-full mb-6 mt-2 font-bold text-base bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all duration-300 hover:shadow-green-500/25" 
              variant="default" 
              onClick={openCustomerPortal}
              disabled={loading !== null}
              loading={loading === "manage"}
            >
              ⚙️ Gerenciar Assinatura
            </Button>
          ) : (
            <Button 
              className="w-full mb-6 mt-2 font-bold text-base bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all duration-300 hover:shadow-blue-500/25 hover:scale-105" 
              variant="default" 
              onClick={() => handleSelectPlan("growth")} 
              disabled={loading !== null} 
              loading={loading === "growth"}
            >
              🚀 Começar Growth
            </Button>
          )}
          <ul className="text-sm space-y-3 text-left text-neutral-200 w-full">
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>5.000 mensagens/mês</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>3 agentes IA</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>2 números WhatsApp conectados</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>Smart bot pause</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>Lead notification</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>Respostas de texto e áudio</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>Suporte prioritário</li>
            <li className="flex items-center gap-3"><span className="text-blue-400 text-lg">✓</span>Análise avançada de conversas</li>
          </ul>
        </div>
        {/* Starter */}
        <div className="flex flex-col items-center rounded-2xl border border-[#232A36] bg-gradient-to-br from-[#111827] to-[#1F2937] p-8 min-h-[480px] transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/50 hover:border-gray-600">
          <div className="mb-4 p-3 rounded-full bg-orange-600/20 border border-orange-500/30">
            <span className="text-2xl">💼</span>
          </div>
          <h3 className="font-extrabold text-2xl mb-1 text-white">Starter</h3>
          <p className="text-sm text-orange-300 mb-2">Para pequenos negócios</p>
          <div className="text-4xl font-black text-white mb-1">
            <span className="bg-gradient-to-r from-orange-400 to-orange-300 bg-clip-text text-transparent">
              R${pricingConfig.starter[billingCycle].price}
            </span>
            <span className='text-base font-normal text-neutral-400'>/mês</span>
          </div>
          <p className="text-xs text-orange-400 h-8 text-center font-medium">
            {getSubtitle('starter')}
          </p>
          {isCurrentPlan("starter") ? (
            <Button 
              className="w-full mb-6 mt-2 font-bold text-base bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all duration-300 hover:shadow-green-500/25" 
              variant="default" 
              onClick={openCustomerPortal}
              disabled={loading !== null}
              loading={loading === "manage"}
            >
              ⚙️ Gerenciar Assinatura
            </Button>
          ) : (
            <Button 
              className="w-full mb-6 mt-2 font-bold text-base bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all duration-300 hover:shadow-orange-500/25 hover:scale-105" 
              variant="default" 
              onClick={() => handleSelectPlan("starter")} 
              disabled={loading !== null} 
              loading={loading === "starter"}
            >
              💼 Começar Starter
            </Button>
          )}
          <ul className="text-sm space-y-3 text-left text-neutral-200 w-full">
            <li className="flex items-center gap-3"><span className="text-orange-400 text-lg">✓</span>2.500 mensagens/mês</li>
            <li className="flex items-center gap-3"><span className="text-orange-400 text-lg">✓</span>1 agente IA</li>
            <li className="flex items-center gap-3"><span className="text-orange-400 text-lg">✓</span>1 número WhatsApp conectado</li>
            <li className="flex items-center gap-3"><span className="text-orange-400 text-lg">✓</span>Smart bot pause</li>
            <li className="flex items-center gap-3"><span className="text-orange-400 text-lg">✓</span>Lead notification</li>
            <li className="flex items-center gap-3"><span className="text-orange-400 text-lg">✓</span>Respostas de texto e áudio</li>
            <li className="flex items-center gap-3"><span className="text-orange-400 text-lg">✓</span>Suporte prioritário</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
