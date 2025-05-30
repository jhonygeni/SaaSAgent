# Correção de Erros 404 e Problemas de Popup na Integração com Evolution API

## 🔍 Problema Identificado

A aplicação está enfrentando os seguintes problemas:

1. **Erros 404 em Loop**: Quando tenta acessar `/instance/info/assistente22`, a API retorna erro 404 porque a instância ainda está sendo inicializada
2. **Popup Atrasado**: O popup do QR code só aparece após várias tentativas (4+)
3. **Loop Infinito de Requisições**: O sistema continua tentando obter informações indefinidamente

## ✅ Solução Implementada

Foi implementado um conjunto de melhorias no `whatsappService.ts`:

### 1. Anti-Loop com Backoff Exponencial

```typescript
// Anti-loop: verificar se já excedeu tentativas máximas
if (attempt > maxAttempts) {
  console.warn(`Máximo de tentativas (${maxAttempts}) excedido. Retornando dados parciais.`);
  return { instance: { instanceName, status: "disconnected" } } as InstanceInfo;
}

// Backoff exponencial antes da próxima tentativa
const delayMs = Math.min(1000 * Math.pow(2, attempt), 8000); // 1s, 2s, 4s, 8s máx
```

### 2. Tratamento Especial para Erro 404

Os erros 404 na Evolution API podem significar que a instância ainda está sendo inicializada, então implementamos um tratamento específico:

```typescript
// Se for erro 404 para instância nova, podemos esperar e tentar novamente
if (apiError.status === 404 || 
    (apiError instanceof Error && apiError.message.includes("404"))) {
  console.warn(`Instância ${instanceName} não encontrada (404). Pode estar inicializando.`);
  
  // Espera com backoff exponencial e tenta novamente
  // ...
}
```

### 3. Fallback para Manter Interface Funcionando

```typescript
// Se já estamos na última tentativa, retornar objeto mínimo para não quebrar UI
if (attempt >= maxAttempts) {
  return {
    instance: {
      instanceName,
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Erro desconhecido"
    }
  } as InstanceInfo;
}
```

### 4. Timeout Maior para Instâncias Novas

```typescript
// Timeout maior para instâncias novas
const timeoutMs = 8000 + (attempt * 2000); // 8s, 10s, 12s...
```

## 📋 Como Testar a Solução

1. Reinicie a aplicação
2. Tente criar um novo agente WhatsApp
3. Observe o console - não devem aparecer erros 404 em loop
4. O popup do QR code deve aparecer de forma mais rápida e consistente
5. Se a instância não estiver disponível, o sistema vai tentar até 3 vezes com delays crescentes, e depois falhar graciosamente

## 🚨 Caso os Problemas Persistam

Se o problema persistir mesmo com esta solução, verificar:

1. **Conectividade com a Evolution API**: Confirme que o servidor Evolution API está acessível
2. **Permissões de API Key**: Verifique se o token tem permissões para criar e gerenciar instâncias
3. **Sobrecarga de Servidor**: A Evolution API pode estar sobrecarregada ou com muitas instâncias ativas
4. **Atualize a API Key**: Tente gerar uma nova API key no painel da Evolution API

## 🔧 Arquivo Atualizado

O arquivo `src/services/whatsappService.ts` foi atualizado com todas estas melhorias.

---

**Data:** 28/05/2025  
**Status:** Implementado e pronto para testes
