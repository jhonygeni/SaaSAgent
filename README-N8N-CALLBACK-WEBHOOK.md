# 🔄 N8N Callback Webhook - Rastreamento de Respostas Automáticas

## 📋 Resumo

Este webhook resolve o **gap crítico** no sistema de estatísticas: rastrear mensagens automáticas enviadas pelo N8N que não passavam pelo sistema de contabilização.

## 🎯 Problema Resolvido

**ANTES**: As respostas automáticas do N8N eram enviadas diretamente via Evolution API, não registrando estatísticas.

**DEPOIS**: O N8N chama este webhook após enviar cada resposta, registrando corretamente todas as mensagens automáticas.

## 🔄 Fluxo Completo

```
1. Cliente envia mensagem → WhatsApp
2. Evolution API recebe → Webhook Principal 
3. Webhook Principal → N8N (com dados do usuário)
4. N8N processa e envia resposta → Evolution API
5. 🆕 N8N chama callback → Registra estatísticas ✅
6. Evolution API → WhatsApp (resposta para cliente)
```

## 🛠️ Configuração no N8N

### 1. Adicionar Nó de Callback no Workflow

Após o nó que envia a resposta via Evolution API, adicione:

```json
{
  "name": "Registrar Estatísticas",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "url": "https://webhooksaas.geni.chat/api/webhook/n8n-callback",
    "method": "POST",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer conversa-ai-n8n-token-2024"
    },
    "body": {
      "instanceId": "{{ $node['Processar Mensagem'].json.nome_instancia }}",
      "instanceName": "{{ $node['Processar Mensagem'].json.nome_instancia }}",
      "phoneNumber": "{{ $node['Processar Mensagem'].json.telefone_remetente }}",
      "responseText": "{{ $node['Enviar Resposta'].json.text }}",
      "originalMessageId": "{{ $node['Processar Mensagem'].json.message_id }}",
      "userId": "{{ $node['Processar Mensagem'].json.usuario }}",
      "timestamp": "{{ new Date().toISOString() }}"
    },
    "options": {
      "timeout": 5000,
      "retry": {
        "enabled": true,
        "maxRetries": 2
      }
    }
  }
}
```

### 2. Workflow N8N Completo Atualizado

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
          
          // Processar com IA ou regras
          const resposta = processarMensagem(data);
          
          return { 
            resposta,
            // Manter dados originais para callback
            usuario: data.usuario,
            nome_instancia: data.nome_instancia,
            telefone_remetente: data.telefone_remetente,
            message_id: data.timestamp + '-' + Math.random().toString(36).substring(2, 9)
          };
        `
      }
    },
    {
      "name": "Enviar Resposta",
      "type": "n8n-nodes-base.httpRequest", 
      "parameters": {
        "url": "{{ $node.evolution_api_url }}/message/sendText/{{ $node['Processar Mensagem'].json.nome_instancia }}",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json",
          "Authorization": "Bearer {{ $node.evolution_api_key }}"
        },
        "body": {
          "number": "{{ $node['Processar Mensagem'].json.telefone_remetente }}",
          "text": "{{ $node['Processar Mensagem'].json.resposta }}"
        }
      }
    },
    {
      "name": "🆕 Registrar Estatísticas",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://webhooksaas.geni.chat/api/webhook/n8n-callback",
        "method": "POST",
        "headers": {
          "Content-Type": "application/json"
        },
        "body": {
          "instanceId": "{{ $node['Processar Mensagem'].json.nome_instancia }}",
          "phoneNumber": "{{ $node['Processar Mensagem'].json.telefone_remetente }}",
          "responseText": "{{ $node['Processar Mensagem'].json.resposta }}",
          "originalMessageId": "{{ $node['Processar Mensagem'].json.message_id }}",
          "userId": "{{ $node['Processar Mensagem'].json.usuario }}",
          "timestamp": "{{ new Date().toISOString() }}"
        },
        "options": {
          "continueOnFail": true,
          "timeout": 5000
        }
      }
    }
  ]
}
```

## 📊 Payload do Callback

### Campos Obrigatórios
- `instanceId`: ID da instância WhatsApp
- `phoneNumber`: Número do destinatário  
- `responseText`: Texto da resposta enviada

### Campos Opcionais
- `instanceName`: Nome da instância (fallback para busca)
- `messageId`: ID único da mensagem
- `originalMessageId`: ID da mensagem original do cliente
- `userId`: ID do usuário (otimização)
- `timestamp`: Timestamp da resposta

### Exemplo de Payload
```json
{
  "instanceId": "instance-123",
  "instanceName": "bot-vendas", 
  "phoneNumber": "5511999999999",
  "responseText": "Olá! Como posso ajudá-lo hoje?",
  "originalMessageId": "msg-abc123",
  "userId": "user-456",
  "timestamp": "2025-06-02T15:30:00.000Z"
}
```

## 🧪 Teste do Callback

### 1. Teste Manual
```bash
curl -X POST https://webhooksaas.geni.chat/api/webhook/n8n-callback \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "test-instance",
    "phoneNumber": "5511999999999", 
    "responseText": "Teste de resposta automática",
    "userId": "test-user"
  }'
```

### 2. Teste de Saúde
```bash
curl -X GET https://webhooksaas.geni.chat/api/webhook/n8n-callback
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "webhook": "n8n-callback",
  "timestamp": "2025-06-02T15:30:00.000Z",
  "description": "Webhook para registrar estatísticas de respostas automáticas do N8N"
}
```

## 🔧 Configurações de Segurança

### Autenticação (Opcional)
```bash
# Adicionar header de autorização
Authorization: Bearer conversa-ai-n8n-token-2024
```

### Rate Limiting
- O webhook tem proteção contra spam
- Timeout configurado para 5 segundos
- Retry automático em caso de falha temporária

## 📈 Benefícios

1. **✅ Estatísticas Completas**: Todas as mensagens automáticas são contabilizadas
2. **✅ Rastreamento Preciso**: Linking entre mensagem original e resposta
3. **✅ Metadados Ricos**: Informações detalhadas para analytics
4. **✅ Performance**: Processamento assíncrono não bloqueia resposta
5. **✅ Confiabilidade**: Continua funcionando mesmo se callback falhar

## ⚠️ Pontos Importantes

1. **Não é bloqueante**: Se o callback falhar, a resposta ainda é enviada normalmente
2. **Idempotente**: Pode ser chamado múltiplas vezes com segurança
3. **Performático**: Processamento rápido para não atrasar o workflow
4. **Resiliente**: Tratamento robusto de erros e dados incompletos

## 📊 Logs e Monitoramento

O webhook gera logs detalhados para debug:

```
[N8N-CALLBACK] Recebendo callback de resposta automática do N8N
[N8N-CALLBACK] Dados recebidos: {...}
[N8N-CALLBACK] Buscando dados da instância para identificar usuário...
[N8N-CALLBACK] Instância encontrada: {...}
[N8N-CALLBACK] Registrando estatística de resposta automática...
✅ [N8N-CALLBACK] Estatística registrada com sucesso: {...}
[N8N-CALLBACK] Processamento concluído em 45ms - Sucesso: true
```

## 🎯 Próximos Passos

1. **Implementar no N8N**: Adicionar o nó de callback ao workflow
2. **Testar End-to-End**: Verificar se estatísticas são registradas
3. **Monitorar**: Acompanhar logs e métricas
4. **Otimizar**: Ajustar conforme necessário

---

**Data de Implementação**: 2 de junho de 2025  
**Status**: ✅ Pronto para uso  
**Urgência**: 🔥 Alta - Resolve gap crítico nas estatísticas
