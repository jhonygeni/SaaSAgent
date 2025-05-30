# 🔍 GUIA COMPLETO DE DEBUG DO BILLING CYCLE

## ⚠️ PROBLEMA IDENTIFICADO
O sistema de checkout sempre abre o plano mensal, independentemente do billing cycle selecionado (mensal, semestral, anual). A interface visual funciona corretamente, mas o checkout ignora a seleção.

## 🛠️ FERRAMENTAS DE DEBUG CRIADAS

### 1. 📡 **Interceptador de Requisições** 
**Arquivo:** `debug-checkout-interceptor.html`

**Como usar:**
1. Abra o arquivo `debug-checkout-interceptor.html` no navegador
2. Deixe esta aba aberta
3. Abra seu site principal em outra aba
4. Faça testes de checkout
5. Volte para o interceptador para ver os logs

**O que faz:**
- Intercepta TODAS as requisições para create-checkout
- Mostra os dados exatos enviados (planId, billingCycle, priceId)
- Valida se o priceId corresponde ao billingCycle selecionado
- Inclui testes diretos para todos os planos

### 2. 🧪 **Script de Console**
**Arquivo:** `debug-billing-console.js`

**Como usar:**
1. Abra seu site no navegador
2. Abra o Console do navegador (F12 → Console)
3. Cole o conteúdo do arquivo `debug-billing-console.js`
4. Pressione Enter
5. Teste clicar nos billing cycles e botões de plano

**O que faz:**
- Intercepta cliques em botões de billing cycle
- Monitora mudanças de estado
- Identifica qual billing cycle está realmente selecionado
- Fornece funções para teste manual

### 3. 🔧 **Logs Melhorados no Componente**
**Arquivo:** `src/components/PricingPlans.tsx` (modificado)

**O que foi adicionado:**
- Logs detalhados na função `handleSelectPlan`
- Verificação do estado do `billingCycle`
- Validação dos dados antes do envio
- Logs do priceId selecionado

## 📋 PLANO DE TESTE PASSO A PASSO

### Fase 1: Interceptação de Requisições
1. ✅ Abra `debug-checkout-interceptor.html`
2. ✅ Abra seu site em outra aba
3. ✅ Teste cada combinação:
   - Starter + Monthly
   - Starter + Semiannual  
   - Starter + Annual
   - Growth + Monthly
   - Growth + Semiannual
   - Growth + Annual
4. ✅ Verifique os logs no interceptador

### Fase 2: Debug do Frontend
1. ✅ Abra o Console do navegador no seu site
2. ✅ Cole o script `debug-billing-console.js`
3. ✅ Clique nos diferentes billing cycles
4. ✅ Observe se os cliques são detectados
5. ✅ Clique nos botões de plano
6. ✅ Verifique se o billing cycle correto é capturado

### Fase 3: Análise dos Logs
1. ✅ Verifique os logs do Console do navegador
2. ✅ Procure por "🚀 CHECKOUT DEBUGGING"
3. ✅ Confirme se:
   - `billingCycle` está correto
   - `priceId` corresponde ao cycle
   - Dados enviados estão consistentes

## 🎯 RESULTADOS ESPERADOS

### ✅ Se estiver funcionando corretamente:
- Interceptador mostra `billingCycle` correto
- `priceId` muda conforme o cycle selecionado
- Logs mostram dados consistentes

### ❌ Se estiver com problema:
- `billingCycle` sempre "monthly"
- `priceId` sempre dos planos mensais
- Inconsistência entre UI e dados enviados

## 🔧 PRICE IDS DE REFERÊNCIA

```javascript
const PRICE_IDS = {
  starter: {
    monthly: 'price_1RRBDsP1QgGAc8KHzueN2CJL',
    semiannual: 'price_1RUGkFP1QgGAc8KHAXICojLH', 
    annual: 'price_1RUGkgP1QgGAc8KHctjcrt7h'
  },
  growth: {
    monthly: 'price_1RRBEZP1QgGAc8KH71uKIH6i',
    semiannual: 'price_1RUAt2P1QgGAc8KHr8K4uqXG',
    annual: 'price_1RUAtVP1QgGAc8KH01aRe0Um'
  }
};
```

## 🚨 PONTOS CRÍTICOS PARA VERIFICAR

1. **Estado do Componente React**
   - O `billingCycle` state está sendo atualizado?
   - Os cliques nos botões estão funcionando?

2. **Dados Enviados**
   - O `billingCycle` correto está sendo passado?
   - O `priceId` corresponde ao cycle?

3. **Backend Processing**
   - A função create-checkout recebe os dados corretos?
   - O Stripe está sendo chamado com o priceId certo?

## 📞 PRÓXIMOS PASSOS

Após executar todos os testes:

1. **Se o problema estiver no Frontend:**
   - Verificar se os botões de billing cycle estão atualizando o state
   - Conferir se há conflitos de CSS/JavaScript
   - Validar se o React está re-renderizando corretamente

2. **Se o problema estiver no Backend:**
   - Verificar logs da função create-checkout
   - Confirmar se o Stripe está recebendo os dados corretos
   - Validar a configuração dos Price IDs

3. **Se os dados estiverem corretos:**
   - Verificar cache do navegador
   - Testar em modo incógnito
   - Verificar se há JavaScript conflitante

## 🔄 COMANDOS ÚTEIS

### Para limpar cache e testar:
```bash
# Limpar cache do navegador (Ctrl+Shift+R ou Cmd+Shift+R)

# Testar em modo incógnito
# Cmd+Shift+N (Mac) ou Ctrl+Shift+N (Windows)
```

### Para verificar logs do Supabase:
```bash
supabase functions logs --function-name create-checkout
```

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] Interceptador captura requisições
- [ ] Script de console detecta cliques
- [ ] Logs do componente aparecem no console
- [ ] billingCycle state atualiza corretamente
- [ ] priceId corresponde ao billing cycle
- [ ] Dados chegam corretos no backend
- [ ] Stripe recebe o priceId correto

---

**🎯 OBJETIVO:** Identificar exatamente onde o `billingCycle` está sendo perdido ou ignorado no fluxo de checkout.

**📋 STATUS:** Ferramentas prontas para uso. Execute os testes e reporte os resultados.
