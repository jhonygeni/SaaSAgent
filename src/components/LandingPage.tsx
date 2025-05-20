
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, MessageSquare, ArrowRight, Zap, Lock, Users } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="container">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Automatize seu <span className="text-brand-500">WhatsApp</span> com assistentes de IA
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl">
              Crie assistentes de IA personalizados para o WhatsApp da sua empresa em minutos, sem precisar de conhecimentos técnicos.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={() => navigate("/registrar")}>
                Começar Gratuitamente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/planos")}>
                Ver Planos
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-16">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mb-6">
                <MessageSquare className="h-8 w-8 text-brand-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">1. Crie seu agente</h3>
              <p className="text-muted-foreground">
                Personalize seu assistente de IA com informações sobre sua empresa, FAQs e muito mais.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-brand-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">2. Conecte com WhatsApp</h3>
              <p className="text-muted-foreground">
                Conecte facilmente sua conta do WhatsApp Business escaneando um QR code.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-brand-100 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-brand-500" />
              </div>
              <h3 className="text-xl font-bold mb-3">3. Atenda seus clientes</h3>
              <p className="text-muted-foreground">
                Seu agente de IA irá automaticamente responder às perguntas dos clientes 24/7.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Benefícios para seu negócio</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-brand-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-lg">Atendimento 24 horas</h3>
                    <p className="text-muted-foreground">
                      Seu assistente está sempre disponível para responder perguntas dos clientes, mesmo fora do horário comercial.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-brand-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-lg">Economia de tempo</h3>
                    <p className="text-muted-foreground">
                      Automatize respostas para perguntas frequentes e libere sua equipe para tarefas mais complexas.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-brand-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-lg">Mais vendas</h3>
                    <p className="text-muted-foreground">
                      Responda rapidamente às perguntas dos clientes e aumente suas chances de conversão.
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-brand-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-lg">Fácil de configurar</h3>
                    <p className="text-muted-foreground">
                      Comece em minutos, sem conhecimentos técnicos necessários.
                    </p>
                  </div>
                </li>
              </ul>
              <div className="mt-8">
                <Button onClick={() => navigate("/registrar")}>
                  Começar Agora
                  <ArrowRight className="ml-2 h-4 w-4" />
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
      
      {/* Plans CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experimente gratuitamente e descubra como os agentes de IA podem transformar o atendimento da sua empresa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/registrar")}>
              Criar Conta Grátis
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/planos")}>
              Conhecer Planos
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 bg-background border-t">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-xl mb-4">WhatSaaS</h3>
              <p className="text-muted-foreground mb-4">
                Automatize seu WhatsApp com assistentes de IA personalizados.
              </p>
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Dados 100% seguros</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-4">Produto</h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground">
                    Recursos
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground" onClick={() => navigate("/planos")}>
                    Planos
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground">
                    Casos de uso
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Suporte</h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground">
                    Central de Ajuda
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground">
                    Contato
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground">
                    FAQ
                  </Button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground">
                    Termos de Uso
                  </Button>
                </li>
                <li>
                  <Button variant="link" className="p-0 h-auto text-muted-foreground">
                    Privacidade
                  </Button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-6 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} WhatSaaS. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
