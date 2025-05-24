# Instruções para implantação do sistema de e-mail personalizado do Supabase

## 1. Passo a passo para implantação

1. **Atualizar as variáveis de ambiente reais no config.toml**:
   Substitua os valores de teste por suas credenciais SMTP reais em:
   `/supabase/config.toml`

2. **Implantar a função Edge no Supabase**:
   ```bash
   cd supabase
   node deploy-functions.js custom-email
   ```

3. **Configurar o webhook no Console do Supabase**:
   - Acesse https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates
   - Em "Email Templates", certifique-se de que o "Custom Email Template Webhook" esteja habilitado
   - O URL deve ser: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email

4. **Testar o envio de e-mail**:
   ```bash
   node test-custom-email.js
   ```

5. **Testar o fluxo completo**:
   - Registre um novo usuário na plataforma
   - Verifique se o e-mail recebido vem do domínio @conversaai.com.br
   - Teste o link de confirmação
   - Teste o processo de reenvio de confirmação

## 2. Monitoramento e logs

Para verificar os logs da função Edge:
```bash
supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc
```

## 3. Resolução de problemas comuns

1. **E-mail não está sendo enviado**:
   - Verifique se as credenciais SMTP estão corretas
   - Confirme se o servidor SMTP não está bloqueando conexões
   - Verifique os logs da função Edge

2. **Link de confirmação não funciona**:
   - Certifique-se de que o formato do URL está correto:
     `https://hpovwcaskorzzrpphgkc.supabase.co/auth/v1/verify?token=TOKEN&type=TYPE&redirect_to=URL`
   - Verifique se o token não está expirado (24h por padrão)

3. **Erros de renderização do e-mail**:
   - Teste o template HTML em diferentes clientes de e-mail
   - Considere usar uma ferramenta de teste de e-mail como Litmus ou Email on Acid

Para mais informações, consulte o documento completo em `/docs/email-personalizado.md`

