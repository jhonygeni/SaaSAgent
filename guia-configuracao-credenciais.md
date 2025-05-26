# 🔧 Guia de Configuração - Credenciais N8N + Evolution API

## 📝 Variáveis de Ambiente Necessárias

### 1. NEXT_PUBLIC_WEBHOOK_BASE_URL
```bash
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://seu-dominio.com
```

**Explicação:** URL onde seu sistema receberá webhooks do N8N
- **Desenvolvimento:** `http://localhost:3000`
- **Produção:** `https://conversa-ai.seu-dominio.com`
- **Uso:** N8N enviará para `${URL}/api/webhook/whatsapp`

### 2. WEBHOOK_VERIFY_TOKEN
```bash
WEBHOOK_VERIFY_TOKEN=token-secreto-personalizado-123
```

**Explicação:** Token de verificação para autenticar N8N
- **Onde usar:** Configure no N8N como `Authorization: Bearer ${token}`
- **Propósito:** Verificar que o webhook veio do seu N8N
- **Recomendação:** Use um token único e seguro

### 3. WEBHOOK_SECRET
```bash
WEBHOOK_SECRET=chave-hmac-super-secreta-456
```

**Explicação:** Chave para validação HMAC-SHA256
- **Onde usar:** N8N usa para assinar o payload
- **Propósito:** Garantir integridade dos dados
- **Recomendação:** Use uma chave longa e aleatória

## 🔄 Configuração Passo a Passo

### Passo 1: Crie seu arquivo .env
```bash
# Copie o .env.example
cp .env.example .env

# Edite com suas configurações
nano .env
```

### Passo 2: Configure N8N Workflow

#### Node 1: Webhook Trigger (Evolution → N8N)
```json
{
  "name": "Evolution Webhook",
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "path": "evolution-webhook",
    "httpMethod": "POST",
    "responseMode": "onReceived",
    "responseData": "allEntries"
  }
}
```

#### Node 2: HTTP Request (N8N → Seu Sistema)
```json
{
  "name": "Send to Conversa AI",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "{{ $env.WEBHOOK_BASE_URL }}/api/webhook/whatsapp",
    "method": "POST",
    "headers": {
      "Authorization": "Bearer {{ $env.WEBHOOK_VERIFY_TOKEN }}",
      "Content-Type": "application/json",
      "X-Hub-Signature-256": "{{ $node.calculateHMAC($json, 'sha256', $env.WEBHOOK_SECRET) }}"
    },
    "body": {
      "object": "whatsapp_business_account",
      "entry": [
        {
          "id": "{{ $('Evolution Webhook').item.json.instance }}",
          "changes": [
            {
              "value": {
                "messaging_product": "whatsapp",
                "metadata": {
                  "display_phone_number": "{{ $('Evolution Webhook').item.json.from }}",
                  "phone_number_id": "{{ $('Evolution Webhook').item.json.instance }}"
                },
                "messages": [
                  {
                    "id": "{{ $('Evolution Webhook').item.json.data.key.id }}",
                    "from": "{{ $('Evolution Webhook').item.json.data.key.remoteJid }}",
                    "timestamp": "{{ $('Evolution Webhook').item.json.data.messageTimestamp }}",
                    "type": "text",
                    "text": {
                      "body": "{{ $('Evolution Webhook').item.json.data.message.conversation || $('Evolution Webhook').item.json.data.message.extendedTextMessage.text }}"
                    }
                  }
                ]
              },
              "field": "messages"
            }
          ]
        }
      ]
    }
  }
}
```

### Passo 3: Configure Variáveis no N8N
```bash
# No N8N, configure estas variáveis de ambiente:
WEBHOOK_BASE_URL=https://seu-dominio.com
WEBHOOK_VERIFY_TOKEN=seu-token-aqui
WEBHOOK_SECRET=sua-chave-secreta-aqui
```

### Passo 4: Teste a Configuração
```bash
# Execute o script de teste
npm run webhook:test

# Ou manualmente:
node test-webhook.mjs
```

## 🔍 Validação da Configuração

### Checklist ✅
- [ ] `.env` criado com todas as variáveis
- [ ] N8N workflow configurado
- [ ] Variáveis de ambiente do N8N definidas
- [ ] URL do webhook acessível
- [ ] Evolution API conectada ao N8N
- [ ] Teste de webhook realizado

### Logs de Verificação
```bash
# Verificar se o webhook está funcionando
curl -X POST https://seu-dominio.com/api/webhook/whatsapp \
  -H "Authorization: Bearer seu-token" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

## 🚀 Deployment

### Desenvolvimento Local
```bash
# Inicie o servidor
npm run dev

# Teste o webhook
npm run webhook:test
```

### Produção
```bash
# Build da aplicação
npm run build

# Configure HTTPS (obrigatório para webhooks)
# Use Nginx, Cloudflare, ou similar

# Verificar URL pública
echo $NEXT_PUBLIC_WEBHOOK_BASE_URL
```

## 🔧 Troubleshooting

### Problema: Webhook não recebe dados
**Solução:** Verificar se `NEXT_PUBLIC_WEBHOOK_BASE_URL` está correto e acessível

### Problema: Token inválido
**Solução:** Verificar se `WEBHOOK_VERIFY_TOKEN` é o mesmo no N8N e no `.env`

### Problema: Falha na validação HMAC
**Solução:** Verificar se `WEBHOOK_SECRET` é o mesmo no N8N e no `.env`

### Problema: Evolution API não envia para N8N
**Solução:** Verificar webhook URL da Evolution API aponta para N8N

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do N8N
2. Verifique os logs da aplicação: `npm run webhook:dev`
3. Teste manualmente com `curl`
4. Confirme que todas as URLs estão acessíveis
