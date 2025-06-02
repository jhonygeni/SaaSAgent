# 🚀 Guia Completo de Configuração N8N - Sistema de Estatísticas

## 📋 Status da Implementação

✅ **BACKEND COMPLETO** - Webhook de callback implementado e testado  
✅ **INTEGRAÇÃO AGENTCHAT** - Sistema de estatísticas já integrado  
🔄 **CONFIGURAÇÃO N8N** - Próximo passo crítico  

## 🎯 Objetivo

Configurar o N8N para chamar nosso webhook de callback sempre que enviar uma resposta automática, garantindo que **100% das mensagens** sejam contabilizadas nas estatísticas.

## 🛠️ Configuração no N8N - Passo a Passo

### 1. Acesse seu Workflow N8N

1. Abra o N8N
2. Vá para o workflow que processa mensagens do WhatsApp
3. Localize o nó que **envia a resposta** via Evolution API

### 2. Adicione o Nó de Callback

Após o nó que envia a resposta, adicione um novo nó:

**Tipo**: HTTP Request  
**Nome**: "Registrar Estatísticas"

### 3. Configuração do Nó HTTP Request

#### 📡 Configurações Básicas
```
URL: https://webhooksaas.geni.chat/api/webhook/n8n-callback
Método: POST
```

#### 📋 Headers
```json
{
  "Content-Type": "application/json"
}
```

#### 📦 Body (Modo JSON)
```json
{
  "instanceId": "{{ $node['Processar Mensagem'].json.nome_instancia }}",
  "instanceName": "{{ $node['Processar Mensagem'].json.nome_instancia }}",
  "phoneNumber": "{{ $node['Processar Mensagem'].json.telefone_remetente }}",
  "responseText": "{{ $node['Enviar Resposta'].json.text }}",
  "originalMessageId": "{{ $node['Processar Mensagem'].json.message_id }}",
  "userId": "{{ $node['Processar Mensagem'].json.usuario }}",
  "timestamp": "{{ new Date().toISOString() }}"
}
```

#### ⚙️ Configurações Avançadas
```json
{
  "timeout": 5000,
  "continueOnFail": true,
  "retry": {
    "enabled": true,
    "maxRetries": 2
  }
}
```

### 4. Mapeamento de Campos Personalizados

**Se seus nós têm nomes diferentes**, adapte as expressões:

| Campo N8N | Substitua por |
|-----------|---------------|
| `nome_instancia` | Nome do campo da instância |
| `telefone_remetente` | Campo do número do WhatsApp |
| `text` | Campo do texto da resposta |
| `message_id` | Campo do ID da mensagem |
| `usuario` | Campo do ID do usuário |

**Exemplo personalizado:**
```json
{
  "instanceId": "{{ $node['WhatsApp Instance'].json.instance_id }}",
  "phoneNumber": "{{ $node['Message Data'].json.phone_number }}",
  "responseText": "{{ $node['Send Message'].json.message_text }}",
  "originalMessageId": "{{ $node['Message Data'].json.msg_id }}",
  "userId": "{{ $node['User Data'].json.user_id }}"
}
```

## 🔗 Fluxo Completo do Workflow

```
1️⃣ [Webhook Trigger] ← Recebe do sistema principal
      ↓
2️⃣ [Processar Mensagem] ← Processa com IA/regras
      ↓
3️⃣ [Enviar Resposta] ← Envia via Evolution API
      ↓
4️⃣ [🆕 Registrar Estatísticas] ← Chama nosso callback
      ↓
5️⃣ [Fim] ← Workflow concluído
```

## 📝 Configuração JSON Completa do Nó

```json
{
  "name": "Registrar Estatísticas",
  "type": "n8n-nodes-base.httpRequest",
  "typeVersion": 4.2,
  "position": [1000, 300],
  "parameters": {
    "url": "https://webhooksaas.geni.chat/api/webhook/n8n-callback",
    "method": "POST",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        {
          "name": "instanceId",
          "value": "={{ $node['Processar Mensagem'].json.nome_instancia }}"
        },
        {
          "name": "phoneNumber", 
          "value": "={{ $node['Processar Mensagem'].json.telefone_remetente }}"
        },
        {
          "name": "responseText",
          "value": "={{ $node['Enviar Resposta'].json.text }}"
        },
        {
          "name": "originalMessageId",
          "value": "={{ $node['Processar Mensagem'].json.message_id }}"
        },
        {
          "name": "userId",
          "value": "={{ $node['Processar Mensagem'].json.usuario }}"
        },
        {
          "name": "timestamp",
          "value": "={{ new Date().toISOString() }}"
        }
      ]
    },
    "options": {
      "timeout": 5000,
      "continueOnFail": true,
      "retry": {
        "enabled": true,
        "maxRetries": 2
      }
    }
  }
}
```

