# Configuração do SMTP no Dashboard do Supabase

## 1. Acesso ao Dashboard
1. Acesse https://supabase.com/dashboard
2. Faça login e selecione o projeto: hpovwcaskorzzrpphgkc

## 2. Configuração SMTP
1. No menu lateral, vá para **Authentication → Settings**
2. Role para baixo até a seção **SMTP Settings**
3. Verifique se está configurado assim:

```
✅ Enable custom SMTP: ATIVADO (toggle ON)

Host: smtp.hostinger.com
Port: 465  
Username: validar@geni.chat
Password: k7;Ex7~yh?cA
Sender name: ConversaAI Brasil
Sender email: validar@geni.chat
```

4. Clique em **Save**

## 3. Teste de SMTP
1. Na mesma página, clique no botão **Send Test Email**
2. Verifique se o email de teste é recebido

## 4. Configuração de Email Templates
1. Role para baixo até a seção **Email Templates**
2. Configure os templates para os seguintes tipos de emails:
   - **Confirm Signup**: Use o template HTML que estava no arquivo function/custom-email/index.ts
   - **Change Email**: Atualize com conteúdo apropriado
   - **Reset Password**: Atualize com conteúdo apropriado

## 5. Configuração de URLs
1. Vá para **Authentication → URL Configuration**
2. Defina o **Site URL** como: https://ia.geni.chat (conforme configurado no seu .env)
3. Configure as URLs de redirecionamento:
   - **Redirect URL for signup confirmations**: https://ia.geni.chat/confirmar-email
   - **Redirect URL for password resets**: https://ia.geni.chat/redefinir-senha

## 6. Após todas as configurações
1. Salve todas as alterações
2. Teste novamente a criação de um novo usuário
