import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Verificando estrutura do banco de dados...');
  
  try {
    // Verificar planos de assinatura
    console.log('📋 Verificando planos de assinatura...');
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*');
    
    if (plansError) {
      console.error('❌ Erro ao verificar planos:', plansError);
    } else {
      console.log(`✅ Planos disponíveis: ${plans.length}`);
      plans.forEach(plan => console.log(`  - ${plan.name}: R$${plan.price}`));
    }
    
    // Verificar usuários recentes
    console.log('\n👥 Verificando perfis de usuário...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (usersError) {
      console.error('❌ Erro ao verificar usuários:', usersError);
    } else {
      console.log(`✅ Perfis encontrados: ${users.length}`);
      users.forEach(user => console.log(`  - ${user.full_name || 'Sem nome'} (${user.created_at})`));
    }
    
    // Verificar assinaturas
    console.log('\n💰 Verificando assinaturas...');
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('*, subscription_plans(name)')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (subsError) {
      console.error('❌ Erro ao verificar assinaturas:', subsError);
    } else {
      console.log(`✅ Assinaturas encontradas: ${subscriptions.length}`);
      subscriptions.forEach(sub => 
        console.log(`  - Usuário: ${sub.user_id} | Plano: ${sub.subscription_plans?.name} | Status: ${sub.status}`)
      );
    }
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

async function testEmailWebhook() {
  console.log('\n📧 Testando webhook de email...');
  
  try {
    const testPayload = {
      email: 'teste-diagnostico@exemplo.com',
      type: 'signup',
      token: 'test-token-' + Date.now(),
      redirect_to: 'https://app.conversaai.com.br/confirmar-email',
      metadata: {
        name: 'Teste Diagnóstico'
      }
    };
    
    console.log('📤 Testando função custom-email...');
    
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

async function checkAuthConfig() {
  console.log('\n🔐 Verificando configuração de autenticação...');
  
  try {
    // Tentar um signup de teste para ver se os triggers funcionam
    const testEmail = `teste-trigger-${Date.now()}@exemplo.com`;
    console.log(`📝 Testando signup com email: ${testEmail}`);
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123!@#',
      options: {
        data: {
          name: 'Teste Trigger'
        }
      }
    });
    
    if (error) {
      console.error('❌ Erro no signup de teste:', error);
    } else {
      console.log('✅ Signup executado. User ID:', data.user?.id);
      
      // Aguardar um pouco para os triggers executarem
      console.log('⏳ Aguardando triggers executarem...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar se o perfil foi criado
      if (data.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Perfil não foi criado automaticamente:', profileError);
        } else {
          console.log('✅ Perfil criado automaticamente:', profile);
        }
        
        // Verificar se a assinatura foi criada
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('*, subscription_plans(name)')
          .eq('user_id', data.user.id)
          .single();
        
        if (subError) {
          console.error('❌ Assinatura não foi criada automaticamente:', subError);
        } else {
          console.log('✅ Assinatura criada automaticamente:', subscription);
        }
      }
    }
    
  } catch (err) {
    console.error('💥 Erro no teste de autenticação:', err);
  }
}

async function main() {
  console.log('🚀 Iniciando diagnóstico completo da aplicação ConversaAI Brasil\n');
  
  await checkDatabase();
  await testEmailWebhook();
  await checkAuthConfig();
  
  console.log('\n✅ Diagnóstico completo finalizado!');
}

main().catch(console.error);
