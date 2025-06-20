import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
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
            <h1 className="text-4xl font-bold mb-4 text-gray-900">Política de Privacidade</h1>
            <p className="text-gray-600">
              Última atualização: 20 de junho de 2025
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="max-w-none">
              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">1. Introdução</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  A Geni.Chat está comprometida em proteger sua privacidade e dados pessoais. 
                  Esta Política de Privacidade explica como coletamos, usamos, armazenamos e 
                  protegemos suas informações quando você utiliza nossos serviços.
                </p>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                  <p className="text-gray-800"><strong>Responsável pelos dados:</strong></p>
                  <p className="text-gray-800"><strong>CNPJ:</strong> 53.263.087/0001-55</p>
                  <p className="text-gray-800"><strong>E-mail:</strong> contato@geni.chat</p>
                  <p className="text-gray-800"><strong>Telefone:</strong> (19) 99691-0257</p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">2. Informações que Coletamos</h2>
                
                <h3 className="text-xl font-semibold mb-3 text-gray-800">2.1 Informações fornecidas por você:</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Dados de cadastro:</strong> Nome, e-mail, telefone</li>
                  <li><strong>Dados de pagamento:</strong> Informações de cobrança (processadas por terceiros seguros)</li>
                  <li><strong>Configurações do assistente:</strong> Prompts, FAQs, informações da empresa</li>
                  <li><strong>Comunicações:</strong> Mensagens de suporte e feedback</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-gray-800">2.2 Informações coletadas automaticamente:</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Dados de uso:</strong> Como você interage com nossa plataforma</li>
                  <li><strong>Informações técnicas:</strong> IP, tipo de dispositivo, navegador</li>
                  <li><strong>Conversas:</strong> Mensagens processadas pelos assistentes de IA</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">3. Como Usamos suas Informações</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Utilizamos seus dados para:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Prestação de serviços:</strong> Fornecer e manter nossa plataforma</li>
                  <li><strong>Suporte:</strong> Responder suas dúvidas e resolver problemas</li>
                  <li><strong>Melhorias:</strong> Aprimorar nossos serviços e desenvolver novas funcionalidades</li>
                  <li><strong>Cobrança:</strong> Processar pagamentos e gerenciar assinaturas</li>
                  <li><strong>Comunicação:</strong> Enviar atualizações importantes sobre o serviço</li>
                  <li><strong>Conformidade:</strong> Cumprir obrigações legais e regulamentares</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">4. Base Legal para Processamento</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Processamos seus dados com base em:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Contrato:</strong> Execução dos serviços contratados</li>
                  <li><strong>Consentimento:</strong> Quando você nos autoriza expressamente</li>
                  <li><strong>Interesse legítimo:</strong> Melhorias do serviço e segurança</li>
                  <li><strong>Obrigação legal:</strong> Cumprimento de leis aplicáveis</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">5. Compartilhamento de Informações</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Não vendemos seus dados pessoais. Podemos compartilhar informações com:</p>
                
                <h3 className="text-xl font-semibold mb-3 text-gray-800">5.1 Prestadores de serviços:</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Processamento de pagamentos:</strong> Stripe, PayPal (dados de cobrança)</li>
                  <li><strong>Hospedagem:</strong> Vercel, Supabase (dados da aplicação)</li>
                  <li><strong>IA e automação:</strong> OpenAI, Evolution API (mensagens para processamento)</li>
                  <li><strong>Analytics:</strong> Ferramentas de análise para melhorar o serviço</li>
                </ul>

                <h3 className="text-xl font-semibold mb-3 text-gray-800">5.2 Circunstâncias especiais:</h3>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li>Quando exigido por lei ou ordem judicial</li>
                  <li>Para proteger nossos direitos legais</li>
                  <li>Em caso de fusão, aquisição ou venda de ativos</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">6. Segurança dos Dados</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Implementamos medidas de segurança técnicas e organizacionais:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Criptografia:</strong> Dados em trânsito e em repouso</li>
                  <li><strong>Controle de acesso:</strong> Autenticação e autorização rigorosas</li>
                  <li><strong>Monitoramento:</strong> Detecção de atividades suspeitas</li>
                  <li><strong>Backup:</strong> Sistemas de backup e recuperação</li>
                  <li><strong>Auditoria:</strong> Revisões regulares de segurança</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">7. Retenção de Dados</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Mantemos seus dados pelo tempo necessário para prestar nossos serviços e 
                  cumprir obrigações legais:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Dados da conta:</strong> Enquanto sua conta estiver ativa</li>
                  <li><strong>Conversas:</strong> Conforme configuração do usuário (padrão: 90 dias)</li>
                  <li><strong>Dados financeiros:</strong> 5 anos (conforme legislação fiscal)</li>
                  <li><strong>Logs de sistema:</strong> 12 meses para segurança e auditoria</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">8. Seus Direitos (LGPD)</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">Conforme a Lei Geral de Proteção de Dados, você tem direito a:</p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Acesso:</strong> Obter informações sobre seus dados</li>
                  <li><strong>Correção:</strong> Corrigir dados incompletos ou incorretos</li>
                  <li><strong>Exclusão:</strong> Solicitar a remoção de seus dados</li>
                  <li><strong>Portabilidade:</strong> Transferir dados para outro fornecedor</li>
                  <li><strong>Oposição:</strong> Opor-se ao processamento de dados</li>
                  <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
                  <li><strong>Informação:</strong> Saber com quem compartilhamos seus dados</li>
                </ul>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Para exercer seus direitos, entre em contato conosco através do e-mail 
                  contato@geni.chat ou telefone (19) 99691-0257.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">9. Cookies e Tecnologias Similares</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Utilizamos cookies e tecnologias similares para melhorar sua experiência:
                </p>
                <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-2">
                  <li><strong>Cookies essenciais:</strong> Necessários para funcionamento da plataforma</li>
                  <li><strong>Cookies de performance:</strong> Para análise e melhoria do serviço</li>
                  <li><strong>Cookies funcionais:</strong> Para lembrar suas preferências</li>
                </ul>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Você pode gerenciar cookies através das configurações do seu navegador.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">10. Transferências Internacionais</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Alguns de nossos prestadores de serviços podem estar localizados fora do Brasil. 
                  Garantimos que essas transferências atendam aos requisitos da LGPD e incluam 
                  salvaguardas adequadas para proteger seus dados.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">11. Menores de Idade</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Nossos serviços não são direcionados a menores de 18 anos. Não coletamos 
                  intencionalmente dados de menores. Se tomarmos conhecimento de que coletamos 
                  dados de um menor, excluiremos essas informações imediatamente.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">12. Alterações nesta Política</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos 
                  sobre alterações significativas através da plataforma ou por e-mail. 
                  Recomendamos que revise esta política regularmente.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">13. Autoridade de Proteção de Dados</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Se você tiver preocupações sobre como tratamos seus dados que não conseguimos 
                  resolver, você pode contatar a Autoridade Nacional de Proteção de Dados (ANPD):
                </p>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  <strong>Site:</strong> https://www.gov.br/anpd/pt-br
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">14. Contato e DPO</h2>
                <p className="mb-4 text-gray-700 leading-relaxed">
                  Para questões relacionadas à privacidade e proteção de dados, entre em contato:
                </p>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <p className="text-gray-800"><strong>E-mail:</strong> contato@geni.chat</p>
                  <p className="text-gray-800"><strong>Telefone:</strong> (19) 99691-0257</p>
                  <p className="text-gray-800"><strong>CNPJ:</strong> 53.263.087/0001-55</p>
                  <p className="text-gray-800"><strong>Assunto:</strong> Proteção de Dados - LGPD</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
