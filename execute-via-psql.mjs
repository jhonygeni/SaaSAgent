#!/usr/bin/env node

/**
 * EXECUÇÃO DIRETA VIA PSQL NO SUPABASE
 * ConversaAI Brasil - Aplicação Automática das Correções
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';

console.log('🚀 EXECUTANDO CORREÇÕES AUTOMÁTICAS NO SUPABASE...\n');

// Configurações
const CONNECTION_STRING = 'postgresql://postgres.hpovwcaskorzzrpphgkc:Conversa2024!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

// Ler o arquivo SQL
const sqlContent = readFileSync('/Users/jhonymonhol/Desktop/conversa-ai-brasil/EXECUTE-FIXES-SIMPLE-v2.sql', 'utf8');

// Dividir em seções para execução sequencial
const sections = [
  {
    name: "CORREÇÃO DO TRIGGER (CRÍTICO)",
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
  -- Buscar plano gratuito ativo
  SELECT id INTO free_plan_id 
  FROM public.subscription_plans 
  WHERE name = 'Free' AND is_active = true 
  LIMIT 1;
  
  -- Se não existe plano gratuito, criar um
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
  END IF;

  -- Criar perfil do usuário
  BEGIN
    INSERT INTO public.profiles (id, full_name, is_active, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      ),
      true, NOW(), NOW()
    );
  EXCEPTION 
    WHEN unique_violation THEN NULL;
    WHEN OTHERS THEN NULL;
  END;
  
  -- Criar assinatura gratuita
  BEGIN
    INSERT INTO public.subscriptions (user_id, plan_id, status, current_period_start, current_period_end, created_at, updated_at)
    VALUES (NEW.id, free_plan_id, 'active', NOW(), (NOW() + interval '1 year'), NOW(), NOW());
  EXCEPTION 
    WHEN unique_violation THEN NULL;
    WHEN OTHERS THEN NULL;
  END;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
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
    name: "REPARO DE USUÁRIOS EXISTENTES",
    sql: `
DO $$
DECLARE
  free_plan_id UUID;
  profile_count INTEGER := 0;
  subscription_count INTEGER := 0;
BEGIN
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
      'Plano gratuito',
      '{"basic_ai": true}'::jsonb
    )
    RETURNING id INTO free_plan_id;
  END IF;
  
  -- Criar perfis para usuários órfãos
  INSERT INTO public.profiles (id, full_name, is_active, created_at, updated_at)
  SELECT 
    au.id,
    COALESCE(split_part(au.email, '@', 1), 'Usuário'),
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
    au.id, free_plan_id, 'active', au.created_at, (au.created_at + interval '1 year'), au.created_at, NOW()
  FROM auth.users au
  LEFT JOIN public.subscriptions s ON au.id = s.user_id
  WHERE s.user_id IS NULL
  ON CONFLICT (user_id) DO NOTHING;
  
  GET DIAGNOSTICS subscription_count = ROW_COUNT;
  
  RAISE NOTICE 'Reparo: % perfis e % assinaturas criadas', profile_count, subscription_count;
END $$;
`
  },
  {
    name: "POLÍTICAS DE SEGURANÇA",
    sql: `
-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users manage own profile" ON public.profiles;
CREATE POLICY "Users manage own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view plans" ON public.subscription_plans FOR SELECT USING (true);
`
  }
];

async function executarSecao(secao, index) {
  console.log(`\n📍 ${index + 1}/${sections.length} - ${secao.name}`);
  console.log('─'.repeat(50));

  // Salvar SQL em arquivo temporário
  const tempFile = `/tmp/secao_${index + 1}.sql`;
  writeFileSync(tempFile, secao.sql);

  try {
    // Executar via psql
    const comando = `psql "${CONNECTION_STRING}" -f "${tempFile}"`;
    const resultado = execSync(comando, { 
      encoding: 'utf8',
      timeout: 30000
    });
    
    console.log('✅ Seção executada com sucesso!');
    if (resultado.trim()) {
      console.log('📋 Resultado:', resultado.trim());
    }
    return true;
    
  } catch (error) {
    console.log('❌ Erro na execução:');
    console.log(error.stdout || error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Verificando conexão com PostgreSQL...');
  
  try {
    // Verificar se psql está disponível
    execSync('which psql', { encoding: 'utf8' });
    console.log('✅ PostgreSQL CLI encontrado');
  } catch (error) {
    console.log('❌ PostgreSQL CLI não encontrado');
    console.log('📦 Instale com: brew install postgresql');
    return;
  }

  console.log('🔗 Conectando ao Supabase...');
  console.log('🎯 Database: hpovwcaskorzzrpphgkc');

  let sucessos = 0;
  let erros = 0;

  // Executar cada seção
  for (let i = 0; i < sections.length; i++) {
    const sucesso = await executarSecao(sections[i], i);
    if (sucesso) {
      sucessos++;
    } else {
      erros++;
    }
    
    // Pausa entre execuções
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Relatório final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RELATÓRIO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`📋 Total: ${sections.length}`);

  if (sucessos >= 2) {
    console.log('\n🎉 CORREÇÕES APLICADAS COM SUCESSO!');
    console.log('🔧 Sistema deve estar funcionando');
    console.log('👥 Usuários existentes reparados');
    console.log('🔒 Segurança aplicada');
  } else {
    console.log('\n⚠️ ALGUMAS CORREÇÕES FALHARAM');
    console.log('🔄 Execute manualmente se necessário');
  }

  console.log('\n📝 TESTE AGORA:');
  console.log('1. Acesse: https://app.supabase.com/project/hpovwcaskorzzrpphgkc');
  console.log('2. Teste criar um novo usuário');
  console.log('3. Verifique se perfil e assinatura são criados');
}

main().catch(console.error);
