#!/bin/bash

# DIAGNÓSTICO COMPLETO E CORREÇÃO - ConversaAI Brasil
# ===================================================

PROJECT_REF="hpovwcaskorzzrpphgkc"
CUSTOM_EMAIL_URL="https://${PROJECT_REF}.supabase.co/functions/v1/custom-email"

echo "🔍 DIAGNÓSTICO COMPLETO - ConversaAI Brasil"
echo "============================================="
echo ""

# 1. Verificar se a função custom-email está ativa
echo "📧 1. Verificando função custom-email..."
FUNCTIONS_OUTPUT=$(supabase functions list --project-ref $PROJECT_REF 2>/dev/null)
if echo "$FUNCTIONS_OUTPUT" | grep -q "custom-email.*ACTIVE"; then
    echo "✅ Função custom-email está ATIVA"
else
    echo "❌ Função custom-email não está ativa"
    echo "   Executando deploy..."
    supabase functions deploy custom-email --project-ref $PROJECT_REF
fi

# 2. Verificar variáveis SMTP
echo ""
echo "🔧 2. Verificando variáveis SMTP..."
SECRETS_OUTPUT=$(supabase secrets list --project-ref $PROJECT_REF 2>/dev/null)
if echo "$SECRETS_OUTPUT" | grep -q "SMTP_HOST\|SMTP_PORT\|SMTP_USERNAME\|SMTP_PASSWORD"; then
    echo "✅ Variáveis SMTP configuradas"
else
    echo "❌ Variáveis SMTP não configuradas"
    echo "   Configure manualmente no console do Supabase"
fi

# 3. Verificar planos de assinatura
echo ""
echo "💰 3. Verificando planos de assinatura..."
PLANS_COUNT=$(curl -s -X GET "https://${PROJECT_REF}.supabase.co/rest/v1/subscription_plans?select=count" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  --max-time 5 2>/dev/null | grep -o '\[.*\]' | tr -d '[]' | wc -w)

if [ "$PLANS_COUNT" -gt 0 ]; then
    echo "✅ Planos de assinatura existem ($PLANS_COUNT planos)"
else
    echo "❌ Nenhum plano de assinatura encontrado"
fi

# 4. Testar função custom-email
echo ""
echo "🧪 4. Testando função custom-email..."
TEST_RESPONSE=$(curl -s -X POST "$CUSTOM_EMAIL_URL" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste-diagnostico@exemplo.com",
    "type": "signup",
    "token": "test-token-123",
    "redirect_to": "https://app.conversaai.com.br/confirmar-email",
    "metadata": {"name": "Teste Diagnóstico"}
  }' \
  --max-time 10 2>/dev/null)

if echo "$TEST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Função custom-email funcionando"
else
    echo "❌ Função custom-email com problemas"
    echo "   Resposta: $TEST_RESPONSE"
fi

echo ""
echo "📋 5. PROBLEMAS IDENTIFICADOS E SOLUÇÕES:"
echo "=========================================="
echo ""

echo "❗ PROBLEMA PRINCIPAL: O Supabase não está configurado para usar emails personalizados"
echo ""
echo "🔧 SOLUÇÕES NECESSÁRIAS:"
echo ""
echo "1. CONFIGURAR AUTH HOOKS no Console do Supabase:"
echo "   👉 Acesse: https://app.supabase.com/project/${PROJECT_REF}/auth/settings"
echo "   👉 Na seção 'Auth Hooks', configure:"
echo "      - Send Email Hook: ${CUSTOM_EMAIL_URL}"
echo "      - HTTP Method: POST"
echo ""

echo "2. EXECUTAR SQL TRIGGERS no Console:"
echo "   👉 Acesse: https://app.supabase.com/project/${PROJECT_REF}/sql"
echo "   👉 Execute o script: supabase/user-trigger-setup.sql"
echo ""

echo "3. CONFIGURAR REDIRECT URL:"
echo "   👉 No mesmo console Auth Settings, adicione URLs:"
echo "      - https://app.conversaai.com.br/**"
echo "      - http://localhost:5173/**"
echo ""

echo "⚠️  IMPORTANTE: Estas configurações devem ser feitas MANUALMENTE no console web!"
echo ""

# 6. Criar script de teste completo
echo "🚀 6. Criando script de teste final..."
cat > test-complete-signup.js << 'EOF'
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hpovwcaskorzzrpphgkc.supabase.co',
  '${SUPABASE_ANON_KEY}'
);

async function testCompleteFlow() {
  const testEmail = `teste-completo-${Date.now()}@exemplo.com`;
  
  console.log('🧪 Testando fluxo completo de cadastro...');
  console.log('📧 Email de teste:', testEmail);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'senha123!@#',
      options: {
        data: { name: 'Teste Completo' },
        emailRedirectTo: 'https://app.conversaai.com.br/confirmar-email'
      }
    });
    
    if (error) {
      console.error('❌ Erro no signup:', error);
      return;
    }
    
    console.log('✅ Signup executado com sucesso');
    console.log('👤 User ID:', data.user?.id);
    console.log('📧 Email confirmado:', data.user?.email_confirmed_at ? 'Sim' : 'Não');
    
    // Aguardar um pouco e verificar se o perfil foi criado
    setTimeout(async () => {
      if (data.user?.id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
        
        if (profileError) {
          console.log('❌ Perfil não foi criado automaticamente');
        } else {
          console.log('✅ Perfil criado:', profile);
        }
      }
    }, 3000);
    
  } catch (err) {
    console.error('💥 Erro geral:', err);
  }
}

testCompleteFlow();
EOF

echo "✅ Script de teste criado: test-complete-signup.js"
echo ""
echo "🎯 EXECUTE OS PASSOS MANUAIS ACIMA, DEPOIS TESTE COM:"
echo "   node test-complete-signup.js"
