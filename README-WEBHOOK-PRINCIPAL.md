# 🎯 Webhook Principal - Evolution API + N8N

## 📋 Resumo Executivo

O sistema utiliza um **webhook principal** que recebe diretamente da Evolution API e processa via N8N, sem passar pelo frontend/backend da aplicação.

## 🔄 Fluxo Completo

```
📱 WhatsApp (Cliente envia mensagem)
        ↓
🔌 Evolution API (Recebe mensagem)
        ↓
🌐 https://webhooksaas.geni.chat/webhook/principal (Processa)
        ↓
🤖 N8N (Inteligência artificial/regras)
        ↓
🔌 Evolution API (Envia resposta)
        ↓
📱 WhatsApp (Cliente recebe resposta)
```

## 🚀 Como Configurar

### 1. Evolution API (Automático)
Quando o cliente cria um bot, o sistema automaticamente:
- Cria instância na Evolution API
- Configura webhook: `https://webhooksaas.geni.chat/webhook/principal`
- Habilita eventos: `MESSAGES_UPSERT`, `MESSAGE_UPDATE`

### 2. Webhook Principal (Já Configurado)
- **URL:** `https://webhooksaas.geni.chat/webhook/principal`
- **Função:** Receber da Evolution e processar
- **Arquivo:** `/src/app/api/webhook/principal/route.ts`

### 3. N8N (Necessário Configurar)
Configure workflow para receber dados do webhook principal:

```json
{
  "nodes": [
    {
      "name": "Receber do Webhook Principal",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "conversa-ai-principal",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Processar Mensagem",
      "type": "n8n-nodes-base.function", 
      "parameters": {
        "functionCode": `
          const data = $input.first().json;
          
          // Dados disponíveis:
          // - data.mensagem (texto da mensagem)
          // - data.telefone_remetente (número do cliente)
          // - data.nome_agente (nome do bot)
          // - data.prompt_agente (prompt do bot)
          // - data.faqs (perguntas frequentes)
          // - data.plano (plano do usuário)
          
          // Processar com IA ou regras
          const resposta = processarMensagem(data);
          
          return { resposta };
        `
      }
    },
    {
      "name": "Enviar Resposta",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "{{ $node.evolution_api_url }}/message/sendText/{{ $node.nome_instancia }}",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer {{ $node.evolution_api_key }}"
        },
        "body": {
          "number": "{{ $node.telefone_remetente }}",
          "text": "{{ $node.resposta }}"
        }
      }
    }
  ]
}
```

## 📊 Dados Enviados para N8N

O webhook principal envia este payload para N8N:

```json
{
  "usuario": "user_id",
  "plano": "premium",
  "status_plano": "ativo",
  "nome_instancia": "instance_name",
  "telefone_instancia": "5511999999999",
  "nome_agente": "Atendente Bot",
  "site_empresa": "Empresa LTDA",
  "area_atuacao": "Vendas",
  "info_empresa": "João Silva",
  "prompt_agente": "Você é um assistente de vendas...",
  "faqs": [
    {
      "pergunta": "Qual o horário de funcionamento?",
      "resposta": "Funcionamos de segunda a sexta, das 8h às 18h"
    }
  ],
  "nome_remetente": "Cliente",
  "telefone_remetente": "5511888888888",
  "mensagem": "Olá, preciso de ajuda!",
  "timestamp": "2025-05-26T10:30:00Z",
  "message_type": "text"
}
```

## 🧪 Como Testar

### 1. Teste de Saúde
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

### 2. Teste Automatizado
```bash
node test-webhook-principal.mjs
```

### 3. Teste Real
1. Crie um bot na interface
2. Conecte instância WhatsApp
3. Configure N8N para receber do webhook principal
4. Envie mensagem para o número WhatsApp
5. Verifique resposta automática

## 🔧 Configurações Necessárias

### No Sistema (Já Configurado)
- ✅ Webhook principal funcionando
- ✅ Processamento de dados da Evolution
- ✅ Consulta configuração do bot
- ✅ Envio para N8N

### No N8N (Você Precisa Configurar)
- 🔄 URL do webhook N8N
- 🔄 Workflow de processamento
- 🔄 Integração com IA (opcional)
- 🔄 Configuração Evolution API para resposta

### Variáveis de Ambiente N8N
```bash
# URL da Evolution API para enviar respostas
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-aqui

# URL do webhook N8N (onde webhook principal enviará dados)
N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/conversa-ai-principal
```

## ✅ Checklist de Configuração

- [ ] Webhook principal funcionando (teste de saúde)
- [ ] Bot criado na interface do sistema
- [ ] Instância WhatsApp conectada via Evolution
- [ ] N8N configurado para receber do webhook principal
- [ ] Workflow N8N configurado para processar mensagens
- [ ] Teste real com mensagem WhatsApp realizado

## 🚨 Pontos Importantes

1. **Não passa pelo front/back:** O fluxo é direto Evolution → Webhook Principal → N8N
2. **Configuração automática:** Evolution é configurada automaticamente quando bot é criado
3. **N8N é obrigatório:** Para processar e responder mensagens
4. **Webhook principal já funciona:** Você só precisa configurar o N8N

## 🔍 Monitoramento

- **Logs:** `npm run dev` (modo desenvolvimento)
- **Admin:** `/admin/webhooks` (estatísticas)
- **Saúde:** `curl https://webhooksaas.geni.chat/webhook/principal`

## 📞 Próximos Passos

1. **Configure N8N:** Crie workflow para receber do webhook principal
2. **Teste:** Use script `test-webhook-principal.mjs`
3. **Monitor:** Acompanhe logs e métricas
4. **Otimize:** Ajuste regras de IA conforme necessário
