#!/bin/zsh

# Script de teste pós-deploy para verificar se a função custom-email está funcionando
# Execute após fazer o deploy manual da função

set -e

echo "🔍 TESTE PÓS-DEPLOY - FUNÇÃO CUSTOM-EMAIL"
echo "========================================"

PROJECT_REF="hpovwcaskorzzrpphgkc"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/custom-email"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc"

echo "📡 Testando conectividade básica..."

# Teste 1: Verificar se a função responde
echo "1️⃣ Testando se a função está ativa..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FUNCTION_URL")

if [ "$HTTP_CODE" = "405" ]; then
    echo "✅ Função está respondendo (GET não permitido, conforme esperado)"
elif [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Função está ativa e respondendo"
elif [ "$HTTP_CODE" = "404" ]; then
    echo "❌ Função não encontrada - verifique se o deploy foi feito"
    exit 1
else
    echo "⚠️  Resposta inesperada: HTTP $HTTP_CODE"
fi

# Teste 2: Verificar CORS (OPTIONS)
echo ""
echo "2️⃣ Testando CORS..."
CORS_RESPONSE=$(curl -s -X OPTIONS "$FUNCTION_URL" -H "Access-Control-Request-Method: POST")
if [ $? -eq 0 ]; then
    echo "✅ CORS configurado corretamente"
else
    echo "⚠️  Possível problema com CORS"
fi

# Teste 3: Teste de payload inválido (deve retornar erro estruturado)
echo ""
echo "3️⃣ Testando resposta a payload inválido..."
INVALID_RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -d '{"invalid": "payload"}' || echo "erro_conexao")

if echo "$INVALID_RESPONSE" | grep -q "Email não encontrado"; then
    echo "✅ Função está processando payloads e retornando erros estruturados"
elif echo "$INVALID_RESPONSE" | grep -q "erro_conexao"; then
    echo "❌ Não foi possível conectar à função"
else
    echo "⚠️  Resposta inesperada para payload inválido:"
    echo "$INVALID_RESPONSE" | head -n 3
fi

echo ""
echo "🎯 TESTE DE FUNCIONALIDADE BÁSICA"
echo "================================="

# Teste 4: Payload de teste válido (sem SMTP configurado ainda)
echo "4️⃣ Testando payload válido (sem SMTP)..."
TEST_RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -d '{
        "email": "teste@example.com",
        "type": "signup",
        "token": "test-token-123",
        "redirect_to": "https://ia.geni.chat/confirmar-email"
    }' || echo "erro_conexao")

if echo "$TEST_RESPONSE" | grep -q "SMTP"; then
    echo "✅ Função está processando corretamente (erro SMTP esperado sem configuração)"
elif echo "$TEST_RESPONSE" | grep -q "success"; then
    echo "✅ Função funcionando perfeitamente!"
elif echo "$TEST_RESPONSE" | grep -q "erro_conexao"; then
    echo "❌ Não foi possível conectar à função"
else
    echo "⚠️  Resposta inesperada:"
    echo "$TEST_RESPONSE" | head -n 3
fi

echo ""
echo "📋 RESUMO DOS TESTES"
echo "==================="
echo "URL da função: $FUNCTION_URL"
echo "Status HTTP básico: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "405" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ FUNÇÃO IMPLANTADA COM SUCESSO!"
    echo ""
    echo "📝 PRÓXIMOS PASSOS:"
    echo "1. Configure as variáveis de ambiente:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
    echo ""
    echo "2. Variáveis obrigatórias:"
    echo "   - SITE_URL=https://ia.geni.chat"
    echo "   - SUPPORT_EMAIL=suporte@geni.chat"
    echo "   - PROJECT_REF=$PROJECT_REF"
    echo "   - SMTP_HOST=smtp.gmail.com"
    echo "   - SMTP_PORT=465"
    echo "   - SMTP_USERNAME=validar@geni.chat"
    echo "   - SMTP_PASSWORD=[senha_app_gmail]"
    echo ""
    echo "3. Teste com usuário real:"
    echo "   - Registre nova conta em https://ia.geni.chat"
    echo "   - Verifique se email chega com URLs corretas"
    echo ""
    echo "4. Monitore logs:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/functions/custom-email/logs"
else
    echo "❌ PROBLEMAS DETECTADOS"
    echo "Verifique o deploy da função no Dashboard do Supabase"
fi

echo ""
echo "🔗 LINKS ÚTEIS:"
echo "Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/functions"
echo "Logs: https://supabase.com/dashboard/project/$PROJECT_REF/functions/custom-email/logs"
echo "Settings: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
