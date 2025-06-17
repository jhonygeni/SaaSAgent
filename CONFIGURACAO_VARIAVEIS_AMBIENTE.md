# Configuração das Variáveis de Ambiente - Supabase Edge Functions

## ⚠️ IMPORTANTE: Configure Antes de Testar

Antes de testar o sistema de confirmação de email, você DEVE configurar as seguintes variáveis de ambiente no Dashboard do Supabase.

## 📍 Como Acessar as Configurações

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto (hpovwcaskorzzrpphgkc)
3. Vá para **Settings** → **Edge Functions**
4. Clique na aba **Environment Variables**

## 🔧 Variáveis Obrigatórias

Configure exatamente estas variáveis:

### URLs e Configurações do Site
```
SITE_URL=https://ia.geni.chat
SUPPORT_EMAIL=suporte@geni.chat
PROJECT_REF=hpovwcaskorzzrpphgkc
```

### Configurações SMTP (Gmail)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USERNAME=validar@geni.chat
SMTP_PASSWORD=[senha_de_app_do_gmail]
```

### Configurações Opcionais (usar valores padrão se não definidas)
```
EMAIL_FROM_NAME=ConversaAI Brasil
EMAIL_FROM_ADDRESS=validar@geni.chat
EMAIL_REPLY_TO=suporte@geni.chat
```

## 🔑 Como Obter a Senha de App do Gmail

1. Acesse [myaccount.google.com](https://myaccount.google.com)
2. Vá para **Segurança** → **Verificação em duas etapas**
3. Role para baixo e clique em **Senhas de app**
4. Selecione **Aplicativo** → **Email**
5. Selecione **Dispositivo** → **Outro (nome personalizado)**
6. Digite "ConversaAI Supabase" como nome
7. Copie a senha gerada de 16 caracteres
8. Use esta senha na variável `SMTP_PASSWORD`

## 🚀 Após Configurar as Variáveis

1. Execute o script de deploy:
   ```bash
   ./deploy-custom-email-fix.sh
   ```

2. Teste o sistema:
   - Registre um novo usuário
   - Verifique se o email chega com URLs corretas
   - Confirme que redireciona para `https://ia.geni.chat`

## 🔍 Verificação das URLs nos Emails

Os emails devem conter URLs no formato:
```
https://hpovwcaskorzzrpphgkc.supabase.co/auth/v1/verify?token=...&type=signup&redirect_to=https%3A//ia.geni.chat/confirmar-email
```

## 📊 Monitoramento

Para monitorar os logs da função:
```bash
supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc
```

## ❌ Problemas Comuns

### Email não chega
- Verifique se as configurações SMTP estão corretas
- Confirme se a senha de app do Gmail está válida
- Verifique os logs da função

### URLs incorretas nos emails
- Confirme se `SITE_URL=https://ia.geni.chat` está configurado
- Verifique se `PROJECT_REF=hpovwcaskorzzrpphgkc` está correto

### Token inválido
- Verifique se o token não expirou (24 horas)
- Confirme se o formato da URL está correto
- Teste com um novo registro de usuário

## 🎯 Resultado Esperado

Após a configuração correta:
1. ✅ Emails chegam com domínio correto (ia.geni.chat)
2. ✅ Links redirecionam para https://ia.geni.chat/confirmar-email
3. ✅ Confirmação funciona sem erro de "Token inválido"
4. ✅ Usuário é redirecionado corretamente após confirmação
