# Sistema de Email Personalizado - ConversaAI Brasil

## Visão Geral

Este sistema substitui o processo padrão de envio de emails do Supabase por uma solução personalizada que utiliza o servidor SMTP da Hostinger com o endereço `validar@geni.chat`.

## Componentes Principais

1. **Função Edge do Supabase** (`supabase/functions/custom-email/index.ts`)
   - Recebe requisições do webhook do Supabase
   - Envia emails personalizados através do servidor SMTP da Hostinger

2. **Configuração do Webhook** (via console do Supabase)
   - URL: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`

## Tipos de Emails Suportados

- Confirmação de cadastro (`signup`, `email_signup`)
- Alteração de email (`email_change`)
- Recuperação de senha (`recovery`, `password_recovery`)

## Variáveis de Ambiente

As seguintes variáveis de ambiente precisam ser configuradas na função Edge:

- `SMTP_HOST` - Servidor SMTP (exemplo: smtp.hostinger.com)
- `SMTP_PORT` - Porta do servidor SMTP (exemplo: 465 para SSL)
- `SMTP_USERNAME` - Email de envio (exemplo: noreply@seudominio.com)
- `SMTP_PASSWORD` - Senha do email (NUNCA armazene em repositórios!)
- `SITE_URL` - URL base do site (exemplo: https://seusite.com)

Veja o arquivo `.env.example` para um modelo de configuração e crie um arquivo `.env` com suas credenciais reais.

## Scripts de Teste

1. **Teste da Função Edge** (`test-custom-email-webhook.js`)
   - Envia uma requisição direta para a função Edge
   - Verifica se a resposta é positiva

2. **Teste de Fluxo Completo** (`test-signup-flow.js`)
   - Testa o fluxo de cadastro com a API do Supabase
   - Verifica se o email é enviado corretamente

3. **Verificação de Logs** (`check-edge-function-logs.sh`)
   - Exibe os logs da função Edge para diagnóstico

## Processo de Atualização

Para atualizar a função Edge após modificações:

```bash
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil/supabase
supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc
```

## Manutenção

- Monitore regularmente os logs para identificar falhas no envio
- Verifique se o servidor SMTP da Hostinger está funcionando corretamente
- Atualize o template de email conforme necessário no arquivo da função Edge

Para detalhes completos sobre implementação e testes, consulte o arquivo `SETUP_GUIDE.md`.
