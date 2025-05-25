#!/bin/bash

# Configurações
PROJECT_REF="hpovwcaskorzzrpphgkc"
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/custom-email"

echo "=== Configuração Completa do Sistema ==="
echo ""

# Solicitar credenciais
echo "Por favor, forneça as seguintes informações:"
echo ""
read -p "Token de Acesso do Supabase (encontrado em https://supabase.com/dashboard/account/tokens): " SUPABASE_ACCESS_TOKEN

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Token não fornecido. Abortando..."
    exit 1
fi

# 1. Configurar variáveis de ambiente da função Edge
echo "1. Configurando variáveis de ambiente..."
supabase secrets set \
    SMTP_HOST="smtp.hostinger.com" \
    SMTP_PORT="465" \
    SMTP_USERNAME="validar@geni.chat" \
    SMTP_PASSWORD="${SMTP_PASSWORD:-CONFIGURE_YOUR_SMTP_PASSWORD}" \
    SITE_URL="https://saa-s-agent.vercel.app" \
    --project-ref "$PROJECT_REF"

echo "✓ Variáveis de ambiente configuradas"
echo ""

# 2. Implantar função Edge
echo "2. Implantando função custom-email..."
supabase functions deploy custom-email --project-ref "$PROJECT_REF"
echo "✓ Função implantada"
echo ""

# 3. Configurar banco de dados
echo "3. Configurando banco de dados..."

# Ler o conteúdo do arquivo SQL
SQL_CONTENT=$(cat migrations/create_functions.sql)

# Executar SQL via API REST do Supabase
curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/create_profiles_table" \
  -H "apikey: $SUPABASE_ACCESS_TOKEN" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"

curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/rpc/create_profile_trigger" \
  -H "apikey: $SUPABASE_ACCESS_TOKEN" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"

echo "✓ Banco de dados configurado"
echo ""

# 4. Configurar webhook usando a API do Supabase Management
echo "4. Configurando webhook..."
curl -X PATCH \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/auth/config" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "email_template_webhook_url": "'${WEBHOOK_URL}'",
    "enable_email_template_webhook": true
  }'

if [ $? -ne 0 ]; then
    echo "❌ Erro ao configurar webhook. Verifique o token de acesso e tente novamente."
    exit 1
fi

echo "✓ Webhook configurado"
echo ""

# 5. Testar configuração
echo "5. Testando configuração..."
node test-custom-email.js

echo "Configuração completa!"
echo ""
echo "Para verificar os logs da função:"
echo "supabase functions logs custom-email --project-ref $PROJECT_REF" 