#!/bin/bash

# Script para implantar a função custom-email e configurar os segredos

# Verificar se o Docker está em execução
echo "Verificando se o Docker está em execução..."
if ! docker info > /dev/null 2>&1; then
  echo "Erro: Docker não está em execução. Por favor, inicie o Docker Desktop e tente novamente."
  exit 1
fi

# Variáveis de ambiente para o servidor SMTP
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USERNAME="validar@geni.chat"
SMTP_PASSWORD="Vu1@+H*Mw^3"
SITE_URL="https://app.conversaai.com.br"

# Projeto Supabase
PROJECT_REF="hpovwcaskorzzrpphgkc"

# Passos
echo "=== Implantação e Configuração da Função Custom Email ==="
echo ""

# 1. Implantar a função
echo "1. Implantando função custom-email..."
supabase functions deploy custom-email --project-ref $PROJECT_REF
if [ $? -ne 0 ]; then
    echo "Erro ao implantar a função. Verifique os logs acima."
    exit 1
fi
echo "✓ Função implantada com sucesso!"
echo ""

# 2. Configurar as variáveis de ambiente
echo "2. Configurando variáveis de ambiente da função..."
supabase secrets set SMTP_HOST=$SMTP_HOST SMTP_PORT=$SMTP_PORT SMTP_USERNAME=$SMTP_USERNAME SMTP_PASSWORD=$SMTP_PASSWORD SITE_URL=$SITE_URL --project-ref $PROJECT_REF
if [ $? -ne 0 ]; then
    echo "Erro ao configurar as variáveis de ambiente. Verifique os logs acima."
    exit 1
fi
echo "✓ Variáveis de ambiente configuradas com sucesso!"
echo ""

# 3. Verificar a implantação
echo "3. Verificando status da função..."
supabase functions list --project-ref $PROJECT_REF
echo ""

echo "=== Instruções Adicionais ==="
echo "1. Configure o webhook no console do Supabase:"
echo "   - Acesse: https://supabase.com/dashboard/project/$PROJECT_REF/auth/templates"
echo "   - Habilite 'Custom Email Template Webhook'"
echo "   - Configure a URL: https://$PROJECT_REF.supabase.co/functions/v1/custom-email"
echo ""
echo "2. Teste o envio de e-mail:"
echo "   - Execute: node test-custom-email.js"
echo ""
echo "3. Verifique os logs da função:"
echo "   - Execute: supabase functions logs custom-email --project-ref $PROJECT_REF"
echo ""

echo "Processo concluído!"
