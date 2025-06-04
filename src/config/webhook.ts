// Configuração do webhook do WhatsApp
export const WEBHOOK_CONFIG = {
  // URL base do webhook (será configurada via variável de ambiente)
  BASE_URL: process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL || 'http://localhost:3000',
  
  // Endpoint para receber webhooks do WhatsApp
  WEBHOOK_ENDPOINT: '/api/webhook/whatsapp',
  
  // Endpoint para verificação do webhook
  VERIFY_ENDPOINT: '/api/webhook/verify',
  
  // Token de verificação (deve ser configurado no Meta Business)
  VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || 'conversa-ai-webhook-verify',
  
  // Secret para validação de assinatura HMAC
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'your-webhook-secret-here',
  
  // Configurações de retry
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 1000,
    exponentialBackoff: true,
    timeout: 8000 // Optimized timeout for better performance
  },
  
  // URLs dos webhooks das instâncias (exemplo)
  INSTANCE_WEBHOOKS: {
    // 'instance-id': 'https://instance-webhook-url.com/webhook'
  }
};

// Função para obter URL completa do webhook
export function getWebhookUrl(endpoint: string = WEBHOOK_CONFIG.WEBHOOK_ENDPOINT): string {
  return `${WEBHOOK_CONFIG.BASE_URL}${endpoint}`;
}

// Função para validar configuração
export function validateWebhookConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!WEBHOOK_CONFIG.VERIFY_TOKEN) {
    errors.push('WEBHOOK_VERIFY_TOKEN não está configurado');
  }
  
  if (!WEBHOOK_CONFIG.WEBHOOK_SECRET || WEBHOOK_CONFIG.WEBHOOK_SECRET === 'your-webhook-secret-here') {
    errors.push('WEBHOOK_SECRET não está configurado ou está usando valor padrão');
  }
  
  if (!WEBHOOK_CONFIG.BASE_URL) {
    errors.push('NEXT_PUBLIC_WEBHOOK_BASE_URL não está configurado');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
