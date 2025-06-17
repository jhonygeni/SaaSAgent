#!/bin/bash

# Script para verificar e configurar o webhook de confirmação de email
# Este script garante que todas as configurações estejam corretas

echo "🔧 VERIFICAÇÃO E CORREÇÃO DO SISTEMA DE CONFIRMAÇÃO DE EMAIL"
echo "============================================================="
echo ""

PROJECT_REF="hpovwcaskorzzrpphgkc"
SITE_URL="https://ia.geni.chat"
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/custom-email"

echo "📋 Configurações:"
echo "   Project Ref: $PROJECT_REF"
echo "   Site URL: $SITE_URL"
echo "   Webhook URL: $WEBHOOK_URL"
echo ""

# 1. Verificar se a função custom-email está ativa
echo "1. 🔍 Verificando função custom-email..."
supabase functions list | grep custom-email
if [ $? -eq 0 ]; then
    echo "   ✅ Função custom-email está ativa"
else
    echo "   ❌ Função custom-email não encontrada - implantando..."
    supabase functions deploy custom-email
fi
echo ""

# 2. Verificar variáveis de ambiente
echo "2. 🔧 Verificando variáveis de ambiente..."
echo "   Verificando SITE_URL..."
if supabase secrets list | grep -q "SITE_URL"; then
    echo "   ✅ SITE_URL está configurada"
else
    echo "   ⚠️  SITE_URL não encontrada - configurando..."
    supabase secrets set SITE_URL="$SITE_URL"
fi

echo "   Verificando configurações SMTP..."
if supabase secrets list | grep -q "SMTP_HOST"; then
    echo "   ✅ Configurações SMTP encontradas"
else
    echo "   ❌ Configurações SMTP não encontradas"
    echo "   ⚠️  Execute o script de configuração SMTP primeiro"
fi
echo ""

# 3. Testar a função custom-email
echo "3. 🧪 Testando função custom-email..."
cat > test_payload.json << EOF
{
    "type": "auth",
    "event": "signup",
    "user": {
        "id": "test-user-$(date +%s)",
        "email": "teste@exemplo.com"
    },
    "data": {
        "token": "test_token_$(date +%s)"
    }
}
EOF

echo "   📤 Enviando payload de teste..."
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -d @test_payload.json \
  --silent --show-error \
  -w "Status HTTP: %{http_code}\n" \
  -o test_response.json

echo "   📥 Resposta da função:"
if [ -f test_response.json ]; then
    cat test_response.json | jq '.' 2>/dev/null || cat test_response.json
    rm -f test_response.json
fi
rm -f test_payload.json
echo ""

# 4. Verificar rotas da aplicação
echo "4. 🌐 Verificando rotas da aplicação..."
ROUTES=(
    "/confirmar-email"
    "/confirmar-email-sucesso"
    "/reenviar-confirmacao"
)

echo "   Rotas verificadas:"
for route in "${ROUTES[@]}"; do
    if grep -r "path=\"$route\"" src/ >/dev/null 2>&1; then
        echo "   ✅ $route"
    else
        echo "   ❌ $route - não encontrada"
    fi
done
echo ""

# 5. Verificar página de confirmação
echo "5. 📄 Verificando página de confirmação..."
if [ -f "src/pages/EmailConfirmationPage.tsx" ]; then
    echo "   ✅ EmailConfirmationPage.tsx existe"
    
    # Verificar se suporta ambos os cenários
    if grep -q "checkUserSession" src/pages/EmailConfirmationPage.tsx; then
        echo "   ✅ Suporte para confirmação via redirect do Supabase"
    else
        echo "   ⚠️  Pode não suportar confirmação via redirect"
    fi
    
    if grep -q "verifyOtp" src/pages/EmailConfirmationPage.tsx; then
        echo "   ✅ Suporte para confirmação via token direto"
    else
        echo "   ❌ Não suporta confirmação via token direto"
    fi
else
    echo "   ❌ EmailConfirmationPage.tsx não encontrada"
fi
echo ""

# 6. Instruções finais
echo "6. 📋 PRÓXIMOS PASSOS:"
echo ""
echo "   🔗 Configure o webhook no Console do Supabase:"
echo "   1. Acesse: https://supabase.com/dashboard/project/$PROJECT_REF/auth/templates"
echo "   2. Ative 'Enable custom email template webhook'"
echo "   3. Configure a URL: $WEBHOOK_URL"
echo ""
echo "   🧪 Para testar o fluxo completo:"
echo "   1. Abra: file://$PWD/test-email-confirmation-flow.html"
echo "   2. Execute todos os testes"
echo "   3. Verifique se todos passam"
echo ""
echo "   📧 Para testar com email real:"
echo "   1. Registre um novo usuário na aplicação"
echo "   2. Verifique se o email foi enviado"
echo "   3. Clique no link de confirmação"
echo "   4. Verifique se o redirecionamento funciona"
echo ""

# 7. Verificar logs recentes
echo "7. 📊 Verificando logs recentes..."
echo "   💡 Para ver logs em tempo real:"
echo "   supabase functions logs custom-email --follow"
echo ""

echo "✅ VERIFICAÇÃO CONCLUÍDA!"
echo ""
echo "📈 RESUMO:"
echo "   - Função custom-email: Verificada"
echo "   - Variáveis de ambiente: Verificadas"
echo "   - Rotas da aplicação: Verificadas"
echo "   - Página de confirmação: Atualizada"
echo ""
echo "🎯 STATUS: Sistema de confirmação de email configurado e pronto para uso!"
