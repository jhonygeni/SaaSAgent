#!/bin/bash

# Script para verificar o estado do banco de dados e funções
PROJECT_REF="hpovwcaskorzzrpphgkc"

echo "🔍 Diagnóstico Completo - ConversaAI Brasil"
echo "========================================="

# 1. Verificar funções implantadas
echo ""
echo "📋 1. Verificando funções implantadas:"
supabase functions list --project-ref $PROJECT_REF

# 2. Verificar variáveis de ambiente
echo ""
echo "🔧 2. Verificando variáveis de ambiente:"
supabase secrets list --project-ref $PROJECT_REF | grep -E "(SMTP|SITE_URL)"

# 3. Testar função de email diretamente
echo ""
echo "📧 3. Testando função custom-email:"
curl -X POST "https://${PROJECT_REF}.supabase.co/functions/v1/custom-email" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@exemplo.com",
    "type": "signup", 
    "token": "test-token-123",
    "redirect_to": "https://app.conversaai.com.br/confirmar-email",
    "metadata": {"name": "Teste Diagnóstico"}
  }' \
  --max-time 10

echo ""
echo ""
echo "✅ Diagnóstico concluído!"
echo ""
echo "🔍 Para verificar o banco de dados:"
echo "1. Acesse: https://app.supabase.com/project/${PROJECT_REF}"
echo "2. Vá para 'Table Editor' e verifique as tabelas:"
echo "   - profiles"
echo "   - subscription_plans" 
echo "   - subscriptions"
echo ""
echo "📧 Para verificar logs da função de email:"
echo "1. Acesse: https://app.supabase.com/project/${PROJECT_REF}/functions"
echo "2. Clique em 'custom-email'"
echo "3. Vá para a aba 'Logs'"
