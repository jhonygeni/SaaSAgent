// Teste de fluxo completo usando a API do Supabase com o novo domínio
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do projeto Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
// Usar variável de ambiente para chaves sensíveis ou usar a chave existente como fallback
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTU5NDI5NTYsImV4cCI6MTk3MTUxODk1Nn0.CqtbnT5KwQsCoRiurG-_T2cyOzHS8m7ktmyKmO5T4S8';

// Importante: considere remover chaves hardcoded e usar apenas variáveis de ambiente no futuro

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para testar o fluxo de cadastro
const testSignupFlow = async () => {
  console.log('🧪 Iniciando teste de fluxo de cadastro com novo domínio');
  
  // Gerar um email de teste único
  const testEmail = `test-${Math.floor(Math.random() * 10000)}@example.com`;
  const testPassword = 'TestPassword123!';
  
  console.log(`📧 Tentando cadastro com: ${testEmail}`);
  
  try {
    // Tentar cadastrar um novo usuário
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Usuário de Teste',
        },
        emailRedirectTo: 'https://saa-s-agent.vercel.app/confirmar-email'
      }
    });
    
    if (error) {
      console.error('❌ Erro no cadastro:', error.message);
      return;
    }
    
    console.log('✅ Cadastro realizado com sucesso!');
    console.log('📊 Dados retornados:', JSON.stringify(data, null, 2));
    console.log('\n🔍 Verifique:');
    console.log('1. Se você recebeu um email no endereço do administrador');
    console.log('2. Se o email foi enviado por: validar@geni.chat');
    console.log('3. Se o conteúdo do email inclui o novo domínio: saa-s-agent.vercel.app');
    console.log('4. Se o link de confirmação funciona corretamente e redireciona para o novo domínio');
    
    console.log('\n⚠️ Importante: Como este é um email de teste, você não terá acesso à caixa de entrada.');
    console.log('   Você deve monitorar os logs da função Edge para verificar se o email foi enviado com sucesso:');
    console.log('   ./check-edge-function-logs.sh');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
};

// Executar o teste
testSignupFlow();

// Para executar: 
// node test-new-domain.js
