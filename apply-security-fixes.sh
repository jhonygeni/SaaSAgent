#!/bin/bash
# apply-security-fixes.sh - Script to apply security fixes to the codebase

echo "===== ConversaAI Brasil - Security Fix Script ====="
echo "This script will help you apply security fixes to protect sensitive credentials"
echo ""

# Check if .env file exists
if [ -f ".env" ]; then
  echo "✓ .env file already exists"
else
  echo "Creating .env file from template..."
  cp .env.example .env
  echo "✓ .env file created. Please edit it to add your secure credentials."
  echo "⚠️  YOU MUST CHANGE THE SMTP PASSWORD IN THE .ENV FILE"
fi

# Check if credentials are still hardcoded
if grep -q "SMTP_PASSWORD=\"Vu1@+H\*Mw\^3\"" ./supabase/deploy-custom-email.sh; then
  echo "❌ ERROR: Hardcoded credentials still found in deploy-custom-email.sh"
  echo "Please make sure you've applied all the security fixes."
else
  echo "✓ No hardcoded credentials found in deploy-custom-email.sh"
fi

if grep -q "SMTP_PASSWORD=Vu1@+H\*Mw\^3" ./README-EMAIL-CUSTOM.md; then
  echo "❌ ERROR: Hardcoded credentials still found in README-EMAIL-CUSTOM.md"
  echo "Please make sure you've applied all the security fixes."
else
  echo "✓ No hardcoded credentials found in README-EMAIL-CUSTOM.md"
fi

echo ""
echo "===== IMPORTANT SECURITY ACTIONS ====="
echo "1. ⚠️  YOU MUST REVOKE THE EXPOSED CREDENTIALS IMMEDIATELY"
echo "   - Change the password for validar@geni.chat in your Hostinger account"
echo ""
echo "2. ⚠️  After revoking the old credentials, update your .env file with the new password"
echo ""
echo "3. ⚠️  Update the Supabase environment variables with the new credentials:"
echo "   Run: source .env && supabase secrets set SMTP_HOST=\$SMTP_HOST SMTP_PORT=\$SMTP_PORT SMTP_USERNAME=\$SMTP_USERNAME SMTP_PASSWORD=\$SMTP_PASSWORD SITE_URL=\$SITE_URL --project-ref \$PROJECT_REF"
echo ""
echo "4. ⚠️  Redeploy the custom-email function after updating credentials:"
echo "   Run: ./supabase/deploy-custom-email.sh"
echo ""
echo "===== VERIFICATION ====="
echo "To verify your email setup is working correctly after applying fixes:"
echo "Run: node test-custom-email.js"

# Make the script executable
chmod +x ./supabase/deploy-custom-email.sh
