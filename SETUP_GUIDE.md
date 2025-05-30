# Guia de Implementação e Teste do Sistema de Email Personalizado

## 1. Configurar o Webhook no Console do Supabase

1. Acesse o console do Supabase: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates
2. Na seção Authentication, navegue até "Email Templates"
3. Localize a opção "Custom Email Template Webhook" e ative-a
4. Configure a URL do webhook: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`
5. Salve as alterações

## 2. Testar a Função Edge

### Teste Direto da Função

Execute o script de teste para verificar se a função está funcionando:

```bash
node test-custom-email-webhook.js
```

### Verificar Logs da Função Edge

Execute o script para verificar os logs:

```bash
./check-edge-function-logs.sh
```

Para monitorar logs em tempo real:

```bash
supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc --no-verify --follow
```

## 3. Testar Fluxo Completo de Cadastro

1. Abra a aplicação: https://app.conversaai.com.br
2. Crie uma nova conta usando um endereço de email real
3. Verifique se o email de confirmação foi recebido na sua caixa de entrada
4. Verifique se o email foi enviado por `validar@geni.chat`
5. Clique no link de confirmação e verifique se o fluxo completo funciona

## 4. Solução de Problemas

### Problemas com o SMTP
- Verifique se as credenciais SMTP estão corretas
- Confirme se a porta 465 está liberada para envio de emails
- Verifique se o servidor SMTP da Hostinger está configurado para permitir envios da função Edge

### Problemas com o Webhook
- Verifique se a URL está corretamente configurada no console do Supabase
- Verifique se a função Edge está ativa e respondendo
- Verifique os logs da função para detectar erros específicos

### Problemas com os Emails
- Verifique se os emails não estão sendo bloqueados por filtros de spam
- Confirme se os templates HTML estão formatados corretamente
- Verifique se os links gerados nos emails são válidos

## 5. Documentação e Manutenção

### Arquivos Principais
- `/supabase/functions/custom-email/index.ts` - Função Edge que envia os emails
- `/test-custom-email-webhook.js` - Script para testar a função
- `/check-edge-function-logs.sh` - Script para verificar logs

### Como Atualizar
Para implementar mudanças na função Edge:

```bash
cd /Users/jhonymonhol/Desktop/conversa-ai-brasil/supabase
supabase functions deploy custom-email --project-ref hpovwcaskorzzrpphgkc
```

### Como Monitorar
Para monitoramento contínuo, configure alertas para falhas nos logs da função Edge.
