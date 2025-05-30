#!/bin/bash
# Script to check logs from custom email Edge function

PROJECT_REF="hpovwcaskorzzrpphgkc"
FUNCTION_NAME="check-subscription"

echo "Fetching logs for function '$FUNCTION_NAME' in project '$PROJECT_REF'..."
echo "Executando: supabase functions logs $FUNCTION_NAME"

# A nova versão da CLI não usa mais --project-ref
supabase functions logs "$FUNCTION_NAME" 

echo ""
echo "Para ver os logs em tempo real, execute:"
echo "supabase functions logs $FUNCTION_NAME --follow"
