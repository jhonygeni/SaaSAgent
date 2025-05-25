const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 CORRIGINDO PROBLEMAS DE AUTENTICAÇÃO NO SUPABASE');

// 1. Verificar se arquivo .env existe
console.log('Verificando arquivo .env...');
const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ Arquivo .env não encontrado! Criando a partir do exemplo...');
  try {
    fs.copyFileSync(path.join(__dirname, '.env.example'), envPath);
    console.log('✅ Arquivo .env criado. Por favor, edite-o com suas credenciais.');
  } catch (err) {
    console.error('❌ Erro ao criar .env:', err.message);
  }
}

// 2. Sugerir remover Auth Hook
console.log(`
🔴 PASSO PRINCIPAL: REMOVER O AUTH HOOK

Para resolver o erro "Database error saving new user", você precisa:

1. Acessar o Dashboard do Supabase: https://supabase.com/dashboard
2. Selecionar o projeto: hpovwcaskorzzrpphgkc
3. No menu lateral, ir para Authentication → Hooks
4. Desativar ou remover TODOS os hooks existentes
5. Confirmar que o hook para custom-email foi removido

⚠️ IMPORTANTE: Verifique se todos os hooks estão removidos ou desativados.
`);

// 3. Sugerir configuração SMTP
console.log(`
🟡 CONFIGURAÇÃO SMTP:

1. No Dashboard Supabase, vá para Authentication → Settings
2. Role até "SMTP Settings" e configure:
   - Host: smtp.hostinger.com
   - Port: 465
   - Username: validar@geni.chat 
   - Password: [a senha do arquivo .env]
   - Sender Name: ConversaAI Brasil
   - Sender Email: validar@geni.chat
3. Salve as alterações
4. Teste com o botão "Send Test Email"
`);

// 4. Sugerir configuração de URLs
console.log(`
🟡 CONFIGURAÇÃO DE URLs:

1. No Dashboard Supabase, vá para Authentication → URL Configuration
2. Configure:
   - Site URL: ${process.env.SITE_URL || 'https://app.conversaai.com.br'}
   - Redirect URL for signup confirmations: ${process.env.SITE_URL || 'https://app.conversaai.com.br'}/confirmar-email
   - Redirect URL for password resets: ${process.env.SITE_URL || 'https://app.conversaai.com.br'}/redefinir-senha
3. Salve as alterações
`);

// 5. Verificar os triggers SQL
console.log(`
🟡 VERIFICAR TRIGGERS SQL:

O erro "Database error saving new user" pode ocorrer se:
1. As tabelas necessárias não existem no banco de dados
2. O trigger SQL tenta inserir dados em tabelas que não existem

Execute o SQL a seguir no Console SQL do Supabase para verificar e criar as tabelas:

-- Verificar se as tabelas existem
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'profiles'
);

SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'subscription_plans'
);

SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'subscriptions'
);

-- Se as tabelas não existirem, você precisa criá-las antes de executar sql-triggers-completo.sql
`);

// 6. Instruções finais
console.log(`
🟢 APÓS TODAS AS CORREÇÕES:

1. Teste novamente o cadastro de um novo usuário
2. Se o erro persistir, verifique os logs SQL no Dashboard do Supabase
3. Considere temporariamente desabilitar o trigger SQL para testar se o problema está relacionado

💡 COMANDO PARA DESABILITAR TRIGGER (no Console SQL do Supabase):
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

💡 COMANDO PARA REATIVAR DEPOIS DOS TESTES:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();
`);

console.log('\n✅ Script de diagnóstico concluído.');
