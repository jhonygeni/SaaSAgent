# Correção de Registro de Usuários no Supabase

Este documento descreve como corrigir o problema onde novos usuários não estão tendo seus dados salvos corretamente nas tabelas `profiles`, `subscription_plans` e `subscriptions` do Supabase.

## Problema

Quando um usuário se cadastra através do componente `Register.tsx`, apenas o registro de autenticação é criado no Supabase Auth, mas não são criados:

1. Registro na tabela `profiles` com os dados do usuário
2. Verificação se existe um plano gratuito na tabela `subscription_plans`
3. Registro na tabela `subscriptions` vinculando o usuário ao plano gratuito

## Solução

A solução consiste em duas partes:

1. **Trigger de Banco de Dados**: Criar um gatilho (trigger) no Supabase que detecta quando novos usuários são criados e automaticamente cria os registros necessários.
2. **Atualização do UserContext**: Corrigir o contexto de usuário para utilizar a função `createUserWithDefaultPlan` que estava ausente.

## Implementação

### 1. Trigger de Banco de Dados

Execute o script `apply-user-triggers.sh` para criar o trigger no banco de dados:

```bash
./apply-user-triggers.sh
```

Este script:
- Cria uma função `handle_new_user_signup()` que é executada quando um novo usuário é registrado
- Configura um trigger `on_auth_user_created` na tabela `auth.users`
- Popula registros para usuários existentes que não têm perfis ou assinaturas

### 2. Atualização do UserContext

Substitua o arquivo `UserContext.tsx` pela versão corrigida:

```bash
cp ./src/context/UserContext.fixed.tsx ./src/context/UserContext.tsx
```

A versão corrigida implementa a função `createUserWithDefaultPlan` que estava faltando.

### 3. Configuração do Webhook

Acesse o Console do Supabase e siga estes passos:

1. Vá até Authentication -> Email Templates
2. Configure o URL do webhook para: `https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email`
3. Atualize a URL de redirecionamento de `http://localhost:3000` para `https://saa-s-agent.vercel.app`

## Verificação

Para verificar se um usuário específico tem os registros corretos no banco de dados:

```bash
node verify-user-records.js <user_id>
```

Este script verificará:
- Se o registro de autenticação existe
- Se o perfil do usuário foi criado
- Se a assinatura do plano gratuito está configurada

## Resolução de Problemas

Se novos usuários ainda não tiverem os registros corretos depois de aplicar esta solução:

1. Verifique os logs do Supabase para erros no trigger
2. Confirme que o usuário logado tem um estado válido através do console do navegador
3. Execute o script de verificação usando o ID do usuário problemático
