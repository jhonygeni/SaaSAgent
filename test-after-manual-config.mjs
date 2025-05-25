#!/usr/bin/env node

// Teste após configurações manuais
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const anonKey = 'process.env.SUPABASE_ANON_KEY || "";
const serviceKey = 'process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function testAfterConfig() {
  console.log('🧪 TESTE APÓS CONFIGURAÇÕES MANUAIS');
  console.log('='.repeat(45));

  // 1. Verificar reparos dos usuários existentes
  console.log('\n👥 1. VERIFICANDO REPAROS DOS USUÁRIOS...');
  
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error('❌ Erro ao verificar perfis:', error);
    } else {
      console.log(`✅ ${profiles.length} perfis encontrados (esperado: 4)`);
    }

    const { data: subscriptions, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, subscription_plans(name)');
    
    if (subError) {
      console.error('❌ Erro ao verificar assinaturas:', subError);
    } else {
      console.log(`✅ ${subscriptions.length} assinaturas encontradas (esperado: 4)`);
    }
  } catch (error) {
    console.error('❌ Erro na verificação:', error.message);
  }

  // 2. Testar cadastro de novo usuário
  console.log('\n🆕 2. TESTANDO CADASTRO DE NOVO USUÁRIO...');
  
  const testEmail = `teste-${Date.now()}@conversaai.com.br`;
  console.log(`📝 Tentando cadastrar: ${testEmail}`);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: '123456789',
      options: {
        data: {
          name: 'Usuário Teste'
        }
      }
    });

    if (error) {
      console.error('❌ Erro no cadastro:', error.message);
    } else {
      console.log('✅ Usuário cadastrado com sucesso!');
      console.log(`📧 Email de confirmação deve ter sido enviado para: ${testEmail}`);
      
      // Aguardar um pouco para o trigger funcionar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Verificar se perfil foi criado
      const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
        
      if (newProfile) {
        console.log('✅ Perfil criado automaticamente!');
      } else {
        console.log('❌ Perfil NÃO foi criado');
      }
      
      // Verificar se assinatura foi criada
      const { data: newSub } = await supabaseAdmin
        .from('subscriptions')
        .select('*, subscription_plans(name)')
        .eq('user_id', data.user.id)
        .single();
        
      if (newSub) {
        console.log(`✅ Assinatura criada automaticamente: ${newSub.subscription_plans?.name}`);
      } else {
        console.log('❌ Assinatura NÃO foi criada');
      }
    }
  } catch (error) {
    console.error('❌ Erro no teste de cadastro:', error.message);
  }

  // 3. Reenviar email para usuário pendente
  console.log('\n📨 3. REENVIANDO EMAIL PARA USUÁRIO PENDENTE...');
  
  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey
      },
      body: JSON.stringify({
        email: 'moscalucasmosca@gmail.com',
        type: 'signup'
      })
    });

    const result = await response.text();
    console.log('✅ Email reenviado:', result);
  } catch (error) {
    console.error('❌ Erro ao reenviar email:', error.message);
  }

  console.log('\n🎯 TESTE CONCLUÍDO!');
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Verifique se emails de confirmação estão chegando');
  console.log('2. Teste o login após confirmar email');
  console.log('3. Verifique se novos usuários criam perfil/assinatura automaticamente');
}

testAfterConfig();
