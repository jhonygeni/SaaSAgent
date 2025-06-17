# 🎯 GUIA COMPLETO: CORREÇÃO DO SISTEMA DE EMAIL - FINAL

## 📋 SITUAÇÃO ATUAL

✅ **Arquivos Corrigidos:**
- `supabase/functions/custom-email/index.ts` - Atualizado com URLs corretas
- `custom-email-function.zip` - Pronto para deploy manual (11.9 KB)

❌ **Problema Atual:**
- Docker daemon não acessível para deploy via CLI
- Necessário deploy manual via Dashboard

## 🚀 SOLUÇÃO: DEPLOY MANUAL VIA DASHBOARD

### PASSO 1: Deploy da Função
1. **Acesse:** https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/functions
2. **Clique em:** "New Function" ou "Deploy Function"
3. **Nome:** `custom-email`
4. **Upload:** Arquivo `custom-email-function.zip`
5. **Deploy:** Clique em "Deploy Function"

### PASSO 2: Configurar Variáveis de Ambiente
**Acesse:** https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/settings/functions

**Configure EXATAMENTE estas variáveis:**
```bash
SITE_URL=https://ia.geni.chat
SUPPORT_EMAIL=suporte@geni.chat
PROJECT_REF=hpovwcaskorzzrpphgkc
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=validar@geni.chat
SMTP_PASSWORD=[SUA_SENHA_DE_APP_GMAIL]
EMAIL_FROM_NAME=ConversaAI Brasil
EMAIL_FROM_ADDRESS=validar@geni.chat
EMAIL_REPLY_TO=suporte@geni.chat
```

### PASSO 3: Obter Senha de App Gmail
1. Acesse: https://myaccount.google.com
2. **Segurança** → **Verificação em duas etapas**
3. **Senhas de app** → **Selecionar app** → **Email**
4. **Dispositivo** → **Outro** → Digite "ConversaAI Supabase"
5. **Copie a senha de 16 caracteres**
6. **Use na variável `SMTP_PASSWORD`**

### PASSO 4: Testar Deploy
Execute o script de verificação:
```bash
./teste-pos-deploy-custom-email.sh
```

## 🔧 CORREÇÕES IMPLEMENTADAS

### 1. URLs Corrigidas
- ✅ `suporte@conversaai.com.br` → `suporte@geni.chat`
- ✅ Todas as referências agora usam `https://ia.geni.chat`
- ✅ Integração com variáveis de ambiente

### 2. Emails Corrigidos
**Antes:**
```
Remetente: validar@geni.chat
Reply-To: suporte@conversaai.com.br ❌
Suporte: suporte@conversaai.com.br ❌
```

**Depois:**
```
Remetente: validar@geni.chat
Reply-To: suporte@geni.chat ✅
Suporte: suporte@geni.chat ✅
```

### 3. Links de Confirmação
**Formato correto:**
```
https://hpovwcaskorzzrpphgkc.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=https%3A//ia.geni.chat/confirmar-email
```

## 📊 VERIFICAÇÃO DO FUNCIONAMENTO

### URLs Esperadas nos Emails
- ✅ **Signup:** `https://ia.geni.chat/confirmar-email`
- ✅ **Recovery:** `https://ia.geni.chat/redefinir-senha`
- ✅ **Base:** `https://ia.geni.chat`

### Fluxo de Confirmação
1. ✅ Usuário se registra
2. ✅ Email enviado com URLs corretas (ia.geni.chat)
3. ✅ Link redireciona para confirmação
4. ✅ Não há erro "Token inválido"
5. ✅ Confirmação bem-sucedida

## 🧪 TESTE COMPLETO

### 1. Após Deploy Manual
```bash
./teste-pos-deploy-custom-email.sh
```

### 2. Teste Real
1. **Registre nova conta:** https://ia.geni.chat
2. **Verifique email:** Deve chegar com domínio correto
3. **Clique no link:** Deve redirecionar corretamente
4. **Confirme:** Não deve dar erro de token

### 3. Verificar Logs
- **Dashboard:** https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/functions/custom-email/logs
- **CLI:** `supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc`

## 🎯 CHECKLIST FINAL

### Antes do Deploy
- ✅ Arquivo `custom-email-function.zip` criado
- ✅ Dashboard aberto no navegador
- ✅ Senha de app Gmail obtida

### Durante o Deploy
- ⬜ Function uploaded via Dashboard
- ⬜ Variáveis de ambiente configuradas
- ⬜ Senha SMTP testada

### Após o Deploy
- ⬜ Script de teste executado
- ⬜ Função respondendo corretamente
- ⬜ Teste com usuário real feito
- ⬜ Email recebido com URLs corretas
- ⬜ Confirmação funcionando sem erros

## 🚨 RESOLUÇÃO DE PROBLEMAS

### Problema: Função não responde
**Solução:** Verificar deploy no Dashboard, logs de erro

### Problema: Email não chega
**Solução:** Verificar configurações SMTP, senha de app Gmail

### Problema: URLs incorretas
**Solução:** Verificar `SITE_URL=https://ia.geni.chat`

### Problema: Token inválido
**Solução:** Usar token novo (registrar nova conta), verificar formato URL

## 📞 PRÓXIMAS AÇÕES

1. **AGORA:** Fazer deploy manual via Dashboard
2. **DEPOIS:** Configurar variáveis de ambiente
3. **ENTÃO:** Executar script de teste
4. **FINALMENTE:** Testar com usuário real

---

**Status:** 🚀 **PRONTO PARA DEPLOY MANUAL**
**Arquivo:** `custom-email-function.zip` (disponível)
**Dashboard:** https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/functions
**Teste:** `./teste-pos-deploy-custom-email.sh`

**Resultado Esperado:** ✅ Sistema de email funcionando 100% com domínio `ia.geni.chat`
