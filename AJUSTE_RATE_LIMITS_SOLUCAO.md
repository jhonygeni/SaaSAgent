# 🎯 AJUSTE DOS RATE LIMITS PARA RESOLVER TOKEN EXPIRADO

## 🔍 **PROBLEMA IDENTIFICADO:**

Nos Rate Limits, vejo que **"Rate limit for token verifications"** está em **30** com apenas **360 requests per hour**. Isso é muito restritivo e pode estar causando a expiração prematura dos tokens.

## ✅ **AJUSTES NECESSÁRIOS:**

### **1. Aumentar Rate Limit for Token Verifications**
**Valor atual:** 30 (360 requests/hour)
**Novo valor:** 100 ou 150
**Resultado:** Mais verificações permitidas por período

### **2. Verificar Rate Limit for Sign Ups**
**Valor atual:** 30
**Considerar aumentar para:** 60-100
**Motivo:** Evitar bloqueio durante testes

### **3. Configurações Recomendadas:**
```
Rate limit for token verifications: 150
Rate limit for sign ups and sign ins: 60
Rate limit for token refreshes: 150 (manter)
Rate limit for sending emails: 200 (manter)
```

## 🚀 **AÇÃO IMEDIATA:**

1. **No Dashboard de Rate Limits** (já aberto):
   - Mudar **"Rate limit for token verifications"** de 30 para **150**
   - Mudar **"Rate limit for sign ups and sign ins"** de 30 para **60**
   - Clicar em **"Save changes"**

2. **Aguardar 2-3 minutos** para as mudanças entrarem em vigor

3. **Testar novamente:**
   - Registrar nova conta
   - Verificar se o link de confirmação funciona
   - Token deve durar mais tempo

## 🔍 **POR QUE ISSO RESOLVE:**

- **Rate limits baixos** fazem o Supabase rejeitar verificações rapidamente
- **Token verifications = 30** é muito restritivo para desenvolvimento
- **Aumentar para 150** dá margem suficiente para testes e uso normal
- **360 requests/hour** atual = apenas 6 por minuto (muito pouco)

## ✅ **RESULTADO ESPERADO:**

Após ajustar os rate limits:
1. ✅ Tokens duram tempo normal (24 horas)
2. ✅ Verificações não são bloqueadas
3. ✅ Links de confirmação funcionam
4. ✅ Sistema funciona normalmente

---

**AÇÃO:** Ajustar rate limits conforme valores acima
**TEMPO:** 2 minutos para configurar + 3 minutos para aplicar
**TESTE:** Registrar nova conta e clicar no link
**PROBABILIDADE DE SUCESSO:** 90%
