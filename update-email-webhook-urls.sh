#!/usr/bin/env bash

# This script contains instructions to update the email URL in Supabase
# You need to manually perform these steps in the Supabase console

# Display header
echo "======================================"
echo "  Supabase Email URL Update Guide     "
echo "======================================"
echo ""

# Set variables
SUPABASE_PROJECT_ID="hpovwcaskorzzrpphgkc"
WEBHOOK_URL="https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/custom-email"
SITE_URL="https://saa-s-agent.vercel.app"

# Display instructions
echo "Follow these steps to update the email webhook in Supabase:"
echo ""
echo "1. Log in to the Supabase dashboard at https://app.supabase.com"
echo "2. Select your project: ${SUPABASE_PROJECT_ID}"
echo "3. Navigate to Authentication > Email Templates"
echo ""
echo "4. Configure the URL for Custom Email Server:"
echo "   - Copy this URL: ${WEBHOOK_URL}"
echo "   - Paste it in the 'Custom Email Server URL' field"
echo ""
echo "5. Update the Site URL in Project Settings:"
echo "   - Navigate to Project Settings > General"
echo "   - Change the Site URL from 'http://localhost:3000' to: ${SITE_URL}"
echo ""
echo "6. Update Email Redirect URLs:"
echo "   - Navigate to Authentication > URL Configuration"
echo "   - Update the Redirect URLs to include: ${SITE_URL}"
echo "   - Make sure to keep any existing URLs like localhost for development"
echo ""
echo "7. Verify the changes by testing the sign-up flow:"
echo "   - Run the test script: node test-signup-flow.js"
echo ""
echo "======================================"
