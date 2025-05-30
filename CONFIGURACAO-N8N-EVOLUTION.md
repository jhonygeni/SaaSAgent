# Configuração N8N + Evolution API → Seu Sistema

## 📋 Workflow N8N Recomendado

### 1. Webhook Trigger (Evolution API → N8N)
```json
{
  "nodes": [
    {
      "name": "Evolution Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "evolution-webhook",
        "httpMethod": "POST",
        "responseMode": "onReceived"
      }
    }
  ]
}
```

### 2. Processamento dos Dados
```json
{
  "name": "Process WhatsApp Message",
  "type": "n8n-nodes-base.function",
  "parameters": {
    "functionCode": `
// Processar dados da Evolution API
const evolutionData = $input.first().json;

// Extrair informações da mensagem
const message = {
  from: evolutionData.data?.key?.remoteJid || evolutionData.from,
  messageId: evolutionData.data?.key?.id || evolutionData.messageId,
  timestamp: evolutionData.data?.messageTimestamp || Date.now(),
  type: evolutionData.data?.message ? Object.keys(evolutionData.data.message)[0] : 'unknown',
  content: evolutionData.data?.message?.conversation || 
           evolutionData.data?.message?.extendedTextMessage?.text ||
           evolutionData.content,
  phoneNumberId: evolutionData.instance || 'default',
  instanceName: evolutionData.instance
};

// Transformar para formato esperado pelo seu sistema
const webhookPayload = {
  object: 'whatsapp_business_account',
  entry: [{
    id: evolutionData.instance || 'evolution_instance',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: message.from,
          phone_number_id: message.phoneNumberId
        },
        messages: [{
          from: message.from,
          id: message.messageId,
          timestamp: message.timestamp.toString(),
          type: message.type,
          text: message.type === 'conversation' ? { body: message.content } : undefined,
          [message.type]: message.type !== 'conversation' ? message.content : undefined
        }]
      },
      field: 'messages'
    }]
  }]
};

return { json: webhookPayload };
`
  }
}
```

### 3. Envio para Seu Sistema
```json
{
  "name": "Send to Conversa AI",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://seu-dominio.com/api/webhook/whatsapp",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer conversa-ai-n8n-token-2024",
      "X-Webhook-Source": "n8n-evolution"
    },
    "body": "={{ JSON.stringify($json) }}"
  }
}
```

## 🔐 Configuração de Segurança

### Opção 1: Token de Autorização (Simples)
```env
WEBHOOK_VERIFY_TOKEN=conversa-ai-n8n-token-2024
```

No N8N, adicione header:
```json
{
  "Authorization": "Bearer conversa-ai-n8n-token-2024"
}
```

### Opção 2: HMAC Signature (Mais Seguro)
```env
WEBHOOK_SECRET=meu-secret-evolution-n8n-2024
```

Função N8N para gerar HMAC:
```javascript
const crypto = require('crypto');

const payload = JSON.stringify($json);
const secret = 'meu-secret-evolution-n8n-2024';
const signature = crypto
  .createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

// Adicionar ao header
$headers['X-Hub-Signature-256'] = `sha256=${signature}`;
```

## 📱 URLs para Configuração

### Evolution API
Configure o webhook da Evolution para apontar para o N8N:
```
https://seu-n8n.com/webhook/evolution-webhook
```

### N8N → Seu Sistema
Configure o N8N para enviar para:
```
https://seu-dominio.com/api/webhook/whatsapp
```

## 🧪 Teste da Configuração

1. **Teste Evolution → N8N**
2. **Teste N8N → Seu Sistema**
3. **Teste completo: WhatsApp → Evolution → N8N → Seu Sistema**
