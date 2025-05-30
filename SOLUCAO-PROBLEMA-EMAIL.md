# Solução do Problema de Email no Supabase

## Diagnóstico do Problema

O erro `Database error saving new user` ocorre porque o trigger SQL que tenta inserir dados nas tabelas quando um novo usuário é criado está falhando. Os motivos possíveis são:

1. ✅ Você removeu o Auth Hook corretamente para usar o SMTP padrão do Supabase
2. ❌ Faltam tabelas ou registros necessários no banco de dados:
   - Não existe plano de assinatura gratuito na tabela `subscription_plans`
   - Possivelmente faltam tabelas necessárias

O diagnóstico realizado com o script `./final-diagnosis-and-fix.sh` confirmou:
```
❌ Nenhum plano de assinatura encontrado
```

## Solução Passo a Passo

### Passo 1: Configurar as Tabelas e Dados Necessários

1. Acesse o Dashboard do Supabase: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql
2. Abra o Editor SQL
3. Cole o conteúdo do arquivo `setup-database-tables.sql` que foi criado
4. Execute o script SQL
5. Isto vai:
   - Criar as tabelas necessárias (se não existirem)
   - Inserir um plano gratuito padrão
   - Configurar o trigger necessário

### Passo 2: Verificar Configurações de SMTP

1. No Dashboard Supabase, vá para **Authentication → Settings**
2. Role até a seção **SMTP Settings** e verifique:
   ```
   ✅ Enable custom SMTP: ATIVADO
   Host: smtp.hostinger.com
   Port: 465
   Username: validar@geni.chat
   Password: k7;Ex7~yh?cA
   Sender name: ConversaAI Brasil
   Sender email: validar@geni.chat
   ```
3. Salve as configurações
4. Teste enviando um email de teste usando o botão "Send Test Email"

### Passo 3: Configurar Templates de Email

1. Ainda em **Authentication → Settings**
2. Role até **Email Templates**
3. Configure os templates para cada tipo de email:
   - Confirm Signup
   - Change Email
   - Reset Password

### Passo 4: Configurar URLs de Redirecionamento

1. Vá para **Authentication → URL Configuration**
2. Configure:
   - Site URL: https://ia.geni.chat
   - Redirect URL for signup confirmations: https://ia.geni.chat/confirmar-email
   - Redirect URL for password resets: https://ia.geni.chat/redefinir-senha
3. Em **Redirect URLs**, adicione:
   - https://app.conversaai.com.br/**
   - http://localhost:5173/**

### Passo 5: Testar Cadastro de Usuário

Após realizar todas as configurações acima, teste o cadastro usando o script de teste já disponível no projeto:

```bash
node test-complete-signup.js
```

Este script testará:
1. A criação do usuário
2. Se o email de confirmação é enviado
3. Se o perfil e assinatura são criados automaticamente

## Verificação Final

Para confirmar que tudo está funcionando:

1. Tente criar um novo usuário na plataforma
2. Verifique se o email de confirmação é enviado
3. Confirme que o usuário é criado corretamente no banco de dados

### Solução Alternativa (se o problema persistir)

Se ainda houver falhas, você pode temporariamente desabilitar o trigger SQL para permitir que os usuários se registrem sem a criação automática de perfis e assinaturas:

```sql
-- Execute isso no Editor SQL do Supabase para desabilitar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
```

Após resolver os problemas estruturais do banco de dados, você pode reativar o trigger:

```sql
-- Para reativar depois que os problemas estiverem resolvidos
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();
```

### Outros Recursos de Diagnóstico

Se precisar de mais informações, o projeto tem estes úteis scripts de diagnóstico:
- `./quick-diagnostic.sh` - Diagnóstico rápido
- `./final-diagnosis-and-fix.sh` - Diagnóstico completo com sugestões de correção
