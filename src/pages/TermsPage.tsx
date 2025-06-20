import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow py-12">
        <div className="container max-w-4xl mx-auto">
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao início
            </Button>
            <h1 className="text-4xl font-bold mb-4">Termos de Uso</h1>
            <p className="text-muted-foreground">
              Última atualização: 20 de junho de 2025
            </p>
          </div>

          <div className="max-w-none text-gray-900">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Aceitação dos Termos</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                Ao acessar e usar os serviços da Geni.Chat, você concorda em cumprir e ficar 
                vinculado a estes Termos de Uso. Se você não concordar com qualquer parte 
                destes termos, não deverá usar nossos serviços.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Sobre a Geni.Chat</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                A Geni.Chat é uma plataforma de automação de WhatsApp com assistentes de IA, 
                operada pela empresa:
              </p>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                <p className="text-gray-800"><strong>CNPJ:</strong> 53.263.087/0001-55</p>
                <p className="text-gray-800"><strong>E-mail:</strong> contato@geni.chat</p>
                <p className="text-gray-800"><strong>Telefone:</strong> (19) 99691-0257</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Descrição dos Serviços</h2>
              <p className="mb-4 text-gray-700 leading-relaxed">
                A Geni.Chat oferece serviços de automação de atendimento via WhatsApp através 
                de assistentes de inteligência artificial, incluindo:
              </p>
              <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                <li>Criação e configuração de assistentes de IA</li>
                <li>Integração com WhatsApp para atendimento automatizado</li>
                <li>Dashboard para gerenciamento de conversas e estatísticas</li>
                <li>Suporte técnico e orientação para uso da plataforma</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Cadastro e Conta do Usuário</h2>
              <p className="mb-4">
                Para utilizar nossos serviços, você deve criar uma conta fornecendo informações 
                precisas e atualizadas. Você é responsável por:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Manter a confidencialidade de sua senha</li>
                <li>Todas as atividades realizadas em sua conta</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Uso Aceitável</h2>
              <p className="mb-4">Você concorda em não usar nossos serviços para:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Atividades ilegais ou que violem regulamentações aplicáveis</li>
                <li>Envio de spam, conteúdo malicioso ou não solicitado</li>
                <li>Violar direitos de propriedade intelectual de terceiros</li>
                <li>Interferir no funcionamento da plataforma</li>
                <li>Compartilhar conteúdo ofensivo, discriminatório ou inadequado</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Planos e Pagamentos</h2>
              <p className="mb-4">
                Os serviços da Geni.Chat são oferecidos em diferentes planos de assinatura. 
                Os valores e condições estão disponíveis em nosso site. O pagamento deve ser 
                realizado conforme as condições do plano escolhido.
              </p>
              <p className="mb-4">
                Oferecemos período de teste gratuito conforme especificado em cada plano. 
                O cancelamento pode ser feito a qualquer momento através da plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Política de Cancelamento</h2>
              <p className="mb-4">
                Você pode cancelar sua assinatura a qualquer momento. O cancelamento será 
                efetivo ao final do período de cobrança atual. Não oferecemos reembolsos 
                proporcionais, exceto quando exigido por lei.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Propriedade Intelectual</h2>
              <p className="mb-4">
                Todos os direitos de propriedade intelectual relacionados à plataforma 
                Geni.Chat são de nossa propriedade ou de nossos licenciadores. Você mantém 
                os direitos sobre o conteúdo que carrega na plataforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Limitação de Responsabilidade</h2>
              <p className="mb-4">
                A Geni.Chat não se responsabiliza por danos indiretos, incidentais ou 
                consequenciais decorrentes do uso de nossos serviços. Nossa responsabilidade 
                total não excederá o valor pago pelos serviços nos últimos 12 meses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Disponibilidade dos Serviços</h2>
              <p className="mb-4">
                Embora nos esforcemos para manter nossos serviços disponíveis 24/7, não 
                garantimos disponibilidade ininterrupta. Reservamo-nos o direito de realizar 
                manutenções programadas com aviso prévio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Modificações dos Termos</h2>
              <p className="mb-4">
                Podemos atualizar estes Termos de Uso periodicamente. As alterações serão 
                comunicadas através da plataforma ou por e-mail. O uso continuado dos serviços 
                após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Lei Aplicável</h2>
              <p className="mb-4">
                Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa será 
                resolvida nos tribunais competentes do Brasil.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contato</h2>
              <p className="mb-4">
                Para dúvidas sobre estes Termos de Uso, entre em contato conosco:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>E-mail:</strong> contato@geni.chat</p>
                <p><strong>Telefone:</strong> (19) 99691-0257</p>
                <p><strong>CNPJ:</strong> 53.263.087/0001-55</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
