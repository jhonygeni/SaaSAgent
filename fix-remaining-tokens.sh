#!/bin/bash
echo "🔧 Corrigindo tokens JWT em arquivos restantes..."

# Backup primeiro
BACKUP_DIR=".security-backup/tokens-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Lista de arquivos para corrigir
FILES=(
    "test-complete-system.mjs"
    "test-after-sql-triggers.mjs" 
    "test-email-function.js"
    "test-simple.mjs"
    "check-auth-interface.mjs"
    "quick-diagnosis.mjs"
    "test-custom-email-esm.js"
    "test-signup-flow.js" 
    "test-new-domain.js"
    "diagnose-check-subscription.js"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "🔧 Corrigindo: $file"
        cp "$file" "$BACKUP_DIR/"
        
        # Substituir JWT tokens por variáveis de ambiente
        sed -i.bak 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[^'"'"'"]*/process.env.SUPABASE_ANON_KEY || ""/g' "$file"
        rm "$file.bak" 2>/dev/null || true
        echo "✅ $file corrigido"
    fi
done

echo "🎉 Correção de tokens concluída!"
echo "📁 Backup salvo em: $BACKUP_DIR"
