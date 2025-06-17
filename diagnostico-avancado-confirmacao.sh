#!/bin/zsh

# Diagnóstico específico do problema de confirmação de email
# Vamos testar diferentes cenários para identificar a causa exata

echo "🔍 DIAGNÓSTICO AVANÇADO - CONFIRMAÇÃO DE EMAIL"
echo "=============================================="

PROJECT_REF="hpovwcaskorzzrpphgkc"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU"

echo "🧪 TESTE 1: Verificar configurações Auth"
echo "========================================"

# Obter configurações atuais
echo "📋 Obtendo configurações do Auth..."
AUTH_SETTINGS=$(curl -s -X GET "${SUPABASE_URL}/auth/v1/settings" \
  -H "apikey: ${ANON_KEY}")

echo "🔍 Configurações importantes:"
echo "$AUTH_SETTINGS" | jq -r '.site_url // "Site URL não definida"' | sed 's/^/   Site URL: /'
echo "$AUTH_SETTINGS" | jq -r '.external_email_enabled // "false"' | sed 's/^/   External Email: /'
echo "$AUTH_SETTINGS" | jq -r '.mailer_autoconfirm // "false"' | sed 's/^/   Auto Confirm: /'

echo ""
echo "🧪 TESTE 2: Verificar se há Auth Hooks ativos"
echo "==========================================="

# Verificar se há hooks configurados que podem estar interferindo
echo "🔍 Verificando configurações de hooks..."
# (Este teste seria feito via Dashboard - hooks não são acessíveis via API)

echo ""
echo "🧪 TESTE 3: Teste com confirmação manual de usuário"
echo "================================================="

echo "📧 Criando usuário de teste..."
TEST_EMAIL="diagnostico$(date +%s)@teste.com"

SIGNUP_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"TestPassword123!\",
    \"options\": {
      \"data\": {
        \"name\": \"Teste Diagnóstico\"
      }
    }
  }")

echo "📊 Resposta do signup:"
echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"

# Extrair user ID se possível
USER_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.user.id // empty' 2>/dev/null)

if [ -n "$USER_ID" ]; then
    echo ""
    echo "✅ Usuário criado com ID: $USER_ID"
    echo "📧 Email: $TEST_EMAIL"
    
    echo ""
    echo "🔧 Tentando confirmar usuário via Service Role..."
    
    # Tentar confirmar manualmente via API Admin
    CONFIRM_RESPONSE=$(curl -s -X PUT "${SUPABASE_URL}/auth/v1/admin/users/${USER_ID}" \
      -H "Content-Type: application/json" \
      -H "apikey: ${SERVICE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_KEY}" \
      -d '{
        "email_confirm": true,
        "user_metadata": {
          "confirmed_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
        }
      }')
    
    echo "📊 Resposta da confirmação manual:"
    echo "$CONFIRM_RESPONSE" | jq '.' 2>/dev/null || echo "$CONFIRM_RESPONSE"
    
    if echo "$CONFIRM_RESPONSE" | grep -q '"email_confirmed_at"'; then
        echo "✅ USUÁRIO CONFIRMADO VIA API ADMIN!"
        echo "📋 Isso prova que o problema está no processo de confirmação por email"
        echo "🎯 SOLUÇÃO: Configurar confirmação automática ou ajustar processo de email"
    else
        echo "❌ Falha na confirmação manual - problema mais profundo"
    fi
else
    echo "❌ Falha na criação do usuário de teste"
fi

echo ""
echo "🎯 DIAGNÓSTICO FINAL:"
echo "===================="
echo "1. Verificar Auth Hooks no Dashboard (podem estar interferindo)"
echo "2. Verificar se External Email está configurado corretamente"
echo "3. Considerar desabilitar confirmação temporariamente se hooks estão ativos"
echo "4. Se confirmação manual funciona, problema está no processo de email"

echo ""
echo "📞 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Verificar Dashboard → Auth → Hooks (se há hooks ativos)"
echo "2. Se há hooks, desabilitar temporariamente"
echo "3. Testar novamente o fluxo de confirmação"
echo "4. Se ainda falhar, problema pode estar na configuração de SMTP ou templates"
