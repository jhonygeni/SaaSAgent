import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPage = () => {
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
            <h1 className="text-4xl font-bold mb-4">Política de Privacidade</h1>
            <p className="text-muted-foreground">
              Última atualização: 20 de junho de 2025
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introdução</h2>
              <p className="mb-4">
                A Geni.Chat está comprometida em proteger sua privacidade e dados pessoais. 
                Esta Política de Privacidade explica como coletamos, usamos, armazenamos e 
                protegemos suas informações quando você utiliza nossos serviços.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p><strong>Responsável pelos dados:</strong></p>
                <p><strong>CNPJ:</strong> 53.263.087/0001-55</p>
                <p><strong>E-mail:</strong> contato@geni.chat</p>
                <p><strong>Telefone:</strong> (19) 99691-0257</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Informações que Coletamos</h2>
              
              <h3 className="text-xl font-semibold mb-3">2.1 Informações fornecidas por você:</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Dados de cadastro:</strong> Nome, e-mail, telefone</li>
                <li><strong>Dados de pagamento:</strong> Informações de cobrança (processadas por terceiros seguros)</li>
                <li><strong>Configurações do assistente:</strong> Prompts, FAQs, informações da empresa</li>
                <li><strong>Comunicações:</strong> Mensagens de suporte e feedback</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">2.2 Informações coletadas automaticamente:</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Dados de uso:</strong> Como você interage com nossa plataforma</li>
                <li><strong>Dados técnicos:</strong> Endereço IP, tipo de navegador, sistema operacional</li>
                <li><strong>Conversas do WhatsApp:</strong> Mensagens processadas pelos assistentes de IA</li>
                <li><strong>Métricas de performance:</strong> Estatísticas de uso dos assistentes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Como Usamos suas Informações</h2>
              <p className="mb-4">Utilizamos suas informações para:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Prestação do serviço:</strong> Operar e manter a plataforma de automação</li>
                <li><strong>Personalização:</strong> Customizar assistentes de IA conforme suas necessidades</li>
                <li><strong>Suporte:</strong> Fornecer atendimento técnico e resolver problemas</li>
                <li><strong>Melhorias:</strong> Aprimorar nossos serviços e desenvolver novas funcionalidades</li>
                <li><strong>Cobrança:</strong> Processar pagamentos e gerenciar assinaturas</li>
                <li><strong>Comunicação:</strong> Enviar atualizações importantes sobre o serviço</li>
                <li><strong>Conformidade:</strong> Cumprir obrigações legais e regulamentares</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Base Legal para Processamento</h2>
              <p className="mb-4">Processamos seus dados com base em:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Contrato:</strong> Execução dos serviços contratados</li>
                <li><strong>Consentimento:</strong> Quando você nos autoriza expressamente</li>
                <li><strong>Interesse legítimo:</strong> Melhorias do serviço e segurança</li>
                <li><strong>Obrigação legal:</strong> Cumprimento de leis aplicáveis</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Compartilhamento de Informações</h2>
              <p className="mb-4">Não vendemos seus dados pessoais. Podemos compartilhar informações com:</p>
              
              <h3 className="text-xl font-semibold mb-3">5.1 Prestadores de serviços:</h3>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Processamento de pagamentos:</strong> Stripe, PayPal (dados de cobrança)</li>
                <li><strong>Hospedagem:</strong> Vercel, Supabase (dados da aplicação)</li>
                <li><strong>IA e automação:</strong> OpenAI, Evolution API (mensagens para processamento)</li>
                <li><strong>Analytics:</strong> Ferramentas de análise para melhorar o serviço</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">5.2 Circunstâncias especiais:</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Quando exigido por lei ou ordem judicial</li>
                <li>Para proteger nossos direitos legais</li>
                <li>Em caso de fusão, aquisição ou venda de ativos</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Segurança dos Dados</h2>
              <p className="mb-4">Implementamos medidas de segurança técnicas e organizacionais:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Criptografia:</strong> Dados em trânsito e em repouso</li>
                <li><strong>Controle de acesso:</strong> Autenticação e autorização rigorosas</li>
                <li><strong>Monitoramento:</strong> Detecção de atividades suspeitas</li>
                <li><strong>Backup:</strong> Sistemas de backup e recuperação</li>
                <li><strong>Auditoria:</strong> Revisões regulares de segurança</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Retenção de Dados</h2>
              <p className="mb-4">
                Mantemos seus dados pelo tempo necessário para prestar nossos serviços e 
                cumprir obrigações legais:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Dados da conta:</strong> Enquanto sua conta estiver ativa</li>
                <li><strong>Conversas:</strong> Conforme configuração do usuário (padrão: 90 dias)</li>
                <li><strong>Dados financeiros:</strong> 5 anos (conforme legislação fiscal)</li>
                <li><strong>Logs de sistema:</strong> 12 meses para segurança e auditoria</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Seus Direitos (LGPD)</h2>
              <p className="mb-4">Conforme a Lei Geral de Proteção de Dados, você tem direito a:</p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Acesso:</strong> Obter informações sobre seus dados</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                <li><strong>Exclusão:</strong> Solicitar a remoção de seus dados</li>
                <li><strong>Portabilidade:</strong> Transferir dados para outro fornecedor</li>
                <li><strong>Oposição:</strong> Opor-se ao processamento de dados</li>
                <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
                <li><strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
              </ul>
              <p className="mb-4">
                Para exercer seus direitos, entre em contato conosco através do e-mail 
                contato@geni.chat ou telefone (19) 99691-0257.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Cookies e Tecnologias Similares</h2>
              <p className="mb-4">
                Utilizamos cookies e tecnologias similares para melhorar sua experiência:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li><strong>Cookies essenciais:</strong> Necessários para funcionamento da plataforma</li>
                <li><strong>Cookies de performance:</strong> Para análise e melhoria do serviço</li>
                <li><strong>Cookies funcionais:</strong> Para lembrar suas preferências</li>
              </ul>
              <p className="mb-4">
                Você pode gerenciar cookies através das configurações do seu navegador.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Transferências Internacionais</h2>
              <p className="mb-4">
                Alguns de nossos prestadores de serviços podem estar localizados fora do Brasil. 
                Garantimos que essas transferências atendam aos requisitos da LGPD e incluam 
                salvaguardas adequadas para proteger seus dados.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Menores de Idade</h2>
              <p className="mb-4">
                Nossos serviços não são direcionados a menores de 18 anos. Não coletamos 
                intencionalmente dados de menores. Se tomarmos conhecimento de que coletamos 
                dados de um menor, excluiremos essas informações imediatamente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Alterações nesta Política</h2>
              <p className="mb-4">
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
                sobre alterações significativas através da plataforma ou por e-mail. 
                Recomendamos que revise esta política regularmente.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Autoridade de Proteção de Dados</h2>
              <p className="mb-4">
                Se você tiver preocupações sobre como tratamos seus dados que não conseguimos 
                resolver, você pode contatar a Autoridade Nacional de Proteção de Dados (ANPD):
              </p>
              <p className="mb-4">
                <strong>Site:</strong> https://www.gov.br/anpd/pt-br
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">14. Contato e DPO</h2>
              <p className="mb-4">
                Para questões relacionadas à privacidade e proteção de dados, entre em contato:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p><strong>E-mail:</strong> contato@geni.chat</p>
                <p><strong>Telefone:</strong> (19) 99691-0257</p>
                <p><strong>CNPJ:</strong> 53.263.087/0001-55</p>
                <p><strong>Assunto:</strong> Proteção de Dados - LGPD</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
