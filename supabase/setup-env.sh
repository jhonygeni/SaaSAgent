#!/bin/bash

# Script para configurar variáveis de ambiente no Supabase de forma segura

# Verificar se as variáveis necessárias estão definidas
if [ -z "$SUPABASE_PROJECT_REF" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: Required environment variables are not set"
  echo "Please set the following variables in your environment or Vercel:"
  echo "- SUPABASE_PROJECT_REF"
  echo "- SUPABASE_ACCESS_TOKEN"
  exit 1
fi

echo "=== Configurando Variáveis de Ambiente no Supabase ==="

# Configurar variáveis de ambiente da função Edge
echo "1. Configurando variáveis de ambiente..."

# Usar variáveis de ambiente ao invés de valores hardcoded
supabase secrets set \
  SMTP_HOST="$VITE_SMTP_HOST" \
  SMTP_PORT="$VITE_SMTP_PORT" \
  SMTP_USERNAME="$VITE_SMTP_USERNAME" \
  SMTP_PASSWORD="$VITE_SMTP_PASSWORD" \
  SITE_URL="$VITE_SITE_URL" \
  --project-ref "$SUPABASE_PROJECT_REF"

echo "✅ Variáveis SMTP e Site configuradas"

# Configurar Evolution API se disponível
if [ ! -z "$VITE_EVOLUTION_API_KEY" ]; then
  echo "2. Configurando Evolution API..."
  supabase secrets set \
    EVOLUTION_API_KEY="$VITE_EVOLUTION_API_KEY" \
    --project-ref "$SUPABASE_PROJECT_REF"
  echo "✅ Evolution API configurada"
fi

# Configurar Stripe se disponível
if [ ! -z "$VITE_STRIPE_SECRET_KEY" ]; then
  echo "3. Configurando Stripe..."
  supabase secrets set \
    STRIPE_SECRET_KEY="$VITE_STRIPE_SECRET_KEY" \
    --project-ref "$SUPABASE_PROJECT_REF"
  echo "✅ Stripe configurado"
fi

echo "🎉 Configuração concluída com sucesso!"
echo ""
echo "Para verificar as configurações, use:"
echo "supabase secrets list --project-ref $SUPABASE_PROJECT_REF" 