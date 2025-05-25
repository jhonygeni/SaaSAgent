import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ ERRO: Variáveis SUPABASE_URL ou SUPABASE_ANON_KEY não definidas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Email de teste aleatório para evitar conflitos
const testEmail = `test${Math.floor(Math.random() * 10000)}@example.com`;
const password = 'Password123!';

console.log(`🔍 TESTE DE ENVIO DE EMAIL VIA SMTP DO SUPABASE`);
console.log(`📝 Usando email de teste: ${testEmail}`);

async function testSignup() {
  console.log('🔄 Tentando criar usuário de teste...');
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: password,
    });

    if (error) {
      console.error('❌ ERRO AO CRIAR USUÁRIO:', error.message);
      console.log('\n🔍 DIAGNÓSTICO POSSÍVEL:');
      
      if (error.message.includes('Email') || error.message.includes('email')) {
        console.log('- Problema com configuração de email do Supabase');
        console.log('- Verifique se o SMTP está configurado corretamente no dashboard');
      } 
      
      if (error.message.includes('Database')) {
        console.log('- Problema na estrutura do banco de dados');
        console.log('- Verifique se há triggers SQL personalizados que podem estar causando conflito');
      }
      
      return false;
    }

    console.log('✅ USUÁRIO CRIADO COM SUCESSO!');
    console.log('📧 Um email de confirmação deve ter sido enviado para:', testEmail);
    console.log('\nℹ️ Detalhes do usuário:');
    console.log('ID:', data.user?.id);
    console.log('Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    
    return true;
  } catch (err) {
    console.error('❌ ERRO INESPERADO:', err.message);
    return false;
  }
}

// Executar o teste
testSignup().then(success => {
  if (success) {
    console.log('\n✅ TESTE COMPLETO: Email de confirmação enviado');
    console.log('ℹ️ Como este é um email de teste, você não conseguirá realmente ver o email,');
    console.log('   mas pode verificar nos logs do Supabase se o email foi enviado com sucesso.');
  } else {
    console.log('\n❌ TESTE FALHOU: Email de confirmação não pôde ser enviado');
    console.log('\n📝 SOLUÇÕES POSSÍVEIS:');
    console.log('1. Verifique se as configurações SMTP estão corretas no dashboard do Supabase');
    console.log('2. Certifique-se de que o Auth Hook foi realmente removido');
    console.log('3. Verifique se há triggers SQL que possam estar causando conflito');
    console.log('4. Experimente outros métodos de autenticação como signInWithOtp para testar o envio de email');
  }
});
