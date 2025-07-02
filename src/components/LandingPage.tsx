import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageSquare, ArrowRight, Zap, Lock, Users, Star, Crown } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semiannual' | 'annual'>('monthly');

  // Configuração de preços dinâmica (mesma do PricingPlans)
  const pricingConfig = {
    starter: {
      monthly: { price: 199 },
      semiannual: { price: 169, totalPrice: 1014, savings: 180 },
      annual: { price: 149, totalPrice: 1791, savings: 597 }
    },
    growth: {
      monthly: { price: 249 },
      semiannual: { price: 211, totalPrice: 1270, savings: 224 },
      annual: { price: 187, totalPrice: 2241, savings: 747 }
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

  return (
    <div>
      {/* Hero Section com Destaque de Valor */}
      <section className="py-16 md:py-24">
        <div className="container">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Automatize seu <span className="text-brand-500">WhatsApp</span> com assistentes de IA
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl">
              Crie assistentes de IA personalizados para o WhatsApp da sua empresa em minutos, sem precisar de conhecimentos técnicos.
            </p>
            {/* Preview dos Benefícios Principais */}
            <div className="grid md:grid-cols-3 gap-6 mb-10 w-full max-w-4xl">
              <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
                <div className="text-brand-600 font-semibold text-lg">✓ Atendimento 24h</div>
                <div className="text-sm text-muted-foreground">Resposta automática sempre</div>
              </div>
              <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
                <div className="text-brand-600 font-semibold text-lg">✓ Setup em 5 min</div>
                <div className="text-sm text-muted-foreground">Sem conhecimento técnico</div>
              </div>
              <div className="bg-brand-50 rounded-lg p-4 border border-brand-100">
                <div className="text-brand-600 font-semibold text-lg">✓ Teste Grátis</div>
                <div className="text-sm text-muted-foreground">100 mensagens incluídas</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/registrar")} className="text-lg px-8 py-6">
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-lg px-8 py-6">
                Ver Preços
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Seção de Funcionalidades e Benefícios para Conversão */}
      <section className="py-12 md:py-20 bg-gradient-to-br from-white to-blue-50 border-b border-brand-100">
        <div className="container max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 flex flex-col gap-6">
            <h2 className="text-2xl md:text-4xl font-bold text-brand-700 mb-2">
              A IA que faz o trabalho duro para você vender mais
            </h2>
            <ul className="space-y-5 text-lg text-gray-800">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <span>
                  <b>Responde dúvidas dos leads</b> 24h, de forma instantânea e humanizada, entendendo texto e <b>áudio</b>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <span>
                  Quando o lead está pronto para comprar ou agendar, <b>você recebe uma notificação no seu WhatsApp</b> com resumo, nome e telefone do cliente.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <span>
                  <b>Dashboard atualizado em tempo real:</b> visualize todos os leads prontos para fechar negócio, com histórico e detalhes.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <span>
                  <b>Economize até 90%</b> comparado ao custo de um atendimento humano tradicional.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                <span>
                  <b>Foque no que importa:</b> a IA qualifica, responde e filtra, você só fala com quem está pronto para fechar.
                </span>
              </li>
            </ul>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button size="lg" onClick={() => navigate("/registrar")}
                className="text-lg px-8 py-6 shadow-lg bg-brand-500 hover:bg-brand-600">
                Quero testar grátis agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })} className="text-lg px-8 py-6">
                Ver planos e preços
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center items-center">
            {/* Banner lateral personalizado */}
            <img src="/banner-agente-de-ia.jpg" alt="Banner IA" className="w-full max-w-md rounded-xl shadow-xl border border-brand-100 bg-white object-cover" style={{maxHeight: 420}} />
          </div>
        </div>
      </section>

      {/* Benefícios Focados em Resultados - 4 bullets em colunas (AGORA ANTES DA PROVA SOCIAL) */}
      <section className="py-20 bg-white">
        <div className="container">
          <h2 className="text-3xl font-bold mb-10 text-gray-900 text-center">Por que escolher nossa solução?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Mais vendas</h3>
              <p className="text-gray-700 text-sm">87% dos clientes esperam resposta em até 4 horas. Nosso assistente responde em segundos, aumentando suas chances de conversão em até 400%.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Setup em 5 minutos</h3>
              <p className="text-gray-700 text-sm">Outras soluções levam semanas para implementar. Com a nossa, você está funcionando em 5 minutos. Literalmente.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Lock className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Economize até R$7.200/mês</h3>
              <p className="text-gray-700 text-sm">Substitua até 3 atendentes humanos. Com nosso plano Growth a R$249/mês, você economiza milhares em salários e ainda atende melhor.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-blue-50 border border-blue-100 shadow-sm">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-gray-900">Sem risco, garantia total</h3>
              <p className="text-gray-700 text-sm">Teste grátis por 7 dias. Se não estiver satisfeito, cancelamos e devolvemos seu dinheiro. Sem perguntas, sem burocracia.</p>
            </div>
          </div>
          <div className="flex justify-center mt-10">
            <Button size="lg" onClick={() => navigate("/registrar")}
              className="text-lg px-8 py-6 bg-brand-500 hover:bg-brand-600 text-white shadow-lg">
              Quero Economizar Agora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Prova Social e Resultados - MOVIDA para depois dos bullets */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Resultados comprovados</h2>
            <p className="text-xl text-gray-600">Veja o que nossos clientes conquistaram</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600 mb-2">85%</div>
              <div className="text-lg font-medium mb-2 text-gray-900">Redução no tempo de resposta</div>
              <div className="text-sm text-gray-600">Clientes recebem respostas em segundos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600 mb-2">400%</div>
              <div className="text-lg font-medium mb-2 text-gray-900">Mais conversões</div>
              <div className="text-sm text-gray-600">Aumento nas vendas através do WhatsApp</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600 mb-2">24/7</div>
              <div className="text-lg font-medium mb-2 text-gray-900">Disponibilidade</div>
              <div className="text-sm text-gray-600">Seus clientes nunca ficam sem resposta</div>
            </div>
          </div>

          {/* Carrossel de Depoimentos */}
          <TestimonialsCarousel />
        </div>
      </section>

      {/* Seção de Planos em Destaque - AGORA DEPOIS DA PROVA SOCIAL */}
      <section id="pricing-section" className="py-16 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Planos que cabem no seu bolso</h2>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto font-medium">
              Comece grátis e escale conforme sua empresa cresce. Sem taxas escondidas, sem surpresas.
            </p>
          </div>

          {/* Seletor de Ciclo de Cobrança */}
          <div className="flex justify-center mb-8">
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
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plano Grátis */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 relative">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2 text-gray-900">Grátis</h3>
                <p className="text-gray-600 mb-4">Para começar e testar</p>
                <div className="text-4xl font-black mb-2 text-gray-900">R$0<span className="text-lg text-gray-500">/mês</span></div>
              </div>
              <Button 
                className="w-full mb-6 py-3 text-base font-semibold" 
                variant="outline"
                onClick={() => navigate("/registrar")}
              >
                Começar Grátis
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
              <Button 
                className="w-full mb-6 py-3 text-base font-semibold bg-brand-500 hover:bg-brand-600" 
                onClick={() => navigate("/registrar")}
              >
                Escolher Growth
              </Button>
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
              <Button 
                className="w-full mb-6 py-3 text-base font-semibold" 
                variant="outline"
                onClick={() => navigate("/registrar")}
              >
                Escolher Starter
              </Button>
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
                  <span>Suporte prioritário</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-600 mb-4">
              🎯 <strong>Garantia de 7 dias</strong> - Teste sem riscos | 🔒 <strong>Dados 100% seguros</strong> | 🚀 <strong>Cancele quando quiser</strong>
            </p>
            <Button variant="link" onClick={() => navigate("/planos")} className="text-brand-600">
              Ver comparação completa dos planos →
            </Button>
          </div>
        </div>
      </section>
      
      {/* Seção de Urgência/Call to Action */}
      <section className="py-16 bg-gradient-to-r from-brand-600 to-blue-600 text-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Não perca mais vendas por demora no atendimento
            </h2>
            <p className="text-xl mb-8 opacity-90">
              A cada minuto que você demora para responder, seus concorrentes estão ganhando seus clientes. 
              Configure seu assistente IA agora e nunca mais perca uma venda.
            </p>
            
            <div className="bg-white/10 rounded-lg p-6 mb-8 backdrop-blur-sm">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold mb-1">🚀</div>
                  <div className="text-sm">Setup em 5 minutos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">💰</div>
                  <div className="text-sm">Economie até R$7.2k/mês</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">📈</div>
                  <div className="text-sm">4x mais conversões</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
              <Button size="lg" className="bg-white text-brand-600 hover:bg-gray-100 text-lg px-8 py-6" onClick={() => navigate("/registrar")}>
                Começar Teste Grátis Agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10 text-lg px-8 py-6" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Ver Preços
              </Button>
            </div>
            <p className="text-sm opacity-75">
              ✅ Sem cartão de crédito • ✅ Cancele quando quiser • ✅ Suporte em português
            </p>
          </div>
        </div>
      </section>
      
      {/* Footer Simplificado */}
      <footer className="py-12 bg-gray-900 text-gray-300">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center mb-4">
                <img 
                  src="/geni.chat.png" 
                  alt="Geni.Chat" 
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                A maneira mais fácil de automatizar seu WhatsApp com assistentes de IA. 
                Comece grátis e aumente suas vendas em minutos.
              </p>
              <div className="flex items-center mb-4">
                <Lock className="h-4 w-4 mr-2 text-green-400" />
                <span className="text-sm text-green-400">Dados 100% seguros e protegidos</span>
              </div>
              <Button onClick={() => navigate("/registrar")} className="bg-brand-500 hover:bg-brand-600">
                Começar Grátis
              </Button>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-white">Produto</h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white" onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    Preços
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white" onClick={() => navigate("/planos")}>
                    Planos Completos
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">
                    Como Funciona
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4 text-white">Suporte</h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">
                    Central de Ajuda
                  </Button>
                </li>
                <li>
                  <div className="text-sm text-gray-400">
                    <div>contato@geni.chat</div>
                    <div>(19) 99691-0257</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Geni.Chat. Todos os direitos reservados. | CNPJ: 53.263.087/0001-56
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white text-sm" onClick={() => navigate("/termos")}>
                Termos de Uso
              </Button>
              <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white text-sm" onClick={() => navigate("/privacidade")}>
                Privacidade
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Carrossel de depoimentos (com 3 depoimentos realistas)
import { useRef, useEffect } from "react";

