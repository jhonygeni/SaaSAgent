#!/bin/bash

# Script para configurar manualmente as variáveis de ambiente do Supabase para a função custom-email
# Este script não depende do arquivo .env

# Configurações do Supabase
PROJECT_REF="hpovwcaskorzzrpphgkc"

# Configurações SMTP
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USERNAME="validar@geni.chat"
SMTP_PASSWORD="${SMTP_PASSWORD:-CONFIGURE_YOUR_SMTP_PASSWORD}" # Substitua por uma senha segura após resolver o problema
SITE_URL="https://saa-s-agent.vercel.app"

echo "=== Configuração Manual das Variáveis de Ambiente da Função Custom Email ==="
echo ""

# 1. Configurar as variáveis de ambiente
echo "1. Configurando variáveis de ambiente da função..."
echo "SMTP_HOST: $SMTP_HOST"
echo "SMTP_PORT: $SMTP_PORT"
echo "SMTP_USERNAME: $SMTP_USERNAME"
echo "SITE_URL: $SITE_URL"
echo "PROJECT_REF: $PROJECT_REF"

supabase secrets set SMTP_HOST="$SMTP_HOST" SMTP_PORT="$SMTP_PORT" SMTP_USERNAME="$SMTP_USERNAME" SMTP_PASSWORD="$SMTP_PASSWORD" SITE_URL="$SITE_URL" --project-ref "$PROJECT_REF"

if [ $? -ne 0 ]; then
    echo "Erro ao configurar as variáveis de ambiente. Verifique os logs acima."
    exit 1
fi

echo "✓ Variáveis de ambiente configuradas com sucesso!"
echo ""

# 2. Reimplantar a função
echo "2. Reimplantando função custom-email..."
supabase functions deploy custom-email --project-ref "$PROJECT_REF"

if [ $? -ne 0 ]; then
    echo "Erro ao reimplantar a função. Verifique os logs acima."
    exit 1
fi

echo "✓ Função reimplantada com sucesso!"
echo ""

echo "Configuração completa da função custom-email! Os emails agora devem ser enviados corretamente."
echo "Você pode testar o envio de emails executando: node test-custom-email.js"
