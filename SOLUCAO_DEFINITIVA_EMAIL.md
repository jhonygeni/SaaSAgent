# SOLUÇÃO DEFINITIVA - PROBLEMA DE EMAIL NÃO CHEGANDO

## 🎯 PROBLEMA IDENTIFICADO

Os emails de confirmação não chegam no Gmail porque **a função Edge `custom-email` não está configurada corretamente no Supabase**.

## 📧 O QUE ESTÁ ACONTECENDO

1. ✅ O usuário é criado no Supabase (por isso aparece lá)
2. ❌ O email de confirmação não é enviado porque:
   - A função `custom-email` não está implantada OU
   - O webhook não está habilitado no Console OU  
   - As credenciais SMTP não estão configuradas

## 🔧 SOLUÇÃO PASSO A PASSO

### PASSO 1: Instalar Supabase CLI (se necessário)
```bash
npm install -g supabase
```

### PASSO 2: Fazer login no Supabase
```bash
supabase login
```

### PASSO 3: Implantar a função Edge
```bash
cd /Users/jhonymonhol/Desktop/SaaSAgent
supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc
```

### PASSO 4: Configurar variáveis de ambiente
```bash
supabase secrets set \
  SMTP_HOST="smtp.hostinger.com" \
  SMTP_PORT="465" \
  SMTP_USERNAME="validar@geni.chat" \
  SMTP_PASSWORD="[SUA_SENHA_REAL_AQUI]" \
  SITE_URL="https://ia.geni.chat" \
  PROJECT_REF="hpovwcaskorzzrpphgkc" \
  --project-ref hpovwcaskorzzrpphgkc
```

### PASSO 5: 🔗 HABILITAR WEBHOOK NO CONSOLE (CRÍTICO!)

**Esta é a parte mais importante:**

1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates
2. Procure por **"Custom Email Template Webhook"**
3. **MARQUE a caixa** "Enable custom email template webhook" 
4. Configure a URL: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`
5. **SALVE** as configurações

### PASSO 6: Testar
1. Vá para: http://localhost:5173/registrar
2. Registre um novo usuário
3. Verifique se o email chegou

## 🔍 VERIFICAÇÕES

### Verificar se a função está implantada:
```bash
supabase functions list --project-ref hpovwcaskorzzrpphgkc
```

### Verificar logs da função:
```bash
supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc
```

### Testar a função diretamente:
```bash
curl -X POST "https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email" \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","type":"signup","token":"test-token"}'
```

## ⚠️ PONTOS CRÍTICOS

1. **Webhook não habilitado**: Este é o erro #1. Mesmo que tudo esteja configurado, se o webhook não estiver habilitado no Console, o Supabase não vai chamar a função.

2. **Senha SMTP incorreta**: Se a senha do email `validar@geni.chat` estiver errada, a função vai falhar.

3. **Função não implantada**: Se a função não foi implantada corretamente, ela não vai existir no Supabase.

## 💡 DICA IMPORTANTE

O **webhook precisa estar HABILITADO no Console**. Esta é uma configuração que só pode ser feita manualmente no dashboard do Supabase. Mesmo que a função esteja implantada e as variáveis configuradas, se o webhook não estiver habilitado, nada vai funcionar.

## 🎯 RESUMO RÁPIDO

1. Instalar/configurar Supabase CLI
2. Implantar função `custom-email`
3. Configurar variáveis SMTP (incluindo senha real)
4. **HABILITAR webhook no Console** ← MAIS IMPORTANTE
5. Testar registro

Após seguir estes passos, os emails devem começar a chegar normalmente!
