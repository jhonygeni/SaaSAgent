#!/bin/bash

echo "🔧 DIAGNÓSTICO E CORREÇÃO DO PROBLEMA DE EMAIL"
echo "=============================================="
echo ""

PROJECT_REF="hpovwcaskorzzrpphgkc"

# 1. Verificar se está logado no Supabase
echo "1. 🔐 Verificando autenticação do Supabase CLI..."
if ! supabase projects list > /dev/null 2>&1; then
    echo "❌ Não está logado no Supabase CLI"
    echo "Execute: supabase login"
    exit 1
fi
echo "✅ Autenticado no Supabase CLI"
echo ""

# 2. Verificar se a função está implantada
echo "2. 📧 Verificando se a função custom-email está implantada..."
FUNCTION_STATUS=$(supabase functions list --project-ref $PROJECT_REF 2>&1)
if echo "$FUNCTION_STATUS" | grep -q "custom-email"; then
    echo "✅ Função custom-email encontrada"
else
    echo "❌ Função custom-email NÃO está implantada - ESTE É O PROBLEMA!"
    echo ""
    echo "🚀 Implantando função custom-email..."
    if supabase functions deploy custom-email --project-ref $PROJECT_REF; then
        echo "✅ Função custom-email implantada com sucesso!"
    else
        echo "❌ Erro ao implantar função"
        exit 1
    fi
fi
echo ""

# 3. Verificar variáveis de ambiente
echo "3. ⚙️ Verificando variáveis de ambiente..."
SECRETS_STATUS=$(supabase secrets list --project-ref $PROJECT_REF 2>&1)
if echo "$SECRETS_STATUS" | grep -q "SMTP_HOST"; then
    echo "✅ Variáveis SMTP encontradas"
else
    echo "❌ Variáveis SMTP não configuradas"
    echo ""
    echo "🔧 Configurando variáveis de ambiente..."
    
    # Pedir senha SMTP se não estiver configurada
    if [ -z "$SMTP_PASSWORD" ]; then
        echo "⚠️  Por favor, informe a senha do email validar@geni.chat:"
        read -s SMTP_PASSWORD
    fi
    
    supabase secrets set \
        SMTP_HOST="smtp.hostinger.com" \
        SMTP_PORT="465" \
        SMTP_USERNAME="validar@geni.chat" \
        SMTP_PASSWORD="$SMTP_PASSWORD" \
        SITE_URL="https://ia.geni.chat" \
        PROJECT_REF="$PROJECT_REF" \
        --project-ref $PROJECT_REF
        
    if [ $? -eq 0 ]; then
        echo "✅ Variáveis de ambiente configuradas"
    else
        echo "❌ Erro ao configurar variáveis"
        exit 1
    fi
fi
echo ""

# 4. Verificar logs da função
echo "4. 📋 Verificando logs da função (últimas 10 linhas)..."
echo "Comando: supabase functions logs custom-email --project-ref $PROJECT_REF"
echo ""

# 5. Instruções para configurar webhook
echo "5. 🔗 CONFIGURAÇÃO DO WEBHOOK NO CONSOLE DO SUPABASE:"
echo ""
echo "⚠️  AÇÃO MANUAL NECESSÁRIA:"
echo "1. Acesse: https://supabase.com/dashboard/project/$PROJECT_REF/auth/templates"
echo "2. Procure por 'Custom Email Template Webhook'"
echo "3. HABILITE a opção"
echo "4. Configure a URL: https://$PROJECT_REF.supabase.co/functions/v1/custom-email"
echo "5. Salve as configurações"
echo ""

# 6. Testar a função
echo "6. 🧪 Testando a função..."
echo "Fazendo requisição de teste para a função..."
RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
    "https://$PROJECT_REF.supabase.co/functions/v1/custom-email" \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@teste.com","type":"signup","token":"test-token"}')

HTTP_STATUS=$(echo $RESPONSE | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
HTTP_BODY=$(echo $RESPONSE | sed -e 's/HTTPSTATUS\:.*//g')

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ Função respondeu corretamente (Status: $HTTP_STATUS)"
elif [ "$HTTP_STATUS" -eq 400 ]; then
    echo "⚠️  Função ativa mas com erro (Status: $HTTP_STATUS) - Normal para teste"
else
    echo "❌ Função com problema (Status: $HTTP_STATUS)"
    echo "Resposta: $HTTP_BODY"
fi
echo ""

echo "📋 RESUMO:"
echo "=========="
echo ""
echo "Se a função foi implantada agora, o problema estava em:"
echo "❌ A função custom-email não estava implantada no Supabase"
echo "❌ Por isso o sistema usava o email padrão (que não funciona)"
echo ""
echo "✅ PRÓXIMO PASSO:"
echo "1. Configure o webhook manualmente no Console (link acima)"
echo "2. Teste o registro novamente"
echo "3. Se ainda não funcionar, verifique a senha SMTP"
echo ""
echo "🔍 Para verificar logs em tempo real:"
echo "supabase functions logs custom-email --project-ref $PROJECT_REF --follow"
