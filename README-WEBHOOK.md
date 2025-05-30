# Webhook do WhatsApp - Conversa AI Brasil

Este documento explica como configurar e usar o sistema de webhook para receber mensagens do WhatsApp Business API.

## 📋 Índice

1. [Configuração Rápida](#configuração-rápida)
2. [Variáveis de Ambiente](#variáveis-de-ambiente)
3. [Configuração no Meta Business](#configuração-no-meta-business)
4. [Testes](#testes)
5. [Monitoramento](#monitoramento)
6. [Solução de Problemas](#solução-de-problemas)

## 🚀 Configuração Rápida

### 1. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp .env.local.example .env.local
```

Configure no `.env.local`:

```env
# URL do seu webhook (produção)
NEXT_PUBLIC_WEBHOOK_BASE_URL=https://seu-dominio.com

# Token de verificação (único para sua aplicação)
WEBHOOK_VERIFY_TOKEN=seu-token-unico-aqui

# Secret para validação HMAC (opcional mas recomendado)
WEBHOOK_SECRET=seu-secret-seguro-aqui
```

### 2. Execute o Script de Configuração

```bash
node setup-webhook.mjs
```

Este script irá:
- Verificar suas configurações
- Gerar instruções para o Meta Business
- Mostrar comandos de teste

### 3. Inicie o Servidor

```bash
npm run dev
```

### 4. Teste o Webhook

```bash
node test-webhook.mjs
```

## 🔧 Variáveis de Ambiente

| Variável | Descrição | Obrigatória | Exemplo |
|----------|-----------|-------------|---------|
| `NEXT_PUBLIC_WEBHOOK_BASE_URL` | URL base do seu webhook | ✅ | `https://app.seusite.com` |
| `WEBHOOK_VERIFY_TOKEN` | Token para verificação do webhook | ✅ | `meu-token-unico-123` |
| `WEBHOOK_SECRET` | Secret para validação HMAC | ⚠️ Recomendado | `meu-secret-super-seguro` |

### Desenvolvimento Local

Para desenvolvimento local, você pode usar:

```env
NEXT_PUBLIC_WEBHOOK_BASE_URL=http://localhost:3000
WEBHOOK_VERIFY_TOKEN=dev-token
WEBHOOK_SECRET=dev-secret
```

**Nota**: Para testar com o WhatsApp real, você precisará expor seu localhost usando ngrok ou similar.

## 📱 Configuração no Meta Business

### 1. Acesse o Meta Business Manager

1. Vá para [business.facebook.com](https://business.facebook.com)
2. Selecione seu app do WhatsApp Business API
3. Navegue até a seção "Webhooks"

### 2. Configure o Webhook

- **Callback URL**: `https://seu-dominio.com/api/webhook/whatsapp`
- **Verify Token**: O mesmo valor da variável `WEBHOOK_VERIFY_TOKEN`

### 3. Assine os Eventos

Marque os seguintes eventos:
- ✅ `messages` (obrigatório)
- ✅ `message_status` (opcional, para confirmações de entrega)

### 4. Teste a Configuração

Clique em "Verificar e Salvar". O Meta irá fazer uma requisição GET para seu webhook para verificar se está funcionando.

## 🧪 Testes

### Teste Automático

Execute o script completo de testes:

```bash
node test-webhook.mjs
```

### Teste Manual com curl

#### Verificação do Webhook

```bash
curl "http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=seu-token&hub.challenge=teste123"
```

Resposta esperada: `teste123`

#### Simulação de Mensagem

```bash
curl -X POST http://localhost:3000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "5511999999999",
            "id": "msg123",
            "timestamp": "1640995200",
            "type": "text",
            "text": { "body": "Olá teste!" }
          }],
          "metadata": { "phone_number_id": "phone123" }
        }
      }]
    }]
  }'
```

### Usando ngrok para Testes Locais

1. Instale o ngrok: `npm install -g ngrok`
2. Execute: `ngrok http 3000`
3. Use a URL HTTPS gerada no `NEXT_PUBLIC_WEBHOOK_BASE_URL`
4. Configure no Meta Business com a URL do ngrok

## 📊 Monitoramento

### Página de Administração

Acesse `/admin/webhooks` para ver:
- Estatísticas de webhooks recebidos
- Taxa de sucesso e tempo de resposta
- Histórico de eventos
- Alertas automáticos
- Status da configuração

### Logs

Os webhooks são logados automaticamente. Verifique:

```bash
# No desenvolvimento
tail -f .next/trace

# Em produção (Vercel)
vercel logs
```

### Métricas Automáticas

O sistema coleta automaticamente:
- ✅ Taxa de sucesso por instância
- ⏱️ Tempo de resposta médio
- 🚨 Alertas para alta taxa de erro
- 📈 Tendências de uso

## 🔒 Segurança

### Validação HMAC

Quando `WEBHOOK_SECRET` está configurado, todas as mensagens são validadas usando HMAC-SHA256:

```javascript
// Automático no webhook
const isValid = await validateWebhookSignature(
  payload, 
  signature, 
  WEBHOOK_SECRET
);
```

### Rate Limiting

O sistema inclui rate limiting básico para prevenir spam.

### Práticas Recomendadas

1. ✅ Use HTTPS em produção (obrigatório para WhatsApp)
2. ✅ Configure `WEBHOOK_SECRET` para validação HMAC
3. ✅ Use tokens únicos e seguros
4. ✅ Monitore logs regularmente
5. ✅ Configure alertas para falhas

## 🆘 Solução de Problemas

### Webhook Não Recebe Mensagens

1. **Verifique a URL**: Certifique-se que a URL está acessível publicamente
2. **Teste a verificação**: Execute o teste de verificação manual
3. **Verifique logs**: Veja se há erros nos logs da aplicação
4. **Confirme no Meta**: Verifique se o webhook está ativo no Meta Business

### Erro 403 (Token Inválido)

- Verifique se `WEBHOOK_VERIFY_TOKEN` está correto
- Confirme se o token no Meta Business é o mesmo

### Erro 401 (Assinatura Inválida)

- Verifique se `WEBHOOK_SECRET` está configurado corretamente
- Confirme se o Meta Business está enviando a assinatura

### Mensagens Não São Processadas

1. Verifique a estrutura do payload recebido
2. Veja logs para erros na função `processIncomingMessage`
3. Teste com payload simulado

### Comandos de Debug

```bash
# Verificar configuração
node setup-webhook.mjs

# Testar webhook completo
node test-webhook.mjs

# Verificar logs em tempo real
npm run dev

# Testar conectividade
curl -I https://seu-dominio.com/api/webhook/whatsapp
```

## 📁 Estrutura dos Arquivos

```
src/
├── app/api/webhook/whatsapp/route.ts    # Endpoint principal
├── lib/webhook-utils.ts                 # Utilitários de webhook
├── lib/webhook-monitor.ts               # Sistema de monitoramento
├── config/webhook.ts                    # Configurações
├── hooks/useWebhookAlerts.ts            # Hook para alertas
└── app/admin/webhooks/page.tsx          # Página de administração

test-webhook.mjs                         # Script de testes
setup-webhook.mjs                        # Script de configuração
```

## 🔄 Fluxo de Processamento

1. **Meta envia webhook** → `POST /api/webhook/whatsapp`
2. **Validação de assinatura** (se configurada)
3. **Validação da estrutura** dos dados
4. **Extração da mensagem**
5. **Processamento personalizado** (`processIncomingMessage`)
6. **Registro de métricas**
7. **Resposta de sucesso**

## 🎯 Próximos Passos

Após configurar o webhook básico, você pode:

1. **Implementar processamento personalizado** em `processIncomingMessage`
2. **Conectar com banco de dados** para salvar mensagens
3. **Integrar com IA/chatbot** para respostas automáticas
4. **Adicionar notificações** para agentes humanos
5. **Configurar automações** baseadas no conteúdo

---

## 📞 Suporte

Se encontrar problemas:

1. Execute `node setup-webhook.mjs` para verificar configuração
2. Execute `node test-webhook.mjs` para testar funcionalidade
3. Verifique a página `/admin/webhooks` para monitoramento
4. Consulte os logs da aplicação

Para mais informações sobre a API do WhatsApp:
- [Documentação oficial do WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Manager](https://business.facebook.com)
