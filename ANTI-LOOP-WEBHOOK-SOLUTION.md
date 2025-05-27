# 🔄 Sistema Anti-Loop para Webhooks WhatsApp

## 📋 Resumo da Solução

Este documento detalha a implementação do sistema anti-loop para resolver o problema de chamadas recursivas infinitas nos webhooks do WhatsApp da plataforma Conversa AI Brasil.

### ✅ Problemas Resolvidos

1. **Loop infinito de webhooks**: Mensagens repetidamente processadas entre sistemas
2. **Sobrecarga de API**: Chamadas desnecessárias consumindo recursos
3. **Duplicação de mensagens**: Mesma mensagem processada múltiplas vezes
4. **Falta de rastreamento**: Incapacidade de identificar loops

## 🔧 Componentes da Solução

### 1. Sistema de Rastreamento de Mensagens

Implementamos um rastreador centralizado de mensagens que:

- 📝 Mantém um registro de mensagens recentes por ID único
- 🧮 Conta o número de vezes que cada mensagem é processada
- ⏱️ Rastreia o tempo entre cada processamento
- 🚫 Bloqueia mensagens que ultrapassam limites configuráveis

```typescript
// Exemplo de uso do sistema de rastreamento
const messageCheck = checkMessageProcessing({
  messageId: "abc123",
  instanceName: "instance1",
  remoteJid: "5511999999999@s.whatsapp.net",
  content: "Olá mundo"
});

if (!messageCheck.canProcess) {
  // Mensagem bloqueada (loop ou duplicada)
  console.log(`Bloqueado: ${messageCheck.reason}`);
}
```

### 2. Headers de Rastreamento

Adicionamos headers específicos em todas as requisições webhook:

- `X-Message-ID`: Identificador único da mensagem
- `X-Processing-Count`: Número de vezes que a mensagem foi processada
- `X-Anti-Loop-Enabled`: Flag indicando que o sistema anti-loop está ativo 
- `X-Message-Timestamp`: Timestamp do processamento atual

### 3. Validação em Ambos os Lados

O sistema funciona bidirecionalmente:

- **No envio**: Verifica se a mensagem já foi processada antes
- **No recebimento**: Verifica headers e bloqueia mensagens suspeitas
- **Cache LRU**: Gerencia o uso de memória removendo mensagens antigas

## 🔄 Fluxo de Processamento

1. **Recebimento da mensagem**:
   - Extrair ID único da mensagem
   - Verificar no sistema de rastreamento
   - Decidir se processa ou bloqueia

2. **Validação anti-loop**:
   - Se mensagem já foi processada recentemente, incrementar contador
   - Se contador > LOOP_THRESHOLD, bloquear processamento
   - Adicionar headers de rastreamento para o próximo sistema

3. **Processamento seguro**:
   - Processar mensagem normalmente
   - Incluir headers de rastreamento na resposta
   - Registrar no sistema para futura validação

## ⚙️ Configurações

As configurações do sistema anti-loop podem ser ajustadas conforme necessário:

- `MAX_CACHE_SIZE`: Tamanho máximo do cache de mensagens (default: 1000)
- `MESSAGE_TTL`: Tempo de vida das mensagens no cache (default: 30min)
- `LOOP_THRESHOLD`: Número máximo de processamentos permitidos (default: 3)
- `CLEANUP_INTERVAL`: Intervalo de limpeza do cache (default: 5min)

## 📊 Logs e Monitoramento

O sistema inclui logs detalhados para facilitar o diagnóstico:

```
[WEBHOOK] [ANTI-LOOP] MessageID: abc123, Count: 2
[WEBHOOK] [ANTI-LOOP] Mensagem bloqueada: Loop detectado - muitas mensagens similares em curto período
[WEBHOOK] [ANTI-LOOP] Limpeza de cache: 25 mensagens removidas. Total: 137
```

## 🚀 Próximos Passos

1. **Monitoramento avançado**: Implementar dashboard para visualizar loops em tempo real
2. **Alertas**: Configurar alertas para notificar quando loops frequentes são detectados
3. **Fingerprinting**: Melhorar a detecção de mensagens similares com algoritmos mais sofisticados
4. **Configuração dinâmica**: Permitir ajuste dos parâmetros sem reiniciar o sistema

---

## 🔍 Detalhes Técnicos

### Arquivos Modificados

1. `src/lib/message-tracking.ts` - Novo sistema de rastreamento de mensagens
2. `src/api/whatsapp-webhook.ts` - Implementação da validação anti-loop
3. `src/lib/webhook-utils.ts` - Adição de headers e verificações anti-loop
4. `webhook-server.cjs` - Sistema de proteção no servidor de webhook
5. `webhook-simple.cjs` - Implementação simplificada anti-loop

### Como Funciona

O sistema usa uma combinação de:

1. **Cache com TTL**: Mensagens expiram após um período configurável
2. **Contadores de processamento**: Rastreiam quantas vezes uma mensagem foi processada
3. **Headers de rastreamento**: Passam informações entre sistemas
4. **Hashes de conteúdo**: Ajudam a identificar mensagens similares mas não idênticas
5. **Bloqueio adaptativo**: Bloqueia automaticamente quando detecta padrões de loop

### Exemplos de Cenários

#### Cenário 1: Mensagem Processada Normalmente
1. Mensagem recebida pela primeira vez: `ID=msg123`
2. Sistema verifica que é nova e processa normalmente
3. Registra no sistema de rastreamento: `count=1`
4. Responde com sucesso

#### Cenário 2: Loop Detectado
1. Mensagem recebida: `ID=msg123`, `count=3`
2. Sistema verifica que já foi processada 3 vezes recentemente
3. Detecta potencial loop e bloqueia processamento
4. Responde com erro 429 (Too Many Requests)
5. Registra informações de diagnóstico

---

Implementado por: GitHub Copilot  
Data: 27-05-2023
