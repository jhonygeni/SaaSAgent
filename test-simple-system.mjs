#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧪 TESTANDO SISTEMA...\n');

async function testSystem() {
  try {
    // Verificar planos
    const { data: plans } = await supabase.from('subscription_plans').select('*');
    console.log('📊 Planos encontrados:', plans?.length || 0);
    
    // Verificar profiles
    const { data: profiles } = await supabase.from('profiles').select('*');
    console.log('👥 Perfis encontrados:', profiles?.length || 0);
    
    // Verificar subscriptions
    const { data: subs } = await supabase.from('subscriptions').select('*');
    console.log('💳 Assinaturas encontradas:', subs?.length || 0);
    
    console.log('\n✅ Teste concluído!');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testSystem();
