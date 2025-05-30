// Teste de fluxo completo usando a API do Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do projeto Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'process.env.SUPABASE_ANON_KEY || ""'; // Fallback para a chave pública

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Função para testar o fluxo de cadastro
const testSignupFlow = async () => {
  console.log('🧪 Iniciando teste de fluxo de cadastro');
  
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
    console.log('3. Se o conteúdo do email está formatado corretamente');
    console.log('4. Se o link de confirmação funciona corretamente');
    
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
// node test-signup-flow.js
