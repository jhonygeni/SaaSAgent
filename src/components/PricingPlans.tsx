import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { useToast } from "@/hooks/use-toast";
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

  const getSubtitle = (plan: 'starter' | 'growth') => {
    const config = pricingConfig[plan][billingCycle];
    switch (billingCycle) {
      case 'monthly':
        return <span className="text-neutral-400">Cobrança mensal</span>;
      case 'semiannual':
        return (
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Pagamento único de R${(config as any).totalPrice}</div>
            <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              VOCÊ ECONOMIZA R${(config as any).savings}
            </div>
          </div>
        );
      case 'annual':
        return (
          <div className="space-y-1">
            <div className="text-sm text-gray-500">Pagamento único de R${(config as any).totalPrice}</div>
            <div className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md">
              VOCÊ ECONOMIZA R${(config as any).savings}
            </div>
          </div>
        );
    }
  };

  // Função para chamar o backend seguro
  const secureCheckout = async (checkoutData: any, token: string) => {
    const response = await fetch("/api/evolution/create-checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(checkoutData)
    });
    const data = await response.json();
    return data;
  };

  const handleSelectPlan = async (plan: "free" | "starter" | "growth") => {
    try {
      setLoading(plan);
      
      // Get the session first
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) {
        throw new Error("Você precisa estar logado para assinar um plano");
      }

      // Determine price ID based on plan and billing cycle
      const selectedPlan = plan as 'starter' | 'growth';
      const priceConfig = pricingConfig[selectedPlan][billingCycle];
      const priceId = priceConfig.priceId;

      // Prepare checkout data
      const checkoutData = {
        planId: plan,
        priceId: priceId,
        billingCycle: billingCycle
      };

      // Chama o backend seguro
      const data = await secureCheckout(checkoutData, sessionData.session.access_token);

      if (!data?.url) {
        console.error("Resposta sem URL do Stripe:", data);
        throw new Error("URL do checkout não retornada");
      }

      // Redirect to Stripe
      window.location.href = data.url;

    } catch (err: any) {
      console.error("❌ Erro no checkout:", err);
      
      let errorMessage = "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.";
      
      if (err?.message?.includes("logado")) {
        errorMessage = "Você precisa estar logado para assinar um plano.";
      } else if (err?.message?.includes("URL do checkout")) {
        errorMessage = "Erro ao criar sessão de pagamento. Por favor, tente novamente.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      
      toast({
        variant: "destructive",
        title: "Erro no checkout",
        description: errorMessage,
      });
    } finally {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
            Escolha seu plano
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Planos flexíveis que crescem com o seu negócio. Comece grátis e escale conforme sua necessidade.
          </p>
        </div>

        {/* Seletor de Ciclo de Cobrança */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-xl p-1 shadow-lg border border-gray-200">
            <button 
              className={`px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium ${
                billingCycle === 'monthly' 
                ? 'bg-brand-500 text-white shadow-lg' 
                : 'text-gray-600 hover:text-brand-600 hover:bg-gray-50'
              }`}
              onClick={() => setBillingCycle('monthly')}>
              Mensal
            </button>
            <button 
              className={`px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium ${
                billingCycle === 'semiannual' 
                ? 'bg-brand-500 text-white shadow-lg' 
                : 'text-gray-600 hover:text-brand-600 hover:bg-gray-50'
              }`}
              onClick={() => setBillingCycle('semiannual')}>
              Semestral
            </button>
            <button 
              className={`px-6 py-3 rounded-lg cursor-pointer transition-all duration-300 text-sm font-medium ${
                billingCycle === 'annual' 
                ? 'bg-brand-500 text-white shadow-lg' 
                : 'text-gray-600 hover:text-brand-600 hover:bg-gray-50'
              }`}
              onClick={() => setBillingCycle('annual')}>
              Anual
            </button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plano Grátis */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 relative">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Grátis</h3>
              <p className="text-gray-600 mb-4">Para começar e testar</p>
              <div className="text-4xl font-black mb-2 text-gray-900">
                R$0<span className="text-lg text-gray-500">/mês</span>
              </div>
              <div className="min-h-[60px] flex items-center justify-center">
                <span className="text-neutral-400">Para sempre grátis</span>
              </div>
            </div>
            <Button 
              className="w-full mb-6 py-3 text-base font-semibold" 
              variant="outline"
              onClick={() => handleSelectPlan("free")}
              disabled={isCurrentPlan("free")}
            >
              {isCurrentPlan("free") ? "✓ Plano Atual" : "Começar Grátis"}
            </Button>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>100 mensagens/mês</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>1 agente de IA</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>1 WhatsApp conectado</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Suporte por email</span>
              </li>
            </ul>
          </div>

          {/* Plano Growth - DESTAQUE */}
          <div className="bg-white rounded-2xl border-2 border-brand-500 p-8 relative scale-105 shadow-lg">
            {/* Tag "Mais Popular" */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1 whitespace-nowrap">
              <Crown className="h-4 w-4" />
              <span>Mais Popular</span>
            </div>
            
            {/* Tag de Desconto */}
            {billingCycle === 'semiannual' && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                -15%
              </div>
            )}
            {billingCycle === 'annual' && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                -25%
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Growth</h3>
              <p className="text-gray-600 mb-4">Para empresas em crescimento</p>
              <div className="text-4xl font-black text-brand-600 mb-2">
                R${pricingConfig.growth[billingCycle].price}<span className="text-lg text-gray-500">/mês</span>
              </div>
              <div className="min-h-[60px] flex items-center justify-center">
                {getSubtitle('growth')}
              </div>
            </div>
            {isCurrentPlan("growth") ? (
              <Button 
                className="w-full mb-6 py-3 text-base font-semibold bg-green-500 hover:bg-green-600" 
                onClick={openCustomerPortal}
                disabled={loading !== null}
              >
                ⚙️ Gerenciar Assinatura
              </Button>
            ) : (
              <Button 
                className="w-full mb-6 py-3 text-base font-semibold bg-brand-500 hover:bg-brand-600" 
                onClick={() => handleSelectPlan("growth")}
                disabled={loading !== null}
              >
                Escolher Growth
              </Button>
            )}
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span><strong>5.000</strong> mensagens/mês</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span><strong>3</strong> agentes de IA</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span><strong>2</strong> WhatsApps conectados</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Suporte prioritário</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Análise de conversas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>API de integração</span>
              </li>
            </ul>
          </div>

          {/* Plano Starter */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 relative">
            {/* Tag de Desconto */}
            {billingCycle === 'semiannual' && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                -15%
              </div>
            )}
            {billingCycle === 'annual' && (
              <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
                -25%
              </div>
            )}
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2 text-gray-900">Starter</h3>
              <p className="text-gray-600 mb-4">Para pequenos negócios</p>
              <div className="text-4xl font-black mb-2 text-gray-900">
                R${pricingConfig.starter[billingCycle].price}<span className="text-lg text-gray-500">/mês</span>
              </div>
              <div className="min-h-[60px] flex items-center justify-center">
                {getSubtitle('starter')}
              </div>
            </div>
            {isCurrentPlan("starter") ? (
              <Button 
                className="w-full mb-6 py-3 text-base font-semibold bg-green-500 hover:bg-green-600" 
                onClick={openCustomerPortal}
                disabled={loading !== null}
              >
                ⚙️ Gerenciar Assinatura
              </Button>
            ) : (
              <Button 
                className="w-full mb-6 py-3 text-base font-semibold" 
                variant="outline"
                onClick={() => handleSelectPlan("starter")}
                disabled={loading !== null}
              >
                Escolher Starter
              </Button>
            )}
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span><strong>2.500</strong> mensagens/mês</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>1 agente de IA</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>1 WhatsApp conectado</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Suporte por email</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Análises básicas</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Seção de garantias e comparação */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-600 mb-4">
            🎯 <strong>Garantia de 7 dias</strong> - Teste sem riscos | 🔒 <strong>Dados 100% seguros</strong> | 🚀 <strong>Cancele quando quiser</strong>
          </p>
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Todos os planos incluem:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Setup em 5 minutos</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Atendimento 24/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Integração WhatsApp Business</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span>Dashboard em tempo real</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ rápido */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900">Perguntas Frequentes</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-semibold mb-2 text-gray-900">Posso cancelar a qualquer momento?</h4>
              <p className="text-sm text-gray-600">Sim, você pode cancelar seu plano a qualquer momento sem taxas ou multas.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-semibold mb-2 text-gray-900">Como funciona a garantia?</h4>
              <p className="text-sm text-gray-600">Oferecemos 7 dias de garantia total. Se não ficar satisfeito, devolvemos 100% do valor.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-semibold mb-2 text-gray-900">Posso trocar de plano?</h4>
              <p className="text-sm text-gray-600">Sim, você pode fazer upgrade ou downgrade do seu plano a qualquer momento.</p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h4 className="font-semibold mb-2 text-gray-900">Preciso de conhecimentos técnicos?</h4>
              <p className="text-sm text-gray-600">Não! Nossa plataforma é 100% no-code. Você configura tudo em minutos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
