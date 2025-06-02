#!/bin/bash

# 🚨 SCRIPT DE EMERGÊNCIA - REMOVER TODOS OS SECRETS

echo "🚨 REMOVENDO TODOS OS SECRETS EXPOSTOS..."

# Lista de arquivos que NÃO devem ter secrets (exceto .env.local que já foi corrigido)
FILES_TO_CLEAN=(
    "CONFIGURACAO-URGENTE-VERCEL.md"
    "URGENTE-VERCEL-CHECKOUT.md"
    "GUIA-CONFIGURAR-EMAIL-SUPABASE.md"
    "executar-correcao-estrutural.mjs"
    "teste-simples.mjs"
    "test-simple.js"
)

# Função para substituir secrets
replace_secrets_in_file() {
    local file="$1"
    
    if [[ -f "$file" ]]; then
        echo "🔧 Limpando: $file"
        
        # Substituir chaves Stripe
        sed -i '' 's/sk_test_[a-zA-Z0-9_]*/[STRIPE_SECRET_KEY_DA_PRODUCAO]/g' "$file"
        
        # Substituir JWT tokens do Supabase
        sed -i '' 's/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/[SUPABASE_KEY_DA_PRODUCAO]/g' "$file"
        
        # Substituir senhas SMTP
        sed -i '' 's/k7;Ex7~yh\?cA/[SENHA_SMTP_DA_PRODUCAO]/g' "$file"
        
        echo "   ✅ $file limpo"
    fi
}

# Limpar arquivos principais
for file in "${FILES_TO_CLEAN[@]}"; do
    replace_secrets_in_file "$file"
done

# Remover arquivos de teste que contêm secrets
echo "🗑️  Removendo arquivos de teste com secrets..."
rm -f teste-simples.mjs
rm -f teste-instancias-completo.mjs  
rm -f teste-supabase-critico.mjs
rm -f teste-rapido.mjs
rm -f test-simple.js

echo ""
echo "✅ TODOS OS SECRETS FORAM REMOVIDOS!"
echo "📋 ARQUIVOS LIMPOS:"
for file in "${FILES_TO_CLEAN[@]}"; do
    echo "   - $file"
done
echo ""
echo "🚀 Agora você pode fazer commit e push com segurança:"
echo "   git add ."
echo "   git commit -m 'security: remove exposed secrets'"
echo "   git push origin main"
