# 🔄 Anti-Loop para Webhooks WhatsApp

Este documento fornece instruções sobre como usar e testar o sistema anti-loop implementado para evitar loops infinitos de webhooks no sistema de mensagens do WhatsApp.

## 🚀 Visão Geral

O sistema anti-loop foi implementado para evitar que mensagens sejam processadas repetidamente em um ciclo infinito, o que pode ocorrer quando:

1. Uma instância do WhatsApp recebe uma mensagem
2. A mensagem é processada e gera outra mensagem
3. Essa nova mensagem também dispara um webhook
4. O processo se repete indefinidamente

## ✅ Funcionalidades Implementadas

- ✓ Rastreamento de mensagens por ID único
- ✓ Contagem de processamento de mensagens
- ✓ Detecção de loops baseada em limites configuráveis
- ✓ Headers de rastreamento entre sistemas
- ✓ Logs detalhados para diagnóstico
- ✓ Limpeza automática do cache

## 🧪 Como Testar

### Pré-requisitos

1. Servidor webhook rodando: `node webhook-simple.cjs` ou `node webhook-server.cjs` 
2. Node.js instalado (v14 ou superior)

### Executar o Script de Teste

```bash
node test-anti-loop.mjs
```

O script executará três testes diferentes:
1. Mensagens diferentes (não deve detectar loop)
2. Mesma mensagem repetida (deve detectar loop)
3. Teste do contador de processamento

### Resultado Esperado

- Teste 1: Todas as mensagens devem ser processadas com sucesso
- Teste 2: Após algumas repetições, o sistema deve bloquear (erro 429)
- Teste 3: O contador de processamento deve incrementar corretamente

## 🔧 Configuração

As configurações do sistema anti-loop estão em:

- **Servidor**: `webhook-server.cjs` e `webhook-simple.cjs`
  - `ANTI_LOOP_CONFIG.MAX_PROCESSING`: Máximo de processamentos (padrão: 3)
  - `ANTI_LOOP_CONFIG.MESSAGE_TTL`: Tempo de vida no cache (padrão: 30min)

- **Cliente**: `src/lib/message-tracking.ts`
  - `TRACKING_CONFIG.LOOP_THRESHOLD`: Limite para detecção (padrão: 5)
  - `TRACKING_CONFIG.MAX_CACHE_SIZE`: Tamanho máximo do cache (padrão: 1000)

## 📋 Logs e Diagnóstico

Os logs do sistema anti-loop são prefixados com:

- `[WEBHOOK] [ANTI-LOOP]` nos logs do cliente
- `[WEBHOOK-PRINCIPAL] [ANTI-LOOP]` nos logs do servidor

Exemplo de log de detecção:
```
[WEBHOOK-PRINCIPAL] [ANTI-LOOP] Possível loop detectado! MessageID: msg123, Count: 4
```

## 📝 Documentação Completa

Para mais detalhes sobre a implementação, consulte:
- [ANTI-LOOP-WEBHOOK-SOLUTION.md](./ANTI-LOOP-WEBHOOK-SOLUTION.md) - Documentação técnica completa

## 🔍 Resolução de Problemas

### O anti-loop está bloqueando mensagens legítimas?

Verifique se:
1. O `MESSAGE_TTL` está muito longo (mensagens ficam no cache tempo demais)
2. O `LOOP_THRESHOLD` está muito baixo (poucas mensagens já são consideradas loop)

### Mensagens em loop não estão sendo detectadas?

Verifique se:
1. Os headers `X-Message-ID` e `X-Processing-Count` estão sendo enviados corretamente
2. O `LOOP_THRESHOLD` está muito alto 
3. As mensagens têm IDs diferentes mas conteúdo similar

## 🔮 Próximos Passos

- Implementar dashboard de monitoramento
- Adicionar alertas automáticos para loops detectados
- Aprimorar algoritmos de detecção com machine learning
