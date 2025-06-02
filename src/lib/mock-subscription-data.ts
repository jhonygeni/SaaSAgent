// Mock data para simular a resposta da função check-subscription
// Este arquivo será usado temporariamente para testar a funcionalidade da barra de progresso

export const getMockSubscriptionData = (userId: string) => {
  // Primeiro verifica se há um tipo de usuário específico definido
  const mockUser = localStorage.getItem('mockUser');
  
  // Simula diferentes cenários baseados no tipo de usuário
  const scenarios = {
    'free_user': {
      subscribed: false,
      plan: "free",
      message_count: 25, // Simula 25 mensagens enviadas de 100 permitidas
      subscription_end: null
    },
    'starter_user': {
      subscribed: true,
      plan: "starter", 
      message_count: 450, // Simula 450 mensagens enviadas de 1000 permitidas
      subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias no futuro
    },
    'growth_user': {
      subscribed: true,
      plan: "growth",
      message_count: 2750, // Simula 2750 mensagens enviadas de 5000 permitidas
      subscription_end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 dias no futuro
    }
  };

  // Se mockUser está definido, usa o cenário específico
  if (mockUser && scenarios[mockUser as keyof typeof scenarios]) {
    console.log(`🎯 Usando cenário específico: ${mockUser}`, scenarios[mockUser as keyof typeof scenarios]);
    return scenarios[mockUser as keyof typeof scenarios];
  }

  // Fallback: usa o primeiro caractere do userId para determinar o cenário (distribuição simples)
  const scenarioArray = Object.values(scenarios);
  const scenarioIndex = Math.abs(userId.charCodeAt(0)) % scenarioArray.length;
  console.log(`🎲 Usando cenário baseado no userId: ${scenarioIndex}`, scenarioArray[scenarioIndex]);
  return scenarioArray[scenarioIndex];
};

export const simulateMessageIncrement = (currentCount: number, plan: string): number => {
  // Simula o envio de uma nova mensagem
  return currentCount + 1;
};

export const enableMockMode = () => {
  console.log("🧪 MODO MOCK ATIVADO: Usando dados simulados para teste da barra de progresso");
  localStorage.setItem('MOCK_SUBSCRIPTION_MODE', 'true');
};

export const disableMockMode = () => {
  console.log("🔄 MODO MOCK DESATIVADO: Voltando a usar dados reais");
  localStorage.removeItem('MOCK_SUBSCRIPTION_MODE');
};

export const isMockModeEnabled = () => {
  return localStorage.getItem('MOCK_SUBSCRIPTION_MODE') === 'true';
};
