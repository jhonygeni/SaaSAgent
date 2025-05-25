#!/usr/bin/env node

// Script para configurar triggers SQL via API do Supabase
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hpovwcaskorzzrpphgkc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU'
);

async function setupTriggers() {
  console.log('⚡ Configurando triggers SQL...');

  const triggerSQL = `
    -- Criar função para lidar com novos usuários
    CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
    RETURNS TRIGGER AS $$
    DECLARE
      free_plan_id UUID;
    BEGIN
      -- Buscar plano gratuito
      SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
      
      -- Se não existir, usar o primeiro plano disponível
      IF free_plan_id IS NULL THEN
        SELECT id INTO free_plan_id FROM public.subscription_plans LIMIT 1;
      END IF;

      -- Criar perfil
      INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
      VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NULL, true, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
      
      -- Criar assinatura se houver plano disponível
      IF free_plan_id IS NOT NULL THEN
        INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
        VALUES (NEW.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'))
        ON CONFLICT (user_id) DO NOTHING;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Remover trigger existente se houver
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

    -- Criar novo trigger
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();

    -- Configurar políticas RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
    CREATE POLICY "Users can view their own profile" ON public.profiles 
      FOR SELECT USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
    CREATE POLICY "Users can update their own profile" ON public.profiles 
      FOR UPDATE USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscriptions;
    CREATE POLICY "Users can view their own subscription" ON public.subscriptions 
      FOR SELECT USING (auth.uid() = user_id);
  `;

  try {
    console.log('📦 Executando SQL setup...');
    
    // Tentaremos executar SQL individualmente para melhor controle
    const sqlCommands = [
      // Função principal
      `CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
       RETURNS TRIGGER AS $$
       DECLARE
         free_plan_id UUID;
       BEGIN
         SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
         
         IF free_plan_id IS NULL THEN
           SELECT id INTO free_plan_id FROM public.subscription_plans LIMIT 1;
         END IF;

         INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
         VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NULL, true, NOW(), NOW())
         ON CONFLICT (id) DO NOTHING;
         
         IF free_plan_id IS NOT NULL THEN
           INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
           VALUES (NEW.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'))
           ON CONFLICT (user_id) DO NOTHING;
         END IF;
         
         RETURN NEW;
       END;
       $$ LANGUAGE plpgsql SECURITY DEFINER;`,
       
      // Remover trigger existente
      `DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`,
      
      // Criar trigger
      `CREATE TRIGGER on_auth_user_created
       AFTER INSERT ON auth.users
       FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();`
    ];

    for (const sql of sqlCommands) {
      console.log(`Executando: ${sql.substring(0, 50)}...`);
      const { error } = await supabase.rpc('query', { query: sql });
      
      if (error) {
        console.error('❌ Erro SQL:', error);
        console.log('\n🚨 CONFIGURAÇÃO MANUAL NECESSÁRIA:');
        console.log('Execute o SQL no console: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql');
        return false;
      }
    }

    console.log('✅ SQL executado com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado:', err);
    console.log('\n🚨 CONFIGURAÇÃO MANUAL NECESSÁRIA:');
    console.log('Execute o SQL no console: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/sql');
    return false;
  }
}

async function verifySetup() {
  console.log('\n🔍 Verificando configuração...');
  
  try {
    // Verificar planos
    const { data: plansData, error: plansError } = await supabase
      .from('subscription_plans')
      .select('*');

    if (plansError) {
      console.error('❌ Erro ao verificar planos:', plansError);
    } else {
      console.log(`✅ ${plansData.length} planos encontrados:`, plansData.map(p => p.name));
    }

    // Verificar função custom-email
    console.log('\n📧 Testando função custom-email...');
    const testResponse = await fetch('https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.PcOQzSbU5aH8X8gQbFZBpJzKwU7E-wUJ_YQa0VLgTRo',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'signup',
        user: {
          email: 'test@example.com',
          email_confirm: 'https://app.conversaai.com.br/confirmar-email?token=test'
        }
      })
    });

    if (testResponse.ok) {
      const result = await testResponse.json();
      console.log('✅ Função custom-email respondeu:', result);
    } else {
      console.log('⚠️  Função custom-email respondeu com status:', testResponse.status);
    }

  } catch (err) {
    console.error('❌ Erro na verificação:', err);
  }
}

async function checkAuthHooks() {
  console.log('\n🔗 Verificando Auth Hooks...');
  console.log('⚠️  Auth Hooks precisam ser configurados MANUALMENTE no console:');
  console.log('1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc/auth/settings');
  console.log('2. Configure Send Email Hook: https://hpovwcaskorzzrpphgkc.supabase.co/functions/v1/custom-email');
  console.log('3. Adicione Redirect URLs: https://app.conversaai.com.br/**');
}

async function main() {
  console.log('🚀 SETUP AUTOMATIZADO - ConversaAI Brasil\n');
  
  const sqlSuccess = await setupTriggers();
  await verifySetup();
  await checkAuthHooks();
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  
  if (!sqlSuccess) {
    console.log('1. ❌ Execute o SQL manualmente no console do Supabase');
  } else {
    console.log('1. ✅ SQL triggers configurados');
  }
  
  console.log('2. ⚙️  Configure Auth Hooks no console (OBRIGATÓRIO)');
  console.log('3. 🧪 Teste o cadastro de usuário');
  
  console.log('\n📖 Veja CONFIGURACAO-MANUAL-OBRIGATORIA.md para detalhes');
}

main().catch(console.error);
