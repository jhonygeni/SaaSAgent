#!/bin/bash

# Script para configurar função de email no Supabase usando variáveis de ambiente

# Verificar variáveis obrigatórias
required_vars=(
  "SUPABASE_PROJECT_REF"
  "VITE_SMTP_HOST"
  "VITE_SMTP_PORT"
  "VITE_SMTP_USERNAME"
  "VITE_SMTP_PASSWORD"
  "VITE_SITE_URL"
)

echo "🔍 Verificando variáveis de ambiente..."

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    echo "❌ Erro: $var não está definida"
    echo "Configure a variável no arquivo .env.local ou no dashboard da Vercel"
    exit 1
  fi
done

echo "✅ Todas as variáveis necessárias estão configuradas"
echo ""

echo "🔧 Configurando função de email..."

# Configurar variáveis de ambiente da função Edge
supabase secrets set \
  SMTP_HOST="$VITE_SMTP_HOST" \
  SMTP_PORT="$VITE_SMTP_PORT" \
  SMTP_USERNAME="$VITE_SMTP_USERNAME" \
  SMTP_PASSWORD="$VITE_SMTP_PASSWORD" \
  SITE_URL="$VITE_SITE_URL" \
  --project-ref "$SUPABASE_PROJECT_REF"

if [ $? -eq 0 ]; then
  echo "✅ Configuração concluída com sucesso!"
  echo ""
  echo "Para verificar as configurações:"
  echo "supabase secrets list --project-ref $SUPABASE_PROJECT_REF"
else
  echo "❌ Erro ao configurar variáveis"
  echo "Verifique se o token do Supabase está configurado corretamente"
  exit 1
fi
