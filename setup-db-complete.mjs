#!/usr/bin/env node

// Script para configurar o banco de dados diretamente
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const serviceKey = 'process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, serviceKey);

async function setupDatabase() {
  console.log('🚀 Configurando banco de dados...');

  try {
    // 1. Criar planos de assinatura
    console.log('📋 1. Criando planos de assinatura...');
    
    const plans = [
      {
        name: 'Free',
        price: 0,
        interval: 'month',
        message_limit: 100,
        agent_limit: 1,
        is_active: true,
        description: 'Plano gratuito com recursos limitados',
        features: { basic_ai: true, single_agent: true }
      },
      {
        name: 'Starter', 
        price: 19900,
        interval: 'month',
        message_limit: 2500,
        agent_limit: 1,
        is_active: true,
        description: 'Para pequenos negócios',
        features: { basic_ai: true, single_agent: true, priority_support: true }
      },
      {
        name: 'Growth',
        price: 24900, 
        interval: 'month',
        message_limit: 5000,
        agent_limit: 3,
        is_active: true,
        description: 'Para empresas em expansão',
        features: { basic_ai: true, multiple_agents: true, priority_support: true, advanced_analytics: true }
      }
    ];

    for (const plan of plans) {
      const { data, error } = await supabase
        .from('subscription_plans')
        .upsert(plan, { onConflict: 'name' })
        .select();
      
      if (error) {
        console.error(`❌ Erro ao criar plano ${plan.name}:`, error);
      } else {
        console.log(`✅ Plano ${plan.name} criado/atualizado`);
      }
    }

    // 2. Verificar se os planos foram criados
    console.log('\n📋 2. Verificando planos criados...');
    const { data: createdPlans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('name, price, message_limit');
    
    if (plansError) {
      console.error('❌ Erro ao verificar planos:', plansError);
    } else {
      console.log('✅ Planos disponíveis:');
      createdPlans.forEach(plan => 
        console.log(`  - ${plan.name}: R$${(plan.price/100).toFixed(2)} (${plan.message_limit} msgs/mês)`)
      );
    }

    // 3. Criar função e trigger para novos usuários via SQL raw
    console.log('\n⚡ 3. Configurando triggers de usuário...');
    
    const triggerSQL = `
      -- Criar função para lidar com novos usuários
      CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
      RETURNS TRIGGER AS $$
      DECLARE
        free_plan_id UUID;
      BEGIN
        -- Buscar plano gratuito
        SELECT id INTO free_plan_id FROM public.subscription_plans WHERE name = 'Free' LIMIT 1;
        
        -- Se não existir, criar
        IF free_plan_id IS NULL THEN
          INSERT INTO public.subscription_plans (name, price, interval, message_limit, agent_limit, is_active, description, features)
          VALUES ('Free', 0, 'month', 100, 1, true, 'Plano gratuito', '{"basic_ai": true}'::jsonb)
          RETURNING id INTO free_plan_id;
        END IF;

        -- Criar perfil
        INSERT INTO public.profiles (id, full_name, avatar_url, is_active, created_at, updated_at)
        VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), NULL, true, NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
        
        -- Criar assinatura
        INSERT INTO public.subscriptions (user_id, plan_id, status, created_at, updated_at, current_period_start, current_period_end)
        VALUES (NEW.id, free_plan_id, 'active', NOW(), NOW(), NOW(), (NOW() + interval '100 years'))
        ON CONFLICT (user_id) DO NOTHING;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;

      -- Remover trigger existente se houver
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      
      -- Criar novo trigger
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user_signup();
    `;

    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
    
    if (triggerError) {
      console.error('❌ Erro ao configurar triggers:', triggerError);
    } else {
      console.log('✅ Triggers configurados com sucesso');
    }

    console.log('\n✅ Setup do banco de dados concluído!');
    
  } catch (error) {
    console.error('💥 Erro geral:', error);
  }
}

// Executar setup
setupDatabase().then(() => process.exit(0)).catch(console.error);
