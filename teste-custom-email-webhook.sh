#!/bin/zsh

# Teste direto da função custom-email simulando webhook do Supabase Auth
# Este teste verifica se a função está funcionando corretamente

echo "🔍 TESTE DIRETO - FUNÇÃO CUSTOM-EMAIL COMO WEBHOOK"
echo "=================================================="

PROJECT_REF="hpovwcaskorzzrpphgkc"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/custom-email"

# Service Role Key - necessária para auth hooks
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU"

echo "📧 Testando webhook de signup com Service Role..."

# Payload que simula um webhook real do Supabase Auth
WEBHOOK_PAYLOAD='{
  "type": "auth",
  "event": "signup",
  "user": {
    "id": "12345678-1234-1234-1234-123456789012",
    "email": "teste@ia.geni.chat",
    "email_confirmed_at": null,
    "created_at": "2025-06-16T21:00:00.000Z",
    "user_metadata": {
      "name": "Usuário Teste"
    }
  },
  "data": {
    "token": "abcd1234567890efgh",
    "type": "signup"
  }
}'

echo "🚀 Enviando requisição..."
echo "URL: $FUNCTION_URL"
echo "Payload: $(echo $WEBHOOK_PAYLOAD | jq -c '.')"
echo ""

# Fazer a requisição
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -d "$WEBHOOK_PAYLOAD")

# Separar corpo da resposta e código HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

echo "📊 RESULTADO:"
echo "HTTP Code: $HTTP_CODE"
echo "Response: $RESPONSE_BODY"
echo ""

# Analisar resultado
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCESSO! Função está funcionando"
    if echo "$RESPONSE_BODY" | grep -q "success"; then
        echo "✅ Email processado com sucesso"
    else
        echo "⚠️  Função respondeu mas pode ter erro interno"
    fi
elif [ "$HTTP_CODE" = "400" ]; then
    echo "⚠️  Erro 400 - Verificar se é erro de SMTP (normal sem configuração)"
    if echo "$RESPONSE_BODY" | grep -q "SMTP"; then
        echo "✅ Função funciona! Erro esperado: SMTP não configurado"
        echo "👉 Configure as variáveis SMTP no Dashboard"
    fi
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Erro 401 - Problema de autenticação"
    echo "👉 Verificar se função está pública ou se Service Key está correta"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Erro 404 - Função não encontrada"
    echo "👉 Verificar se deploy foi feito corretamente"
else
    echo "❌ Erro inesperado: HTTP $HTTP_CODE"
    echo "Response: $RESPONSE_BODY"
fi

echo ""
echo "📝 PRÓXIMOS PASSOS:"

if [ "$HTTP_CODE" = "200" ] || [[ "$RESPONSE_BODY" == *"SMTP"* ]]; then
    echo "1. ✅ Função está funcionando!"
    echo "2. 🔧 Configure variáveis SMTP no Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
    echo ""
    echo "3. 📧 Variáveis necessárias:"
    echo "   - SMTP_HOST=smtp.gmail.com"
    echo "   - SMTP_PORT=465"
    echo "   - SMTP_USERNAME=validar@geni.chat"
    echo "   - SMTP_PASSWORD=[senha_app_gmail]"
    echo "   - SITE_URL=https://ia.geni.chat"
    echo "   - SUPPORT_EMAIL=suporte@geni.chat"
    echo ""
    echo "4. 🧪 Teste real: Registre usuário em https://ia.geni.chat"
else
    echo "1. ❌ Problema na função detectado"
    echo "2. 🔍 Verificar logs no Dashboard:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/functions/custom-email/logs"
    echo "3. 🔧 Verificar se deploy foi feito corretamente"
fi

echo ""
echo "🔗 LINKS ÚTEIS:"
echo "Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "Logs: https://supabase.com/dashboard/project/$PROJECT_REF/functions/custom-email/logs"
echo "Settings: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