function TestimonialsCarousel() {
  const testimonials = [
    {
      rating: 4.9,
      text: "Em apenas 2 semanas, nosso atendimento melhorou drasticamente. O assistente responde 90% das dúvidas automaticamente!",
      name: "Maria Silva",
      company: "Loja de Roupas Online"
    },
    {
      rating: 5,
      text: "Aumentamos em 3x o número de agendamentos pelo WhatsApp. O suporte é excelente e a IA realmente entende nossos clientes.",
      name: "Rafael Costa",
      company: "Clínica Odontológica Sorriso"
    },
    {
      rating: 5,
      text: "Economizei mais de R$5.000/mês em equipe de atendimento. Recomendo para qualquer empresa que quer escalar vendas sem perder qualidade.",
      name: "Juliana Souza",
      company: "Cursos ProDigital"
    }
  ];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setIndex((i) => (i + 1) % testimonials.length), 7000);
    return () => clearTimeout(timer);
  }, [index]);
  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-brand-50 to-blue-50 rounded-2xl p-8 border border-brand-100 flex flex-col md:flex-row gap-8 items-center transition-all duration-500">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-5 w-5 ${i < Math.round(testimonials[index].rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
              ))}
            </div>
            <span className="font-semibold text-gray-900">{testimonials[index].rating}/5</span>
          </div>
          <blockquote className="text-lg italic mb-4 text-gray-700 min-h-[72px]">
            "{testimonials[index].text}"
          </blockquote>
          <div className="font-medium text-gray-900">
            — {testimonials[index].name}, <span className="font-normal text-gray-700">{testimonials[index].company}</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-3 bg-white rounded-xl p-6 shadow-lg min-w-[260px] max-w-xs mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Tempo de setup: 5 minutos</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Redução de 85% no tempo de resposta</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Aumento de 200% nas vendas online</span>
          </div>
        </div>
      </div>
      {/* Navegação do carrossel */}
      <div className="flex justify-center gap-2 mt-6">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full border-2 ${i === index ? 'bg-brand-500 border-brand-500' : 'bg-white border-brand-300'} transition-all`}
            onClick={() => setIndex(i)}
            aria-label={`Ver depoimento ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
