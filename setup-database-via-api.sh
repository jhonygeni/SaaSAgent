#!/bin/bash

# Script para executar o setup SQL no banco de dados via API REST

PROJECT_REF="hpovwcaskorzzrpphgkc"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU"

echo "🚀 Executando setup do banco de dados..."

# 1. Criar plano gratuito
echo "📋 1. Criando plano gratuito..."
curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/subscription_plans" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Free",
    "price": 0,
    "interval": "month", 
    "message_limit": 50,
    "agent_limit": 1,
    "is_active": true,
    "description": "Plano gratuito com recursos limitados",
    "features": {"basic_ai": true, "single_agent": true}
  }'

echo ""

# 2. Criar outros planos
echo "📋 2. Criando plano Starter..."
curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/subscription_plans" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Starter",
    "price": 19900,
    "interval": "month",
    "message_limit": 2500,
    "agent_limit": 1,
    "is_active": true,
    "description": "Para pequenos negócios",
    "features": {"basic_ai": true, "single_agent": true, "priority_support": true}
  }'

echo ""

echo "📋 3. Criando plano Growth..."
curl -X POST "https://${PROJECT_REF}.supabase.co/rest/v1/subscription_plans" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Growth", 
    "price": 24900,
    "interval": "month",
    "message_limit": 5000,
    "agent_limit": 3,
    "is_active": true,
    "description": "Para empresas em expansão",
    "features": {"basic_ai": true, "multiple_agents": true, "priority_support": true, "advanced_analytics": true}
  }'

echo ""
echo ""

# 3. Verificar se os planos foram criados
echo "🔍 4. Verificando planos criados..."
curl -X GET "https://${PROJECT_REF}.supabase.co/rest/v1/subscription_plans?select=name,price,message_limit" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}"

echo ""
echo ""
echo "✅ Setup inicial do banco concluído!"
