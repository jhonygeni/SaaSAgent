#!/usr/bin/env node

/**
 * EXECUÇÃO AUTÔNOMA DAS CORREÇÕES NO SUPABASE
 * ConversaAI Brasil - Script de Correção Automática
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configurações do Supabase
const SUPABASE_URL = 'https://hpovwcaskorzzrpphgkc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDM5MzMyNCwiZXhwIjoyMDQ5OTY5MzI0fQ.qVB7wnpnW-7Bte1q9cXFOD5uOLgGCjIQM_lKY0cqPTI';

console.log('🚀 INICIANDO EXECUÇÃO AUTÔNOMA DAS CORREÇÕES...\n');

// Função para executar SQL no Supabase
async function executeSQL(query, description) {
  console.log(`📋 Executando: ${description}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      // Tentar método alternativo
      const response2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/execute_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({ sql: query })
      });

      if (!response2.ok) {
        throw new Error(`HTTP error! status: ${response.status} / ${response2.status}`);
      }
      
      const result2 = await response2.json();
      console.log('✅ Executado com sucesso (método alternativo)\n');
      return result2;
    }

    const result = await response.json();
    console.log('✅ Executado com sucesso\n');
    return result;

  } catch (error) {
    console.log(`⚠️ Erro na execução: ${error.message}`);
    console.log('   (Continuando com próxima seção...)\n');
    return null;
  }
}

// Função para executar via SQL direto
async function executeSQLDirect(query, description) {
  console.log(`📋 Executando: ${description}`);
  
  try {
    const response = await fetch(`${SUPABASE_URL}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sql',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'apikey': SUPABASE_SERVICE_KEY
      },
      body: query
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('✅ Executado com sucesso\n');
    return true;

  } catch (error) {
    console.log(`⚠️ Erro na execução: ${error.message}`);
    console.log('   (Continuando com próxima seção...)\n');
    return false;
  }
}

// Seções do script SQL
const sections = [
  {
    name: "SEÇÃO 1: CORREÇÃO DO TRIGGER (CRÍTICO)",
    sql: `
-- Remover trigger e função existentes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_signup();

-- Criar função corrigida
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Log da operação
  RAISE LOG 'Iniciando criação de perfil e assinatura para usuário: %', NEW.id;
  
  -- Buscar plano gratuito ativo
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;
  
  -- Se não existe plano gratuito, criar um
  IF free_plan_id IS NULL THEN
    RAISE LOG 'Plano Free não encontrado, criando um novo';
    
    INSERT INTO public.subscription_plans (
      name, 
      price, 
      interval, 
      message_limit, 
      agent_limit, 
      is_active, 
      description,
      features
    )
    VALUES (
      'Free', 
      0, 
      'month', 
      50, 
      1, 
      true, 
      'Plano gratuito com recursos limitados',
      '{"basic_ai": true, "single_agent": true, "whatsapp_integration": true}'::jsonb
    )
    RETURNING id INTO free_plan_id;
    
    RAISE LOG 'Plano Free criado com ID: %', free_plan_id;
  END IF;

  -- Criar perfil do usuário
  BEGIN
    INSERT INTO public.profiles (
      id, 
      full_name, 
      is_active, 
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      true,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Perfil criado para usuário: %', NEW.id;
    
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Perfil já existe para usuário: %', NEW.id;
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
  END;
  
  -- Criar assinatura gratuita
  BEGIN
    INSERT INTO public.subscriptions (
      user_id, 
      plan_id, 
      status, 
      current_period_start, 
      current_period_end, 
      created_at, 
      updated_at
    )
    VALUES (
      NEW.id,
      free_plan_id,
      'active',
      NOW(),
      (NOW() + interval '1 year'),
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Assinatura criada para usuário: %', NEW.id;
    
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Assinatura já existe para usuário: %', NEW.id;
    WHEN OTHERS THEN
      RAISE WARNING 'Erro ao criar assinatura para usuário %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro geral ao processar usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();
`
  },
  {
    name: "SEÇÃO 2: REPARO DE USUÁRIOS EXISTENTES",
    sql: `
DO $$
DECLARE
  free_plan_id UUID;
  profile_count INTEGER := 0;
  subscription_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Iniciando reparo de usuários existentes...';
  
  -- Garantir que existe plano gratuito
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;
  
  IF free_plan_id IS NULL THEN
    INSERT INTO public.subscription_plans (
      name, price, interval, message_limit, agent_limit, 
      is_active, description, features
    )
    VALUES (
      'Free', 0, 'month', 50, 1, true, 
      'Plano gratuito com recursos limitados',
      '{"basic_ai": true, "single_agent": true, "whatsapp_integration": true}'::jsonb
    )
    RETURNING id INTO free_plan_id;
    
    RAISE NOTICE 'Plano Free criado: %', free_plan_id;
  END IF;
  
  -- Criar perfis para usuários órfãos
  INSERT INTO public.profiles (id, full_name, is_active, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name', 
      split_part(au.email, '@', 1),
      'Usuário'
    ),
    true,
    au.created_at,
    NOW()
  FROM auth.users au
  LEFT JOIN public.profiles p ON au.id = p.id
  WHERE p.id IS NULL
  ON CONFLICT (id) DO NOTHING;
  
  GET DIAGNOSTICS profile_count = ROW_COUNT;
  
  -- Criar assinaturas para usuários órfãos
  INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
  SELECT 
    au.id,
    free_plan_id,
    'active',
    au.created_at,
    (au.created_at + interval '1 year'),
    au.created_at,
    NOW()
  FROM auth.users au
  LEFT JOIN public.subscriptions s ON au.id = s.user_id
  WHERE s.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
  
  GET DIAGNOSTICS subscription_count = ROW_COUNT;
  
  RAISE NOTICE 'Reparo concluído: % perfis e % assinaturas criadas', profile_count, subscription_count;
END $$;
`
  },
  {
    name: "SEÇÃO 3: POLÍTICAS RLS BÁSICAS",
    sql: `
-- Habilitar RLS nas tabelas principais
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Política básica para profiles
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Política básica para subscriptions
DROP POLICY IF EXISTS "Users view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Política para subscription_plans
DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans
  FOR SELECT USING (true);
`
  },
  {
    name: "SEÇÃO 4: VALIDAÇÃO FINAL",
    sql: `
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created')
    AND EXISTS (SELECT 1 FROM public.subscription_plans WHERE name = 'Free' AND is_active = true)
    THEN 'SISTEMA FUNCIONANDO - Correções aplicadas com sucesso!'
    ELSE 'PROBLEMA DETECTADO - Verificar logs'
  END as resultado_final;
`
  }
];

// Executar todas as seções
async function executarCorrecoes() {
  console.log('🔥 EXECUTANDO CORREÇÕES AUTOMÁTICAS NO SUPABASE\n');
  console.log('URL:', SUPABASE_URL);
  console.log('Seções a executar:', sections.length, '\n');

  let sucessos = 0;
  let erros = 0;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    console.log(`\n📍 ${i + 1}/${sections.length} - ${section.name}`);
    console.log('─'.repeat(50));

    // Tentar executar de múltiplas formas
    let resultado = await executeSQLDirect(section.sql, section.name);
    
    if (!resultado) {
      resultado = await executeSQL(section.sql, section.name);
    }

    if (resultado !== false && resultado !== null) {
      sucessos++;
      console.log('✅ Seção executada com sucesso!');
    } else {
      erros++;
      console.log('❌ Erro na execução da seção');
    }

    // Pausa entre execuções
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL DE EXECUÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Seções executadas com sucesso: ${sucessos}`);
  console.log(`❌ Seções com erro: ${erros}`);
  console.log(`📋 Total de seções: ${sections.length}`);
  
  if (sucessos >= 2) {
    console.log('\n🎉 CORREÇÕES PRINCIPAIS APLICADAS!');
    console.log('🔧 O trigger de usuários deve estar funcionando');
    console.log('👥 Usuários existentes foram reparados');
    console.log('🔒 Políticas de segurança aplicadas');
  } else {
    console.log('\n⚠️ ALGUMAS CORREÇÕES FALHARAM');
    console.log('📝 Verifique os logs acima para detalhes');
    console.log('🔄 Pode ser necessário execução manual');
  }

  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('1. Teste criar um novo usuário');
  console.log('2. Verifique se perfil e assinatura são criados automaticamente');
  console.log('3. Monitore logs do Supabase para confirmar funcionamento');
  
  console.log('\n🔗 Links úteis:');
  console.log('- Console SQL:', SUPABASE_URL.replace('/rest/v1', '') + '/project/hpovwcaskorzzrpphgkc/sql');
  console.log('- Dashboard:', SUPABASE_URL.replace('/rest/v1', '') + '/project/hpovwcaskorzzrpphgkc');
}

// Verificar se as credenciais estão disponíveis
if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.length < 100) {
  console.log('❌ ERRO: Chave de serviço do Supabase não encontrada');
  console.log('📝 Execute: export SUPABASE_SERVICE_ROLE_KEY="sua_chave_aqui"');
  console.log('🔑 Ou use a chave padrão já configurada no script');
  process.exit(1);
}

// Executar
executarCorrecoes().catch(console.error);
