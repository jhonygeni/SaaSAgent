#!/bin/bash
# check-env-vars.sh - Script to check if environment variables are properly set

echo "===== Verificador de Variáveis de Ambiente ====="
echo ""

# Carregar variáveis de ambiente do arquivo .env
if [ -f ".env" ]; then
  source .env
else
  echo "❌ Arquivo .env não encontrado!"
  echo "Por favor, crie um arquivo .env baseado no arquivo .env.example"
  exit 1
fi

# Verificar variáveis de ambiente para SMTP
echo "Verificando variáveis de ambiente para SMTP..."

CHECK_FAILED=0

# Verificar SMTP_HOST
if [ -z "$SMTP_HOST" ]; then
  echo "❌ SMTP_HOST não está definido"
  CHECK_FAILED=1
else
  echo "✅ SMTP_HOST: $SMTP_HOST"
fi

# Verificar SMTP_PORT
if [ -z "$SMTP_PORT" ]; then
  echo "❌ SMTP_PORT não está definido"
  CHECK_FAILED=1
else
  echo "✅ SMTP_PORT: $SMTP_PORT"
fi

# Verificar SMTP_USERNAME
if [ -z "$SMTP_USERNAME" ]; then
  echo "❌ SMTP_USERNAME não está definido"
  CHECK_FAILED=1
else
  echo "✅ SMTP_USERNAME: $SMTP_USERNAME"
fi

# Verificar SMTP_PASSWORD
if [ -z "$SMTP_PASSWORD" ]; then
  echo "❌ SMTP_PASSWORD não está definido"
  CHECK_FAILED=1
else
  # Não mostrar a senha completa por razões de segurança
  PASSWORD_LENGTH=${#SMTP_PASSWORD}
  PASSWORD_MASKED=$(printf "%0.1s" "*"{1..50})
  echo "✅ SMTP_PASSWORD: ${PASSWORD_MASKED:0:$PASSWORD_LENGTH} ($PASSWORD_LENGTH caracteres)"
fi

# Verificar SITE_URL
if [ -z "$SITE_URL" ]; then
  echo "❌ SITE_URL não está definido"
  CHECK_FAILED=1
else
  echo "✅ SITE_URL: $SITE_URL"
fi

# Verificar PROJECT_REF
if [ -z "$PROJECT_REF" ]; then
  echo "❌ PROJECT_REF não está definido"
  CHECK_FAILED=1
else
  echo "✅ PROJECT_REF: $PROJECT_REF"
fi

echo ""

if [ $CHECK_FAILED -eq 1 ]; then
  echo "❌ Algumas variáveis de ambiente estão faltando. Por favor, complete o arquivo .env"
  exit 1
else
  echo "✅ Todas as variáveis de ambiente necessárias estão configuradas!"
fi
