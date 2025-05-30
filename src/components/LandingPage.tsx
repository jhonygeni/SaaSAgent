
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

      {/* Seção de Planos em Destaque */}
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
      
      {/* Prova Social e Resultados */}
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
              <div className="text-4xl font-bold text-brand-600 mb-2">3x</div>
              <div className="text-lg font-medium mb-2 text-gray-900">Mais conversões</div>
              <div className="text-sm text-gray-600">Aumento nas vendas através do WhatsApp</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600 mb-2">24/7</div>
              <div className="text-lg font-medium mb-2 text-gray-900">Disponibilidade</div>
              <div className="text-sm text-gray-600">Seus clientes nunca ficam sem resposta</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-brand-50 to-blue-50 rounded-2xl p-8 border border-brand-100">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="font-semibold text-gray-900">4.9/5</span>
                </div>
                <blockquote className="text-lg italic mb-4 text-gray-700">
                  "Em apenas 2 semanas, nosso atendimento melhorou drasticamente. O assistente responde 90% das dúvidas automaticamente!"
                </blockquote>
                <div className="font-medium text-gray-900">
                  — Maria Silva, Loja de Roupas Online
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="space-y-3">
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
            </div>
          </div>
        </div>
      </section>

      {/* Como Funciona - Simplificado */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-4">Configure em 3 passos simples</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Sem complicação, sem código, sem dor de cabeça. Seu assistente IA estará funcionando em minutos.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-brand-500 rounded-full flex items-center justify-center mb-6 text-white font-bold text-xl">
                1
              </div>
              <h3 className="text-xl font-bold mb-3">Crie sua conta</h3>
              <p className="text-muted-foreground">
                Cadastre-se grátis e personalize seu assistente com as informações da sua empresa.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-brand-500 rounded-full flex items-center justify-center mb-6 text-white font-bold text-xl">
                2
              </div>
              <h3 className="text-xl font-bold mb-3">Conecte o WhatsApp</h3>
              <p className="text-muted-foreground">
                Escaneie um QR code e conecte sua conta do WhatsApp Business em segundos.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-brand-500 rounded-full flex items-center justify-center mb-6 text-white font-bold text-xl">
                3
              </div>
              <h3 className="text-xl font-bold mb-3">Comece a vender</h3>
              <p className="text-muted-foreground">
                Seu assistente já está atendendo clientes 24h e convertendo mais vendas.
              </p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate("/registrar")} className="text-lg px-8 py-6">
              Começar Agora - É Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground mt-3">Sem cartão de crédito • Sem compromisso • Cancele quando quiser</p>
          </div>
        </div>
      </section>
      
      {/* Benefícios Focados em Resultados */}
      <section className="py-20 bg-white">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-gray-900">Por que escolher nossa solução?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">Resposta instantânea = Mais vendas</h3>
                    <p className="text-gray-600">
                      87% dos clientes esperam resposta em até 4 horas. Nosso assistente responde em segundos, 
                      aumentando suas chances de conversão em até 300%.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">Setup em 5 minutos</h3>
                    <p className="text-gray-600">
                      Outras soluções levam semanas para implementar. Com a nossa, você está funcionando 
                      em 5 minutos. Literalmente.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">Economize até R$15.000/mês</h3>
                    <p className="text-gray-600">
                      Substitua até 3 atendentes humanos. Com nosso plano Growth a R$249/mês, 
                      você economiza milhares em salários e ainda atende melhor.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2 text-gray-900">Sem risco, garantia total</h3>
                    <p className="text-gray-600">
                      Teste grátis por 7 dias. Se não estiver satisfeito, cancelamos e devolvemos 
                      seu dinheiro. Sem perguntas, sem burocacia.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Button size="lg" onClick={() => navigate("/registrar")} className="text-lg px-8 py-6">
                  Quero Economizar Agora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-brand-100 to-brand-50 p-8 border">
              <div className="aspect-video bg-white rounded-lg shadow-lg p-6 flex items-center justify-center">
                <div className="max-w-xs w-full">
                  <div className="flex gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-brand-500" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded-full w-3/4"></div>
                      <div className="h-4 bg-muted rounded-full w-1/2"></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted"></div>
                      <div className="bg-muted rounded-lg p-3 flex-1">
                        <div className="h-3 bg-muted-foreground/20 rounded-full w-full mb-2"></div>
                        <div className="h-3 bg-muted-foreground/20 rounded-full w-4/5"></div>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <div className="bg-brand-500 rounded-lg p-3 flex-1 max-w-[80%]">
                        <div className="h-3 bg-white/20 rounded-full w-full mb-2"></div>
                        <div className="h-3 bg-white/20 rounded-full w-4/5"></div>
                        <div className="h-3 bg-white/20 rounded-full w-3/5 mt-2"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-muted"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                  <div className="text-sm">Economie até R$15k/mês</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">📈</div>
                  <div className="text-sm">3x mais conversões</div>
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
                  <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">
                    Contato
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white">
                    WhatsApp: (11) 99999-9999
                  </Button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Geni.Chat. Todos os direitos reservados.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white text-sm">
                Termos de Uso
              </Button>
              <Button variant="link" className="p-0 h-auto text-gray-400 hover:text-white text-sm">
                Privacidade
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
