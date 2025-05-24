# Instruções para implantação do sistema de e-mail personalizado usando Hostinger

## Configuração realizada

1. **Servidor de e-mail configurado**:
   - **E-mail**: validar@geni.chat
   - **Provedor**: Hostinger
   - **Servidor SMTP**: smtp.hostinger.com
   - **Porta SMTP**: 465 (SSL/TLS)
   - **Autenticação**: Senha normal (não necessita senha de aplicativo)

2. **Arquivos atualizados**:
   - `/supabase/config.toml`: Variáveis de ambiente SMTP configuradas
   - `/supabase/functions/custom-email/index.ts`: Função Edge atualizada para usar servidor Hostinger

## Passos para implementação

1. **Implantar a função Edge no Supabase**:
   ```bash
   cd supabase
   node deploy-functions.js custom-email
   ```

2. **Configurar o webhook no Console do Supabase**:
   - Acesse https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/templates
   - Em "Email Templates", certifique-se de que o "Custom Email Template Webhook" esteja habilitado
   - O URL deve ser: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email

3. **Testar o envio de e-mail**:
   ```bash
   node test-custom-email.js
   ```

## Verificação e monitoramento

Para verificar os logs da função Edge:
```bash
supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc
```

## Resolução de problemas comuns com SMTP da Hostinger

1. **Erro SSL/TLS**:
   - Certifique-se de estar usando a porta 465 (não 587)
   - Verifique se a opção `tls: true` está presente na configuração

2. **Falha na autenticação**:
   - Verifique se a senha está correta
   - A Hostinger pode bloquear tentativas após múltiplas falhas de autenticação

3. **E-mail não entregue ou bloqueado**:
   - Verifique se o SPF e DKIM estão configurados no painel da Hostinger
   - Verifique se não há limites de envio diário sendo excedidos
   - Confirme que o endereço de e-mail não está em blacklists

4. **Restrição de IP**:
   - O Supabase Edge Functions pode estar rodando em IPs que a Hostinger não reconhece
   - Você pode precisar pedir ao suporte da Hostinger para permitir envios de e-mail de IPs desconhecidos

## Observações importantes

- A função Edge foi atualizada para incluir logs detalhados para facilitar a depuração
- O e-mail remetente foi alterado para validar@geni.chat, mas o Reply-To continua sendo suporte@conversaai.com.br
- O template HTML foi atualizado para informar que o e-mail vem de validar@geni.chat

Para mais informações sobre a implementação completa, consulte `/docs/email-personalizado.md`
