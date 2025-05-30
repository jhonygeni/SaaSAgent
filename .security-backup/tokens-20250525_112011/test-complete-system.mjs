#!/usr/bin/env node

// Teste completo do sistema ConversaAI Brasil
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.PcOQzSbU5aH8X8gQbFZBpJzKwU7E-wUJ_YQa0VLgTRo';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testEmailFunction() {
  console.log('\n📧 1. TESTANDO FUNÇÃO DE EMAIL...');
  
  try {
    const testResponse = await fetch(`${supabaseUrl}/functions/v1/custom-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'signup',
        user: {
          email: 'teste@conversaai.com.br',
          email_confirm: 'https://app.conversaai.com.br/confirmar-email?token=abc123'
        }
      })
    });

    const responseText = await testResponse.text();
    
    if (testResponse.ok) {
      console.log('✅ Função custom-email está funcionando!');
      console.log('📨 Resposta:', responseText);
    } else {
      console.log('❌ Função custom-email falhou');
      console.log('📨 Status:', testResponse.status);
      console.log('📨 Resposta:', responseText);
    }
  } catch (error) {
    console.error('❌ Erro ao testar função de email:', error);
  }
}

async function testDatabase() {
  console.log('\n🗄️  2. TESTANDO BANCO DE DADOS...');
  
  try {
    // Verificar planos
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('subscription_plans')
      .select('*');

    if (plansError) {
      console.error('❌ Erro ao verificar planos:', plansError);
    } else {
      console.log(`✅ ${plans.length} planos encontrados:`);
      plans.forEach(plan => {
        console.log(`   - ${plan.name}: R$ ${plan.price} (${plan.message_limit} msgs)`);
      });
    }

    // Verificar tabelas existentes
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (!profilesError) {
      console.log(`✅ Tabela profiles existe (${profiles.count || 0} registros)`);
    } else {
      console.log('❌ Problema com tabela profiles:', profilesError.message);
    }

    const { data: subscriptions, error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .select('count', { count: 'exact', head: true });

    if (!subscriptionsError) {
      console.log(`✅ Tabela subscriptions existe (${subscriptions.count || 0} registros)`);
    } else {
      console.log('❌ Problema com tabela subscriptions:', subscriptionsError.message);
    }

  } catch (error) {
    console.error('❌ Erro ao testar banco:', error);
  }
}

async function testCompleteSignup() {
  console.log('\n👤 3. TESTANDO CADASTRO COMPLETO...');
  
  const testEmail = `teste-${Date.now()}@conversaai.com.br`;
  const testPassword = 'MinhaSenh@123';
  
  try {
    console.log(`📝 Tentando cadastrar usuário: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Usuário Teste ConversaAI'
        }
      }
    });

    if (error) {
      console.error('❌ Erro no cadastro:', error);
      return;
    }

    console.log('✅ Usuário cadastrado com sucesso!');
    console.log('👤 ID do usuário:', data.user?.id);
    console.log('📧 Email de confirmação será enviado para:', testEmail);
    
    // Aguardar um pouco para triggers executarem
    console.log('⏳ Aguardando 3 segundos para triggers executarem...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verificar se perfil foi criado
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profileError && profile) {
      console.log('✅ Perfil criado automaticamente!');
      console.log('👤 Nome:', profile.full_name);
    } else {
      console.log('❌ Perfil NÃO foi criado automaticamente');
      console.log('🔧 Triggers não estão funcionando');
    }
    
    // Verificar se assinatura foi criada
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('user_id', data.user.id)
      .single();

    if (!subscriptionError && subscription) {
      console.log('✅ Assinatura criada automaticamente!');
      console.log('📦 Plano:', subscription.subscription_plans.name);
    } else {
      console.log('❌ Assinatura NÃO foi criada automaticamente');
      console.log('🔧 Triggers não estão funcionando');
    }

  } catch (error) {
    console.error('❌ Erro inesperado no teste de cadastro:', error);
  }
}

async function checkAuthConfiguration() {
  console.log('\n⚙️  4. VERIFICANDO CONFIGURAÇÃO DE AUTH...');
  
  console.log('📋 CHECKLIST DE CONFIGURAÇÃO:');
  console.log('');
  console.log('🔗 Auth Hooks:');
  console.log('   ⚠️  Precisa ser configurado MANUALMENTE no console');
  console.log('   📍 https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings');
  console.log('   📧 Send Email Hook: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
  console.log('');
  console.log('🔄 Redirect URLs:');
  console.log('   📍 https://app.conversaai.com.br/**');
  console.log('   📍 http://localhost:5173/**');
  console.log('');
  console.log('🛠️  SQL Triggers:');
  console.log('   📍 Execute o SQL no console: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql');
}

async function main() {
  console.log('🚀 TESTE COMPLETO - ConversaAI Brasil');
  console.log('=====================================');
  
  await testEmailFunction();
  await testDatabase();
  await testCompleteSignup();
  await checkAuthConfiguration();
  
  console.log('\n✅ TESTE CONCLUÍDO!');
  console.log('\n📖 Próximos passos em: CONFIGURACAO-MANUAL-OBRIGATORIA.md');
}

main().catch(console.error);
