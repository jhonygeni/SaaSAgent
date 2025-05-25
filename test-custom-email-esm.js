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

// Configuração do cliente Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
let SUPABASE_KEY = 'process.env.SUPABASE_ANON_KEY || ""'; // Chave anônima do projeto

// Função para obter input do usuário
const question = (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
};

// Função para testar a função Edge
async function testCustomEmailFunction() {
  console.log('🧪 Teste da função Edge de e-mail personalizado (Hostinger)');
  console.log('--------------------------------------------------------');
  
  try {
    // Inicializar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Usar e-mail de teste fixo ou solicitar um
    const email = 'test@example.com'; // Substitua por seu email para teste
    console.log(`Usando e-mail de teste: ${email}`);
    
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
      
      // Tentar obter a resposta completa
      if (error.context && error.context.text) {
        try {
          const errorResponse = await error.context.text();
          console.error('Detalhes do erro:', errorResponse);
        } catch (textError) {
          console.error('Não foi possível ler o corpo da resposta:', textError);
        }
      }
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
  }
}

// Executar o teste
testCustomEmailFunction();
