#!/bin/bash

# Configurações
PROJECT_REF="hpovwcaskorzzrpphgkc"
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/custom-email"

echo "=== Configuração do Webhook de Email Personalizado ==="
echo ""

# 1. Verificar se a função está implantada
echo "1. Verificando status da função custom-email..."
supabase functions list | grep custom-email
if [ $? -ne 0 ]; then
    echo "❌ Função custom-email não encontrada. Implantando..."
    supabase functions deploy custom-email
else
    echo "✓ Função custom-email encontrada"
fi
echo ""

# 2. Configurar variáveis de ambiente da função
echo "2. Configurando variáveis de ambiente..."
supabase secrets set \
    SMTP_HOST="smtp.hostinger.com" \
    SMTP_PORT="465" \
    SMTP_USERNAME="validar@geni.chat" \
    SMTP_PASSWORD="${SMTP_PASSWORD:-CONFIGURE_YOUR_SMTP_PASSWORD}" \
    SITE_URL="https://saa-s-agent.vercel.app" \
    --project-ref "$PROJECT_REF"

echo "✓ Variáveis de ambiente configuradas"
echo ""

echo "3. Instruções para configuração manual do webhook:"
echo "1. Acesse: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates"
echo "2. Em 'Email Templates', habilite 'Custom Email Template Webhook'"
echo "3. Configure a URL do webhook: ${WEBHOOK_URL}"
echo ""

echo "4. Para testar o envio de email:"
echo "node test-custom-email.js"
echo ""

echo "5. Para verificar os logs da função:"
echo "supabase functions logs custom-email"
echo ""

echo "Configuração concluída!" 