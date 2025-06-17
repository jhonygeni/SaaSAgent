# 🚀 DEPLOY MANUAL DA FUNÇÃO CUSTOM-EMAIL

## ⚠️ Problema com Docker Local
O deploy automático falhou devido ao Docker daemon não estar acessível. Vamos fazer o deploy manual através do Dashboard do Supabase.

## 📦 Arquivo Preparado
✅ Função comprimida em: `custom-email-function.zip` (11.9 KB)

## 🔧 PASSOS PARA DEPLOY MANUAL

### Passo 1: Acessar Dashboard do Supabase
1. Abra: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/functions
2. Faça login se necessário

### Passo 2: Deploy da Função
1. Clique no botão **"New Function"** ou **"Deploy Function"**
2. **Nome da função:** `custom-email`
3. **Arquivo:** Faça upload do `custom-email-function.zip`
4. Clique em **"Deploy Function"**

### Passo 3: Configurar Variáveis de Ambiente
Vá para: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/settings/functions

Configure estas variáveis (exatamente como mostrado):

```
SITE_URL=https://ia.geni.chat
SUPPORT_EMAIL=suporte@geni.chat
PROJECT_REF=hpovwcaskorzzrpphgkc
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=validar@geni.chat
SMTP_PASSWORD=[sua_senha_de_app_gmail]
EMAIL_FROM_NAME=ConversaAI Brasil
EMAIL_FROM_ADDRESS=validar@geni.chat
EMAIL_REPLY_TO=suporte@geni.chat
```

### Passo 4: Obter Senha de App Gmail
1. Acesse: https://myaccount.google.com
2. Vá para **Segurança** → **Verificação em duas etapas**
3. Role para baixo e clique em **Senhas de app**
4. Selecione **Aplicativo** → **Email**
5. Selecione **Dispositivo** → **Outro** → Digite "ConversaAI Supabase"
6. Copie a senha de 16 caracteres gerada
7. Use esta senha na variável `SMTP_PASSWORD`

## ✅ VERIFICAÇÃO DO DEPLOY

### 1. Verificar se a Função Está Ativa
- A função deve aparecer na lista com status "Active"
- URL da função: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`

### 2. Testar a Função
Execute este comando para testar:
```bash
curl -X POST https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [SEU_ANON_KEY]" \
  -d '{
    "email": "teste@example.com",
    "type": "signup",
    "token": "test-token-123"
  }'
```

### 3. Verificar Logs
- Vá para a aba **Logs** da função no Dashboard
- Ou use: `supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc`

## 🧪 TESTE COMPLETO

### 1. Teste de Registro
1. Acesse: https://ia.geni.chat
2. Registre uma nova conta com email real
3. Verifique se o email chega

### 2. Verificar Email Recebido
O email deve conter:
- ✅ Remetente: `ConversaAI Brasil <validar@geni.chat>`
- ✅ URL de confirmação no formato:
  ```
  https://hpovwcaskorzzrpphgkc.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=https%3A//ia.geni.chat/confirmar-email
  ```

### 3. Teste de Confirmação
1. Clique no link do email
2. Deve redirecionar para: `https://ia.geni.chat/confirmar-email`
3. Não deve mostrar erro "Token inválido"

## 🔍 RESOLUÇÃO DE PROBLEMAS

### Email não chega
- Verificar configurações SMTP
- Confirmar senha de app Gmail
- Verificar logs da função

### URLs incorretas
- Confirmar `SITE_URL=https://ia.geni.chat`
- Verificar `PROJECT_REF=hpovwcaskorzzrpphgkc`

### Token inválido
- Verificar se token não expirou (24h)
- Testar com novo registro
- Verificar logs para erros

## 📞 PRÓXIMOS PASSOS

1. ✅ **Fazer upload da função** via Dashboard
2. ✅ **Configurar variáveis** de ambiente
3. ✅ **Testar sistema** completo
4. ✅ **Monitorar logs** por 24h
5. ✅ **Validar funcionamento** com usuários reais

---

**Arquivo ZIP:** `custom-email-function.zip` (pronto para upload)
**Dashboard:** https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/functions
**Status:** 🚀 Pronto para deploy manual
