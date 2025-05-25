# Guia para Resolver o Erro "User Already Registered" no Supabase

## 🚨 Problema
O erro `Failed to invite user: Failed to make POST request to "https://hpovwcaskorzzrpphgkc.supabase.co/auth/v1/invite". Check your project's Auth logs for more information. Error message: A user with this email address has already been registered` ocorre quando:

1. Você tenta enviar um convite para um usuário que **já está registrado** no sistema
2. A função "Invite user" do Supabase não permite convidar usuários já existentes

## 🔍 Diagnóstico

Este erro é esperado quando:
- Você tenta usar "Invite user" para um e-mail já cadastrado
- Você precisa enviar e-mails para usuários já existentes

## ✅ Soluções

### 1️⃣ Para testar com novos usuários:

Para testar o sistema de envio de e-mails com novos usuários:

- Use um e-mail temporário:
  * [10minutemail.com](https://10minutemail.com)
  * [temp-mail.org](https://temp-mail.org)
  * [mailinator.com](https://mailinator.com)

- Use variações de seu e-mail:
  * Se você usa Gmail: `seuemail+teste123@gmail.com` (o Gmail ignora o que está após o `+`)
  * Cada teste use um número diferente: `seuemail+teste456@gmail.com`

### 2️⃣ Para enviar e-mails a usuários já cadastrados:

**Opção A: Usar recuperação de senha**
Este script envia um e-mail de "recuperação de senha" para usuários existentes:

```bash
# Execute para enviar e-mail para um usuário já cadastrado
node test-enviar-email-usuario-existente.js usuario@exemplo.com
```

**Opção B: Usar a função custom-email diretamente**
Este script testa a função custom-email diretamente, que funciona com qualquer e-mail:

```bash
# Dê permissão de execução
chmod +x test-custom-email-direct.sh

# Execute para enviar e-mail para qualquer usuário
./test-custom-email-direct.sh usuario@exemplo.com
```

## 🔧 Verificação da Configuração SMTP

Se os e-mails não estão sendo enviados, verifique:

1. **Credenciais SMTP no .env:**
   ```
   SMTP_HOST=smtp.hostinger.com
   SMTP_PORT=465
   SMTP_USERNAME=validar@geni.chat
   SMTP_PASSWORD=SUA_NOVA_SENHA_AQUI
   ```

2. **Secrets configurados na função custom-email:**
   - Dashboard > Edge Functions > custom-email > Settings > Secrets
   - Adicione ou verifique os mesmos valores SMTP_* do seu .env

3. **Configuração SMTP no Supabase Auth:**
   - Dashboard > Authentication > Settings > SMTP Settings
   - Verifique se "Enable custom SMTP" está ativado
   - Confirme se os valores SMTP estão corretos

4. **Verificar logs de erro:**
   - Dashboard > Edge Functions > custom-email > Logs
   - Dashboard > Authentication > Logs

## 📧 Configuração Completa

Lembre-se de seguir o guia completo de configuração:
- Consulte [GUIA-CONFIGURAR-EMAIL-SUPABASE.md](./GUIA-CONFIGURAR-EMAIL-SUPABASE.md)
- Execute `node check-email-config.js` para verificar sua configuração atual

## ⚠️ Importante: Alterar senha exposta!

**Rotacione suas credenciais imediatamente:**
- A senha SMTP antiga `Vu1@+H*Mw^3` foi exposta e deve ser alterada
- Configure a nova senha em todos os locais (Hostinger, .env, Supabase)
