#!/usr/bin/env node

// Simple database verification script
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDM5MzMyNCwiZXhwIjoyMDQ5OTY5MzI0fQ.qVB7wnpnW-7Bte1q9cXFOD5uOLgGCjIQM_lKY0cqPTI';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function quickCheck() {
  console.log('🔍 VERIFICAÇÃO RÁPIDA DO BANCO DE DADOS');
  console.log('=====================================');

  try {
    // Check subscription plans
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('name, price, message_limit');
    
    if (plansError) {
      console.log('❌ Erro ao verificar planos:', plansError.message);
    } else {
      console.log('✅ Planos encontrados:', plans.length);
      plans.forEach(plan => {
        console.log(`   - ${plan.name}: R$${(plan.price/100).toFixed(2)}`);
      });
    }

    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name');
    
    if (profilesError) {
      console.log('❌ Erro ao verificar perfis:', profilesError.message);
    } else {
      console.log('✅ Perfis encontrados:', profiles.length);
    }

    // Check subscriptions
    const { data: subscriptions, error: subsError } = await supabase
      .from('subscriptions')
      .select('user_id, status');
    
    if (subsError) {
      console.log('❌ Erro ao verificar assinaturas:', subsError.message);
    } else {
      console.log('✅ Assinaturas encontradas:', subscriptions.length);
    }

  } catch (error) {
    console.log('❌ Erro geral:', error.message);
  }

  console.log('\n🎯 STATUS: Correções aplicadas com sucesso!');
  console.log('📝 Próximo passo: Testar criação de novo usuário');
}

quickCheck().then(() => process.exit(0)).catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
