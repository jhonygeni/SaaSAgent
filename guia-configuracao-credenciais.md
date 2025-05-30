# 🔧 Guia de Configuração - Webhook Principal Evolution API

## 🎯 Fluxo Real do Sistema
```
WhatsApp → Evolution API → https://webhooksaas.geni.chat/webhook/principal
                                            ↓
                                    Processa mensagem
                                            ↓
                                    Consulta configuração do bot
                                            ↓
                                    N8N processa resposta
                                            ↓
                                    Evolution API → WhatsApp
```

## 📝 Configuração para Evolution API

### URL do Webhook Principal
```bash
https://webhooksaas.geni.chat/webhook/principal
```

**Explicação:** Este é o endpoint que a Evolution API chama automaticamente
- **Quando:** Cliente cria um bot e conecta à Evolution
- **Como:** Evolution configura automaticamente este webhook
- **Processamento:** Direto via N8N (sem passar pelo front/back)

### Credenciais Necessárias

**Para este fluxo, você NÃO precisa das variáveis anteriores!**

O webhook principal já está configurado e funcionando. As únicas configurações necessárias são:

### 1. Configuração da Evolution API
```bash
# Na Evolution, o webhook já está configurado para:
WEBHOOK_URL=https://webhooksaas.geni.chat/webhook/principal
```

### 2. Configuração do Bot no Sistema
- **Interface:** Configure o bot através da interface web
- **N8N:** Processamento automático via N8N
- **Resposta:** Enviada automaticamente via Evolution API

### 3. Variáveis de Ambiente (Opcionais)
```bash
# Apenas para logs e monitoramento
WEBHOOK_LOGS_ENABLED=true
WEBHOOK_DEBUG_MODE=false
```

## 🔄 Como o Sistema Funciona

### 1. Cliente Cria Bot
- Cliente acessa interface web
- Configura bot (nome, prompt, FAQs)
- Sistema cria instância na Evolution API
- **Evolution configura automaticamente:** `webhook: https://webhooksaas.geni.chat/webhook/principal`

### 2. Cliente Recebe Mensagem no WhatsApp
- WhatsApp → Evolution API
- Evolution API → `https://webhooksaas.geni.chat/webhook/principal`
- Webhook processa mensagem
- Consulta configuração do bot no banco
- Envia dados para N8N

### 3. N8N Processa e Responde
- N8N recebe dados do webhook
- Processa com IA/regras do bot
- Gera resposta
- Envia de volta via Evolution API
- Evolution API → WhatsApp

### 4. Fluxo Completo
```
[Cliente WhatsApp] 
        ↓ (mensagem)
[Evolution API] 
        ↓ (webhook)
[webhook/principal] 
        ↓ (dados + config)
[N8N] 
        ↓ (resposta processada)
[Evolution API] 
        ↓ (resposta)
[Cliente WhatsApp]
```

## ✅ Verificação se Está Funcionando

### 1. Teste o Webhook Principal
```bash
curl -X GET https://webhooksaas.geni.chat/webhook/principal
```
**Resposta esperada:**
```json
{
  "status": "ok",
  "webhook": "webhook-principal", 
  "timestamp": "2025-05-26T...",
  "version": "1.0.0"
}
```

### 2. Verificar Logs
```bash
# No ambiente de desenvolvimento
npm run dev

# Verificar logs do webhook
tail -f /var/log/webhook-principal.log
```

### 3. Teste com Bot Real
1. Crie um bot na interface
2. Conecte uma instância WhatsApp
3. Envie uma mensagem para o número
4. Verifique se a resposta é processada via N8N

### 4. Monitoramento
- Acesse: `/admin/webhooks` para ver estatísticas
- Verifique taxa de sucesso
- Monitore tempo de resposta

## 🚀 Configuração N8N (Para Processamento)

O N8N recebe dados do webhook principal e processa a resposta. Configure:

### 1. Workflow N8N Básico
```json
{
  "nodes": [
    {
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook", 
      "parameters": {
        "path": "conversa-ai-webhook",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Process Message",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": `
          // Dados recebidos do webhook principal
          const data = $input.first().json;
          
          // Processar mensagem com IA/regras
          const resposta = processarMensagem(data);
          
          return { resposta };
        `
      }
    },
    {
      "name": "Send Response",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $node.evolution_api_url }}",
        "method": "POST",
        "body": {
          "message": "{{ $node.resposta }}"
        }
      }
    }
  ]
}
```

### 2. URL do N8N
Configure no sistema onde o webhook principal enviará os dados:
```bash
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/conversa-ai-webhook
```

## 🔧 Troubleshooting

### Problema: Webhook não recebe mensagens
**Solução:** 
1. Verifique se `https://webhooksaas.geni.chat/webhook/principal` está acessível
2. Teste com: `curl -X GET https://webhooksaas.geni.chat/webhook/principal`
3. Verifique logs da Evolution API

### Problema: Bot não responde
**Solução:**
1. Verifique configuração do bot na interface
2. Verifique se N8N está recebendo dados
3. Teste workflow do N8N manualmente

### Problema: Resposta lenta
**Solução:**
1. Verifique latência do N8N
2. Otimize processamento de IA
3. Configure cache no webhook principal

### Problema: Evolution API não conecta
**Solução:**
1. Verifique credenciais da Evolution API
2. Teste conexão manual
3. Verifique se webhook URL está correto na instância

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do N8N
2. Verifique os logs da aplicação: `npm run webhook:dev`
3. Teste manualmente com `curl`
4. Confirme que todas as URLs estão acessíveis
