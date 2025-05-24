/**
 * Script para testar a função Edge de e-mail personalizado
 * 
 * Este script simula uma chamada para a função Edge de e-mail personalizado,
 * permitindo testar se está funcionando corretamente antes de implantá-la.
 * 
 * Atualizado para usar o servidor SMTP da Hostinger (validar@geni.chat)
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuração do cliente Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
let SUPABASE_KEY = '';

// Função para obter input do usuário
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Função para testar a função Edge
async function testCustomEmailFunction() {
  console.log('🧪 Teste da função Edge de e-mail personalizado (Hostinger)');
  console.log('--------------------------------------------------------');
  
  try {
    // Obter chave anônima
    if (!SUPABASE_KEY) {
      SUPABASE_KEY = await question('Digite sua chave anônima do Supabase (anon key): ');
    }
    
    // Inicializar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Obter e-mail de teste
    const email = await question('Digite o e-mail para teste: ');
    
    // Criar payload de teste
    const payload = {
      email: email,
      type: 'signup',
      token: 'test-token-' + Date.now(),
      redirect_to: 'http://localhost:3000/confirmar-email-sucesso',
      metadata: {
        name: 'Usuário de Teste'
      }
    };
    
    console.log('\n📧 Enviando solicitação para a função Edge...');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('\n⚠️ Importante: Este teste usará o servidor SMTP da Hostinger (validar@geni.chat)\n');
    
    // Exibir URL da função Edge que será chamada
    console.log(`\n🔗 Chamando função Edge em: ${SUPABASE_URL}/functions/v1/custom-email`);
    
    // Chamar a função Edge
    const { data, error } = await supabase.functions.invoke('custom-email', {
      body: payload
    });
    
    // Verificar resultado
    if (error) {
      console.error('❌ Erro ao chamar a função Edge:', error);
    } else {
      console.log('✅ Função Edge executada com sucesso!');
      console.log('Resposta:', data);
      
      console.log('\n🔍 Verifique:');
      console.log(`1. Se o e-mail foi recebido em ${email}`);
      console.log('2. Se o remetente é validar@geni.chat');
      console.log('3. Se o template do e-mail está formatado corretamente');
      console.log('4. Se o botão de confirmação funciona como esperado');
      
      console.log('\n📝 Para verificar os logs da função:');
      console.log('supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc');
    }
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    rl.close();
  }
}

testCustomEmailFunction();
