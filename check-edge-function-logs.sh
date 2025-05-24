#!/bin/bash
# Script to check logs from custom email Edge function

PROJECT_REF="hpovwcaskorzzrpphgkc"
FUNCTION_NAME="custom-email"

echo "Fetching logs for function '$FUNCTION_NAME' in project '$PROJECT_REF'..."
supabase functions logs "$FUNCTION_NAME" --project-ref "$PROJECT_REF"

echo ""
echo "To stream logs in real-time, run:"
echo "supabase functions logs $FUNCTION_NAME --project-ref $PROJECT_REF --no-verify --follow"
