#!/bin/zsh

# Teste direto do Supabase Auth nativo para identificar o problema real
echo "🔍 TESTE DIRETO - SUPABASE AUTH NATIVO"
echo "====================================="

PROJECT_REF="hpovwcaskorzzrpphgkc"
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc"

echo "📧 Registrando usuário de teste com Auth nativo..."
echo "Email: jhonytest$(date +%s)@gmail.com"

TEST_EMAIL="jhonytest$(date +%s)@gmail.com"

# Signup direto via Supabase Auth (sem custom function)
SIGNUP_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/signup" \
  -H "Content-Type: application/json" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"TestPassword123!\",
    \"options\": {
      \"data\": {
        \"name\": \"Jhony Test\"
      }
    }
  }")

echo "📊 Resposta do signup nativo:"
echo "$SIGNUP_RESPONSE" | jq '.' 2>/dev/null || echo "$SIGNUP_RESPONSE"
echo ""

# Verificar se foi criado
if echo "$SIGNUP_RESPONSE" | grep -q '"id"'; then
    echo "✅ Usuário criado com sucesso!"
    echo "📧 Verifique o email ${TEST_EMAIL} para link de confirmação"
    echo ""
    echo "🔍 IMPORTANTE: Clique no link do email e veja se dá o mesmo erro"
    echo "Se der erro, o problema NÃO É nossa função custom-email"
else
    echo "❌ Erro no signup nativo:"
    echo "$SIGNUP_RESPONSE"
fi

echo ""
echo "🎯 ANÁLISE DO PROBLEMA:"
echo "======================"
echo "Se o email nativo do Supabase TAMBÉM der erro:"
echo "→ Problema está nas configurações base do Supabase"
echo "→ Não é nossa função custom-email"
echo ""
echo "Se o email nativo FUNCIONAR:"
echo "→ Problema está na função custom-email interferindo"
echo "→ Precisamos desabilitar Auth Hooks"
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "1. Verificar email ${TEST_EMAIL}"
echo "2. Clicar no link de confirmação"
echo "3. Reportar se funcionou ou deu erro"
echo "4. Com base no resultado, ajustar a solução"
