#!/bin/bash

# Script para configurar webhook de autenticação no Supabase
# IMPORTANTE: Este webhook precisa ser configurado no console do Supabase também

PROJECT_REF="hpovwcaskorzzrpphgkc"
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/custom-email"

echo "🔗 Configurando webhook de autenticação do Supabase"
echo "=============================================="
echo ""
echo "IMPORTANTE: Você precisa configurar o webhook também no console do Supabase:"
echo "1. Acesse: https://app.supabase.com/project/${PROJECT_REF}/auth/settings"
echo "2. Na seção 'Auth Hooks', adicione:"
echo "   - Event: User signup confirmed"
echo "   - URL: ${WEBHOOK_URL}"
echo "   - HTTP Method: POST"
echo ""

# Vamos testar se o webhook está funcionando simulando uma chamada
echo "🧪 Testando webhook de autenticação..."

# Payload que o Supabase enviaria para o webhook
TEST_PAYLOAD='{
  "type": "signup",
  "table": "users",
  "record": {
    "id": "test-user-id",
    "email": "teste-webhook@exemplo.com",
    "email_confirmed_at": null,
    "raw_user_meta_data": {
      "name": "Usuário Teste Webhook"
    }
  },
  "old_record": null
}'

echo "📤 Enviando payload de teste para webhook..."
curl -X POST "${WEBHOOK_URL}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc" \
  -d "${TEST_PAYLOAD}" \
  --max-time 15

echo ""
echo ""
echo "✅ Teste do webhook concluído!"
echo ""
echo "📋 Próximos passos para completar a configuração:"
echo "1. Configure o webhook no console: https://app.supabase.com/project/${PROJECT_REF}/auth/settings"
echo "2. Execute o SQL dos triggers: Acesse https://app.supabase.com/project/${PROJECT_REF}/sql"
echo "3. Cole e execute o conteúdo do arquivo: supabase/user-trigger-setup.sql"
echo "4. Teste o cadastro de um novo usuário"
