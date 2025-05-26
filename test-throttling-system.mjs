/**
 * Testes de verificação do sistema anti-looping HTTP
 * Arquivo para testar a eficácia das implementações de throttling
 */
import { throttledSubscriptionCheck } from './src/lib/subscription-throttle';
import { throttleApiCall } from './src/lib/api-throttle';
import { supabase } from './src/integrations/supabase/client';

// Mock de função que simula uma chamada API
const mockApiCall = async (name: string) => {
  console.log(`🔴 CHAMADA REAL a API: ${name}`);
  await new Promise(resolve => setTimeout(resolve, 200));
  return { success: true, data: { name } };
};

// Testa o throttling de subscription
async function testSubscriptionThrottle() {
  console.log("\n----- TESTE DE THROTTLING DE SUBSCRIPTION -----\n");
  
  // Cria função throttled para o usuário 1
  const checkUser1 = throttledSubscriptionCheck(
    () => mockApiCall("user1-subscription-check"), 
    { userId: 'user1' }
  );
  
  // Cria função throttled para o usuário 2
  const checkUser2 = throttledSubscriptionCheck(
    () => mockApiCall("user2-subscription-check"),
    { userId: 'user2' }
  );
  
  // Faz múltiplas chamadas para testar caching
  console.log("1ª chamada - Usuário 1:");
  await checkUser1();
  
  console.log("\n1ª chamada - Usuário 2:");
  await checkUser2();
  
  console.log("\n2ª chamada - Usuário 1 (deveria usar cache):");
  await checkUser1();
  
  console.log("\n2ª chamada - Usuário 2 (deveria usar cache):");
  await checkUser2();
}

// Testa o throttling de API geral
async function testApiThrottle() {
  console.log("\n----- TESTE DE THROTTLING DE API GERAL -----\n");
  
  // Cria função throttled para mensagens
  const getMessages = throttleApiCall(
    async ({ agentId }) => {
      return mockApiCall(`messages-for-agent-${agentId}`);
    },
    'get_messages',
    { interval: 10000, logLabel: 'Messages' }
  );
  
  // Testa várias chamadas
  console.log("1ª chamada - Mensagens para Agente 1:");
  await getMessages({ agentId: 'agent1' });
  
  console.log("\n1ª chamada - Mensagens para Agente 2:");
  await getMessages({ agentId: 'agent2' });
  
  console.log("\n2ª chamada - Mensagens para Agente 1 (deveria usar cache):");
  await getMessages({ agentId: 'agent1' });
  
  console.log("\n2ª chamada - Mensagens para Agente 2 (deveria usar cache):");
  await getMessages({ agentId: 'agent2' });
  
  // Testa chamadas com parâmetros diferentes
  console.log("\n1ª chamada - Mensagens para Agente 1 com parâmetro diferente:");
  await getMessages({ agentId: 'agent1', page: 2 });
}

// Testa chamadas reais para verificar throttling em produção
async function testLiveSupabaseConnection() {
  console.log("\n----- TESTE DE CONEXÃO SUPABASE COM THROTTLING -----\n");
  
  // Cria função throttled para consulta Supabase
  const getProfileThrottled = throttleApiCall(
    async ({ userId }) => {
      console.log(`🔴 CHAMADA REAL ao Supabase: profiles para ${userId}`);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .limit(1);
        
      if (error) throw error;
      return data;
    },
    'get_profile',
    { interval: 5000, logLabel: 'Profiles' }
  );
  
  try {
    // Chamada inicial
    console.log("1ª chamada - Perfil de usuário:");
    const result1 = await getProfileThrottled({ userId: 'abc123' });
    console.log("Resultado:", result1 ? 'Dados recebidos' : 'Sem dados');
    
    // Segunda chamada (deveria usar cache)
    console.log("\n2ª chamada - Perfil de usuário (deveria usar cache):");
    const result2 = await getProfileThrottled({ userId: 'abc123' });
    console.log("Resultado:", result2 ? 'Dados recebidos' : 'Sem dados');
    
    // Terceira chamada após pequeno delay (ainda deveria usar cache)
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log("\n3ª chamada - Perfil de usuário (após 2s, ainda deveria usar cache):");
    const result3 = await getProfileThrottled({ userId: 'abc123' });
    console.log("Resultado:", result3 ? 'Dados recebidos' : 'Sem dados');
    
    // Quarta chamada após delay mais longo (deveria fazer nova chamada)
    await new Promise(resolve => setTimeout(resolve, 6000));
    console.log("\n4ª chamada - Perfil de usuário (após 6s, deveria fazer nova chamada):");
    const result4 = await getProfileThrottled({ userId: 'abc123' });
    console.log("Resultado:", result4 ? 'Dados recebidos' : 'Sem dados');
  } catch (error) {
    console.error("Erro ao testar conexão Supabase:", error);
  }
}

// Executar todos os testes
async function runAllTests() {
  try {
    console.log("==================================================");
    console.log("TESTES DO SISTEMA ANTI-LOOPING HTTP");
    console.log("==================================================\n");
    
    await testSubscriptionThrottle();
    await testApiThrottle();
    
    // Descomentar para testar com Supabase real (requer configuração)
    // await testLiveSupabaseConnection();
    
    console.log("\n==================================================");
    console.log("TODOS OS TESTES CONCLUÍDOS!");
    console.log("==================================================");
  } catch (error) {
    console.error("ERRO NOS TESTES:", error);
  }
}

// Auto-executa os testes
runAllTests();
