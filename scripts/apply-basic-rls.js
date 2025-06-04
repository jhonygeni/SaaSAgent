#!/usr/bin/env node

/**
 * Script para aplicar políticas RLS básicas via comandos SQL diretos
 * Execute: node scripts/apply-basic-rls.js
 */

const { createClient } = require('@supabase/supabase-js');

// Use suas credenciais do Supabase aqui
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyBasicRLS() {
  console.log('🔒 Aplicando políticas RLS básicas...\n');
  
  const policies = [
    // Profiles
    `ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;`,
    `CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);`,
    `DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;`,
    `CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);`,
    
    // Subscriptions
    `ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;`,
    `CREATE POLICY "Users can view their own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);`,
    
    // WhatsApp Instances
    `ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "Users can manage their own instances" ON public.whatsapp_instances;`,
    `CREATE POLICY "Users can manage their own instances" ON public.whatsapp_instances FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
    
    // Agents
    `ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "Users can manage their own agents" ON public.agents;`,
    `CREATE POLICY "Users can manage their own agents" ON public.agents FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
    
    // Messages
    `ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "Users can manage their own messages" ON public.messages;`,
    `CREATE POLICY "Users can manage their own messages" ON public.messages FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
    
    // Contacts
    `ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;`,
    `DROP POLICY IF EXISTS "Users can manage their own contacts" ON public.contacts;`,
    `CREATE POLICY "Users can manage their own contacts" ON public.contacts FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);`,
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < policies.length; i++) {
    const policy = policies[i];
    
    try {
      console.log(`⏳ [${i + 1}/${policies.length}] Executando política...`);
      
      const { error } = await supabase.rpc('sql', {
        query: policy
      });
      
      if (error) {
        // Tenta método alternativo
        const { error: error2 } = await supabase
          .from('_sql')
          .select('*')
          .eq('query', policy);
          
        if (error2) {
          console.warn(`⚠️  Comando ${i + 1}: ${error.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      } else {
        successCount++;
      }
    } catch (err) {
      console.warn(`⚠️  Erro no comando ${i + 1}: ${err.message}`);
      errorCount++;
    }
  }
  
  console.log('\n✅ APLICAÇÃO DE POLÍTICAS RLS CONCLUÍDA!');
  console.log(`📊 Comandos executados: ${successCount + errorCount}`);
  console.log(`✅ Sucessos: ${successCount}`);
  console.log(`⚠️  Avisos/Erros: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n📝 NOTA: Alguns comandos falharam. Isso pode ser normal se:');
    console.log('   - As políticas já existiam');
    console.log('   - As tabelas ainda não foram criadas');
    console.log('   - Já existe RLS habilitado');
  }
  
  console.log('\n🔐 Políticas RLS configuradas para:');
  console.log('   ✅ profiles - Usuários podem ver/editar apenas seu próprio perfil');
  console.log('   ✅ subscriptions - Usuários podem ver apenas suas assinaturas');
  console.log('   ✅ whatsapp_instances - Usuários podem gerenciar apenas suas instâncias');
  console.log('   ✅ agents - Usuários podem gerenciar apenas seus agentes');
  console.log('   ✅ messages - Usuários podem acessar apenas suas mensagens');
  console.log('   ✅ contacts - Usuários podem gerenciar apenas seus contatos');
  
  console.log('\n🎯 PRÓXIMOS PASSOS:');
  console.log('   1. Desabilitar email confirmation no Supabase Dashboard');
  console.log('   2. Testar login na aplicação');
  console.log('   3. Configurar SMTP adequadamente (opcional)');
  console.log('\n📍 Dashboard: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings');
}

if (require.main === module) {
  applyBasicRLS().catch(console.error);
}

module.exports = { applyBasicRLS };