## 🧪 Teste da Configuração

### 1. Teste Manual no N8N

1. Execute o workflow manualmente
2. Observe se o nó "Registrar Estatísticas" executa sem erros
3. Verifique se retorna status 200

### 2. Teste com Mensagem Real

1. Envie uma mensagem de teste para o WhatsApp
2. Observe o fluxo completo no N8N
3. Verifique se a estatística foi registrada

### 3. Verificação no Sistema

```bash
# Teste direto do webhook
curl -X POST https://webhooksaas.geni.chat/api/webhook/n8n-callback \
  -H "Content-Type: application/json" \
  -d '{
    "instanceId": "sua-instancia",
    "phoneNumber": "5511999999999",
    "responseText": "Teste de configuração N8N"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "Estatística de resposta automática registrada com sucesso"
}
```

## 🔍 Solução de Problemas

### ❌ Erro 400 - Campos Obrigatórios

**Problema**: `Campos obrigatórios ausentes: instanceId, phoneNumber, responseText`

**Solução**: Verifique se os nomes dos campos no mapping estão corretos

### ❌ Erro 404 - Instância Não Encontrada

**Problema**: `Instância não encontrada no banco de dados`

**Solução**: Certifique-se que o `instanceId` corresponde ao campo `id` ou `name` na tabela `whatsapp_instances`

### ❌ Timeout ou Falha de Conexão

**Problema**: Webhook não responde

**Solução**: 
1. Verifique a URL: `https://webhooksaas.geni.chat/api/webhook/n8n-callback`
2. Teste o health check: `GET https://webhooksaas.geni.chat/api/webhook/n8n-callback`

### ⚠️ Nó Executa mas Não Registra

**Problema**: Webhook executa mas estatística não aparece

**Solução**: 
1. Verifique logs do N8N
2. Confirme se `userId` está sendo passado ou se instância existe no banco
3. Verifique se a tabela `usage_stats` está acessível

## 📊 Monitoramento

### Logs do N8N
- Observe se há erros no nó "Registrar Estatísticas"
- Status 200 = sucesso
- Status 4xx/5xx = erro (verificar configuração)

### Logs do Sistema
Os logs aparecerão como:
```
[N8N-CALLBACK] Recebendo callback de resposta automática do N8N
[N8N-CALLBACK] Instância encontrada: {...}
✅ [N8N-CALLBACK] Estatística registrada com sucesso
```

### Dashboard de Estatísticas
- Acesse o painel de estatísticas do sistema
- Verifique se as mensagens automáticas estão sendo contabilizadas
- Compare com logs do N8N para garantir consistência

## 🎯 Benefícios Após Configuração

✅ **100% Cobertura**: Todas as mensagens são contabilizadas  
✅ **Dados Precisos**: Estatísticas refletem uso real  
✅ **Rastreamento Completo**: Links entre mensagens originais e respostas  
✅ **Metadados Ricos**: Informações detalhadas para analytics  
✅ **Performance**: Não impacta velocidade de resposta  

## 🚨 Importante

- **Não é bloqueante**: Se o callback falhar, a resposta ainda é enviada
- **Configure continueOnFail**: Para que erros no callback não quebrem o workflow
- **Use timeout**: Para evitar travamentos
- **Monitore logs**: Para detectar problemas rapidamente

## ✅ Checklist de Configuração

- [ ] Nó HTTP Request adicionado após envio da resposta
- [ ] URL configurada: `https://webhooksaas.geni.chat/api/webhook/n8n-callback`
- [ ] Método: POST
- [ ] Header Content-Type: application/json
- [ ] Body com campos obrigatórios mapeados
- [ ] continueOnFail: true
- [ ] timeout: 5000
- [ ] retry habilitado
- [ ] Teste manual executado com sucesso
- [ ] Teste com mensagem real funcionando
- [ ] Estatísticas sendo registradas no sistema

---

**Data**: 2 de junho de 2025  
**Status**: 🔄 Aguardando configuração no N8N  
**Prioridade**: 🔥 Alta - Sistema completo após esta configuração
