#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseServiceKey = 'process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Verificando estrutura do banco de dados...');
  
  try {
    // Verificar tabelas
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['profiles', 'subscription_plans', 'subscriptions']);
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError);
      return;
    }
    
    console.log('📋 Tabelas encontradas:', tables.map(t => t.table_name));
    
    // Verificar planos de assinatura
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*');
    
    if (plansError) {
      console.error('❌ Erro ao verificar planos:', plansError);
    } else {
      console.log('💰 Planos disponíveis:', plans.length);
      plans.forEach(plan => console.log(`  - ${plan.name}: R$${plan.price}`));
    }
    
    // Verificar usuários recentes
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao verificar usuários:', usersError);
    } else {
      console.log('👥 Usuários recentes:', users.length);
      users.forEach(user => console.log(`  - ${user.full_name || 'Sem nome'} (${user.created_at})`));
    }
    
    // Verificar triggers
    const { data: triggers, error: triggersError } = await supabase
      .rpc('exec_sql', { 
        sql: `SELECT trigger_name, event_manipulation, action_statement 
              FROM information_schema.triggers 
              WHERE trigger_schema = 'public' 
              AND event_object_table = 'users'` 
      });
    
    if (triggersError) {
      console.log('⚠️  Não foi possível verificar triggers (normal)');
    } else {
      console.log('⚡ Triggers encontrados:', triggers);
    }
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

async function testEmailWebhook() {
  console.log('\n📧 Testando webhook de email...');
  
  try {
    // Verificar se o webhook está configurado
    const webhookUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email';
    
    const testPayload = {
      email: 'teste-diagnostico@exemplo.com',
      type: 'signup',
      token: 'test-token-' + Date.now(),
      redirect_to: 'https://app.conversaai.com.br/confirmar-email',
      metadata: {
        name: 'Teste Diagnóstico'
      }
    };
    
    console.log('📤 Testando função diretamente:', testPayload);
    
    const { data, error } = await supabase.functions.invoke('custom-email', {
      body: testPayload
    });
    
    if (error) {
      console.error('❌ Erro na função custom-email:', error);
    } else {
      console.log('✅ Função custom-email respondeu:', data);
    }
    
  } catch (err) {
    console.error('💥 Erro no teste de webhook:', err);
  }
}

async function main() {
  await checkDatabase();
  await testEmailWebhook();
  process.exit(0);
}

main().catch(console.error);
