# Instruções para Atualizar o URL de Redirecionamento no Supabase

## Problema
Os emails de confirmação estão redirecionando para `localhost:3000` em vez de `https://saa-s-agent.vercel.app`.

## Solução

### 1. Atualize o URL do Site no Console do Supabase
1. Acesse: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/url-configuration
2. No campo "Site URL", substitua `http://localhost:3000` por `https://saa-s-agent.vercel.app`
3. Clique em "Save changes"

### 2. Atualize as Variáveis de Ambiente da Função Edge (Já feito)
A variável de ambiente SITE_URL foi atualizada para `https://app.conversaai.com.br` e a função Edge foi reimplantada.

### 3. Teste o Fluxo de Cadastro
1. Registre-se novamente com um novo email
2. Verifique se o email de confirmação foi enviado com o URL correto
3. Clique no link e confirme que ele redireciona para `https://saa-s-agent.vercel.app/confirmar-email`

### 4. Caso o Problema Persista
Se após as alterações acima o problema persistir, pode ser necessário:
1. Verificar outros locais de configuração de URL no Supabase
2. Revisar o código da aplicação front-end que pode estar enviando o URL de redirecionamento incorreto
3. Revisar os logs da função Edge para identificar a origem do URL incorreto

## Observações
- A alteração do URL do Site no Supabase afeta todos os fluxos de autenticação, incluindo confirmação de email, recuperação de senha e alteração de email.
- A alteração pode levar alguns minutos para ser propagada em todos os sistemas do Supabase.
- Se você estiver usando ambiente de desenvolvimento local, mantenha o URL como localhost apenas nesse ambiente.
