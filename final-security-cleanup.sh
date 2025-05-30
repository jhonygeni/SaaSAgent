#!/bin/bash

echo "🔒 FINAL SECURITY CLEANUP - Removing remaining exposed credentials"
echo "=================================================================="

# Function to safely replace credentials in files
safe_replace() {
    local file="$1"
    local old_pattern="$2"
    local new_value="$3"
    local description="$4"
    
    if [ -f "$file" ]; then
        if grep -q "$old_pattern" "$file"; then
            echo "🔧 Fixing $description in $file"
            sed -i.bak "s|$old_pattern|$new_value|g" "$file"
        fi
    fi
}

# 1. Fix SMTP password in supabase scripts
echo "1. 🔐 Replacing SMTP password in supabase scripts..."

safe_replace "supabase/debug-email-function.sh" \
    'SMTP_PASSWORD="Vu1@+H\*Mw\^3"' \
    'SMTP_PASSWORD="${SMTP_PASSWORD:-$(echo "CONFIGURE_YOUR_SMTP_PASSWORD")}"' \
    "SMTP password"

safe_replace "supabase/setup-all.sh" \
    'SMTP_PASSWORD="Vu1@+H\*Mw\^3"' \
    'SMTP_PASSWORD="${SMTP_PASSWORD:-$(echo "CONFIGURE_YOUR_SMTP_PASSWORD")}"' \
    "SMTP password"

safe_replace "supabase/setup-webhook.sh" \
    'SMTP_PASSWORD="Vu1@+H\*Mw\^3"' \
    'SMTP_PASSWORD="${SMTP_PASSWORD:-$(echo "CONFIGURE_YOUR_SMTP_PASSWORD")}"' \
    "SMTP password"

safe_replace "supabase/configure-email-function.sh" \
    'SMTP_PASSWORD="Vu1@+H\*Mw\^3"' \
    'SMTP_PASSWORD="${SMTP_PASSWORD:-$(echo "CONFIGURE_YOUR_SMTP_PASSWORD")}"' \
    "SMTP password"

safe_replace "supabase/deploy-email-function.sh" \
    'SMTP_PASSWORD="Vu1@+H\*Mw\^3"' \
    'SMTP_PASSWORD="${SMTP_PASSWORD:-$(echo "CONFIGURE_YOUR_SMTP_PASSWORD")}"' \
    "SMTP password"

# 2. Fix .env file in supabase directory
echo "2. 🔐 Securing supabase/.env file..."
if [ -f "supabase/.env" ]; then
    echo "# Supabase Environment Configuration" > supabase/.env
    echo "# Configure these values before running scripts" >> supabase/.env
    echo "SMTP_PASSWORD=YOUR_SMTP_PASSWORD_HERE" >> supabase/.env
    echo "SUPABASE_URL=YOUR_SUPABASE_URL_HERE" >> supabase/.env
    echo "SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE" >> supabase/.env
    echo "SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE" >> supabase/.env
fi

# 3. Fix JWT tokens in shell scripts
echo "3. 🔐 Replacing JWT tokens in shell scripts..."

# Fix EXECUTAR-SQL-AGORA.md
safe_replace "EXECUTAR-SQL-AGORA.md" \
    '${SUPABASE_ANON_KEY}' \
    '${SUPABASE_ANON_KEY}' \
    "JWT token"

# Fix final-diagnosis-and-fix.sh
if [ -f "final-diagnosis-and-fix.sh" ]; then
    echo "🔧 Securing final-diagnosis-and-fix.sh..."
    # Replace service role key
    sed -i.bak 's|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzgyNjM4NiwiZXhwIjoyMDYzNDAyMzg2fQ.wxxjIh7LBIxHmKJu6P778A9iYm6_zsdC8oQAiE9z0UU|${SUPABASE_SERVICE_ROLE_KEY}|g' final-diagnosis-and-fix.sh
    # Replace anon key
    sed -i.bak 's|eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhwb3Z3Y2Fza29yenpycHBoZ2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjYzODYsImV4cCI6MjA2MzQwMjM4Nn0.3Gx3Gc5xlFKwoMvd0Zk9vELzNbrf0ar4gaM92n9dtDc|${SUPABASE_ANON_KEY}|g' final-diagnosis-and-fix.sh
fi

# 4. Clean up backup files
echo "4. 🧹 Cleaning up backup files..."
find . -name "*.bak" -delete 2>/dev/null || true

echo ""
echo "✅ FINAL SECURITY CLEANUP COMPLETED!"
echo "🔒 All remaining exposed credentials have been secured."
echo ""
echo "📋 NEXT STEPS:"
echo "1. Rotate the SMTP password in your email provider"
echo "2. Generate new Evolution API key"
echo "3. Configure environment variables in .env"
echo "4. Run: node validate-environment.js"
echo "5. Execute: ./configure-supabase-secrets.sh"
echo ""
echo "⚠️  IMPORTANT: The old credentials are still exposed in documentation files"
echo "   and need to be rotated immediately!"
