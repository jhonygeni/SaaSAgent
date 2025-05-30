# 🎯 TESTE PRÁTICO DO BILLING CYCLE - PASSO A PASSO

## 🚀 SITUAÇÃO ATUAL
- ✅ Servidor rodando: http://localhost:8081
- ✅ Interceptador aberto: debug-checkout-interceptor.html 
- ✅ Logs de debug adicionados ao componente PricingPlans
- ✅ Script de console pronto: debug-billing-console.js

## 📋 EXECUTE EXATAMENTE ESTA SEQUÊNCIA:

### PASSO 1: Preparar o Console
1. Abra http://localhost:8081 em uma nova aba
2. Navegue até a página de pricing/preços
3. Abra o Console do navegador (F12 → Console)
4. Cole todo o conteúdo do arquivo `debug-billing-console.js`
5. Pressione Enter
6. Você deve ver mensagens de "✅ SETUP DE DEBUG COMPLETO!"

### PASSO 2: Testar Seleção de Billing Cycles
1. **Teste com Billing Mensal:**
   - Clique no botão "Mensal" (se existir)
   - Observe os logs no console
   - Deve aparecer "🖱️ CLIQUE EM BILLING DETECTADO!"

2. **Teste com Billing Semestral:**
   - Clique no botão "Semestral" (se existir)
   - Observe os logs no console

3. **Teste com Billing Anual:**
   - Clique no botão "Anual" (se existir)
   - Observe os logs no console

### PASSO 3: Testar Checkout
Para cada billing cycle testado acima:

1. **Com billing MENSAL selecionado:**
   - Clique em "Começar com Starter" ou "Começar com Growth"
   - Observe AMBOS os consoles:
     - Console do navegador (deve mostrar "🚀 CHECKOUT DEBUGGING")
     - Aba do interceptador (deve capturar a requisição)

2. **Com billing SEMESTRAL selecionado:**
   - Repita o mesmo processo
   - Compare os dados com o teste mensal

3. **Com billing ANUAL selecionado:**
   - Repita o mesmo processo
   - Compare os dados com os testes anteriores

## 🔍 O QUE OBSERVAR

### No Console do Navegador:
Procure por estas mensagens:
```
🚀 CHECKOUT DEBUGGING - DADOS COLETADOS:
  📋 Plan ID: starter/growth
  🔄 Billing Cycle: monthly/semiannual/annual
  🎯 Price ID selecionado: price_xxxxx
```

### No Interceptador de Requisições:
Procure por:
```
🚀 REQUISIÇÃO INTERCEPTADA:
📦 BODY DA REQUISIÇÃO:
   planId: starter/growth
   billingCycle: monthly/semiannual/annual
   priceId: price_xxxxx
```

## 🎯 PERGUNTAS CRÍTICAS PARA RESPONDER:

1. **Os botões de billing cycle são detectados?**
   - [ ] Sim, aparecem logs quando clico nos botões
   - [ ] Não, não aparecem logs de clique

2. **O billingCycle state está correto?**
   - [ ] Sim, mostra o cycle correto nos logs
   - [ ] Não, sempre mostra "monthly"

3. **O priceId está correto?**
   - [ ] Sim, muda conforme o billing cycle
   - [ ] Não, sempre usa o price do monthly

4. **As requisições são interceptadas?**
   - [ ] Sim, o interceptador captura as requisições
   - [ ] Não, nenhuma requisição é capturada

## 📊 TABELA DE VALIDAÇÃO

Preencha esta tabela com os resultados:

| Billing Cycle | Plan | Price ID Esperado | Price ID Recebido | Status |
|---------------|------|-------------------|-------------------|---------|
| Monthly | Starter | price_1RRBDsP1QgGAc8KHzueN2CJL | ? | ? |
| Semiannual | Starter | price_1RUGkFP1QgGAc8KHAXICojLH | ? | ? |
| Annual | Starter | price_1RUGkgP1QgGAc8KHctjcrt7h | ? | ? |
| Monthly | Growth | price_1RRBEZP1QgGAc8KH71uKIH6i | ? | ? |
| Semiannual | Growth | price_1RUAt2P1QgGAc8KHr8K4uqXG | ? | ? |
| Annual | Growth | price_1RUAtVP1QgGAc8KH01aRe0Um | ? | ? |

## 🚨 CENÁRIOS POSSÍVEIS

### CENÁRIO A: Problema no Frontend
**Sintomas:**
- Cliques em billing cycles não são detectados
- `billingCycle` sempre "monthly" nos logs
- Estado do React não atualiza

**Solução:** Verificar componente de seleção de billing

### CENÁRIO B: Problema na Passagem de Dados
**Sintomas:**
- Cliques são detectados
- Estado atualiza no frontend
- Mas dados enviados estão errados

**Solução:** Verificar função `handleSelectPlan`

### CENÁRIO C: Problema no Backend
**Sintomas:**
- Frontend envia dados corretos
- Interceptador captura dados corretos
- Mas Stripe abre plano errado

**Solução:** Verificar função `create-checkout`

## ✅ AÇÕES BASEADAS NOS RESULTADOS

Após executar os testes, reporte:

1. **Capturas de tela dos logs**
2. **Tabela preenchida**
3. **Qual cenário se aplica**
4. **Observações específicas**

---

**🎯 META:** Identificar exatamente onde o `billingCycle` está sendo perdido ou ignorado.
