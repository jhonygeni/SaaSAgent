# Correção de Problemas no UserContext e Webhook de Email

## Problemas Identificados

1. **Chamada Duplicada de Função** - O `UserContext.tsx` estava fazendo duas chamadas à função edge `check-subscription`, o que causava um travamento.

2. **URL Desatualizada** - O `SITE_URL` na função `custom-email` estava ainda usando `https://app.conversaai.com.br` em vez do novo domínio `https://saa-s-agent.vercel.app`.

3. **Dados não salvos nas tabelas** - Novos usuários não estavam tendo seus dados salvos corretamente nas tabelas `profiles`, `subscription_plans` e `subscriptions`.

## Como Corrigir

### 1. UserContext.tsx
✅ **CONCLUÍDO** - O arquivo foi substituído pela versão corrigida que não faz chamadas duplicadas.

```bash
# A correção já foi aplicada:
cp ./src/context/UserContext.fixed.tsx ./src/context/UserContext.tsx
```

### 2. Atualizar SITE_URL na Função Edge
Execute o script para atualizar a URL do site:

```bash
./update-site-url.sh
```

Isso atualiza a variável `SITE_URL` para `https://saa-s-agent.vercel.app` e reimplanta a função.

### 3. Aplicar Gatilhos SQL para Tabelas do Usuário
Execute o script para criar os gatilhos SQL que preenchem automaticamente as tabelas:

```bash
./apply-user-triggers.sh
```

Isso garantirá que quando um novo usuário for criado, registros serão automaticamente gerados nas tabelas:
- `profiles`: Cria um perfil para o usuário
- `subscription_plans`: Garante que existe um plano gratuito
- `subscriptions`: Cria uma assinatura gratuita para o usuário

### 4. Configurar o Webhook no Console do Supabase

Acesse o console do Supabase e faça as seguintes alterações manualmente:

1. **Configure o Webhook**
   - Navegue até Authentication -> Email Templates
   - Ative "Enable custom email template webhook"
   - Defina a URL para: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`

2. **Atualize as URLs de Redirecionamento**
   - Navegue até Authentication -> URL Configuration
   - Atualize todas as URLs para usar o novo domínio: `https://saa-s-agent.vercel.app`

## Como Testar

### 1. Teste o Registro de Usuário
```bash
node test-signup-flow.js
```

### 2. Verifique os Logs da Função Edge
```bash
./check-edge-function-logs.sh
```

### 3. Verifique os Registros do Banco de Dados
Após criar um usuário, verifique se os registros foram criados corretamente:
```bash
node verify-user-records.js <user_id>
```

## Reparos Manuais

Se você precisar reparar manualmente um usuário existente:
```bash
node repair-user-records.js <user_id>
```

Isso criará os registros necessários nas tabelas `profiles` e `subscriptions`.
