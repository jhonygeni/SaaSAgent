// Mock data para simular a resposta da função check-subscription
// Este arquivo será usado temporariamente para testar a funcionalidade da barra de progresso

// Mock data para testes de desenvolvimento
const scenarios = {
  'free-trial': {
    plan: 'trial',
    status: 'active',
    messageCount: 0,
    maxMessages: 100,
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    features: ['basic_chat', 'basic_templates']
  },
  'basic-active': {
    plan: 'basic',
    status: 'active',
    messageCount: 150,
    maxMessages: 1000,
    features: ['basic_chat', 'basic_templates', 'basic_analytics']
  },
  'pro-active': {
    plan: 'pro',
    status: 'active',
    messageCount: 2500,
    maxMessages: 10000,
    features: ['advanced_chat', 'advanced_templates', 'advanced_analytics', 'api_access']
  }
};

export function getMockSubscriptionData(mockUser: string = 'free-trial') {
  return scenarios[mockUser as keyof typeof scenarios] || scenarios['free-trial'];
}

export function getMockMessageCount(mockUser: string = 'free-trial') {
  return scenarios[mockUser as keyof typeof scenarios]?.messageCount || 0;
}

export function getMockMaxMessages(mockUser: string = 'free-trial') {
  return scenarios[mockUser as keyof typeof scenarios]?.maxMessages || 100;
}

export function getMockFeatures(mockUser: string = 'free-trial') {
  return scenarios[mockUser as keyof typeof scenarios]?.features || ['basic_chat'];
}

export const simulateMessageIncrement = (currentCount: number, plan: string): number => {
  // Simula o envio de uma nova mensagem
  return currentCount + 1;
};

export const enableMockMode = () => {
  localStorage.setItem('MOCK_SUBSCRIPTION_MODE', 'true');
};

export const disableMockMode = () => {
  localStorage.removeItem('MOCK_SUBSCRIPTION_MODE');
};

export const isMockModeEnabled = () => {
  return localStorage.getItem('MOCK_SUBSCRIPTION_MODE') === 'true';
};
