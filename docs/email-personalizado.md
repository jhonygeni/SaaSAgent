# Guia de E-mail Personalizado - ConversaAI Brasil

Este documento contém instruções para a configuração do sistema de envio de e-mails personalizados usando o Supabase Edge Functions.

## Visão Geral

O sistema substitui o fluxo padrão de e-mails do Supabase por um sistema personalizado que envia e-mails diretamente do servidor da empresa, garantindo que os usuários recebam e-mails do domínio `@conversaai.com.br` em vez do domínio padrão do Supabase.

## Arquitetura

1. **Função Edge do Supabase**: `/supabase/functions/custom-email/index.ts`
   - Intercepta solicitações de envio de e-mail do Supabase
   - Formata e-mails personalizados
   - Envia e-mails via SMTP usando o servidor da empresa

2. **Configuração do Supabase**: `/supabase/config.toml`
   - Configura o webhook para usar a função Edge
   - Define variáveis de ambiente para a função (credenciais SMTP, etc.)

3. **Componentes Frontend**:
   - Registro (`src/components/Register.tsx`)
   - Login (`src/components/Login.tsx`) 
   - Página de Confirmação (`src/pages/EmailConfirmationPage.tsx`)
   - Página de Sucesso (`src/pages/EmailConfirmSuccessPage.tsx`)
   - Página de Reenvio de Confirmação (`src/pages/ResendConfirmationPage.tsx`)

## Pré-requisitos

- Servidor SMTP configurado (pode ser Gmail, SendGrid, Amazon SES, etc.)
- Credenciais SMTP (host, porta, usuário, senha)
- CLI do Supabase instalado: `npm install -g supabase`
- Login no CLI do Supabase: `supabase login`

## Configuração

### 1. Configurar variáveis de ambiente

Edite o arquivo `/supabase/config.toml`:

```toml
[functions.custom-email.environment]
SMTP_HOST = "seu-servidor-smtp.com"
SMTP_PORT = "587"
SMTP_USERNAME = "seu-email@seudominio.com"
SMTP_PASSWORD = "sua-senha-app"
SITE_URL = "https://app.seudominio.com"
```

### 2. Implantar função Edge

Opção 1: Usar script de deploy fornecido:
```bash
cd supabase
node deploy-functions.js custom-email
```

Opção 2: Deploy manual:
```bash
cd supabase
supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc
```

### 3. Verificar webhook

No console do Supabase:
1. Navegue até Authentication > Email Templates
2. Certifique-se de que o Custom Email Template Webhook esteja habilitado e configurado para:
   - URL: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`

## Fluxo de Usuário

1. O usuário registra-se na plataforma
2. O Supabase aciona a função Edge personalizada em vez de enviar o e-mail padrão
3. A função Edge formata um e-mail personalizado com a marca da empresa
4. O e-mail é enviado através do servidor SMTP configurado
5. O usuário recebe um e-mail do domínio da empresa (@conversaai.com.br)
6. O link de confirmação ainda funciona com o sistema de autenticação do Supabase

## Solução de Problemas

### E-mail não está sendo enviado:
- Verifique se as credenciais SMTP estão corretas
- Verifique os logs da função Edge no console do Supabase
- Teste a função manualmente com a CLI do Supabase

### Link de confirmação não funciona:
- Verifique se o URL de verificação está formatado corretamente:
  - Formato correto: `https://<ref>.supabase.co/auth/v1/verify?token=<token>&type=<type>&redirect_to=<url>`

### Verificação de logs:
```bash
supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc
```

## Recursos Adicionais

- [Documentação do Supabase sobre Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Guia do Deno para SMTP](https://deno.land/x/smtp@v0.7.0)
