#!/bin/bash
echo "🔧 Corrigindo TODOS os tokens JWT restantes..."

# Criar backup final
BACKUP_DIR=".security-backup/final-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Encontrar todos os arquivos com tokens
FILES_WITH_TOKENS=($(grep -rl "${SUPABASE_ANON_KEY}" . --include="*.js" --include="*.mjs" --include="*.ts" | grep -v ".security-backup"))

echo "📁 Arquivos encontrados com tokens:"
for file in "${FILES_WITH_TOKENS[@]}"; do
    echo "  - $file"
    cp "$file" "$BACKUP_DIR/" 2>/dev/null || true
done

echo ""
echo "🔧 Corrigindo tokens..."

for file in "${FILES_WITH_TOKENS[@]}"; do
    if [ -f "$file" ]; then
        echo "Corrigindo: $file"
        # Substituir todos os JWT tokens por variáveis de ambiente
        sed -i.bak 's/${SUPABASE_ANON_KEY}"'"'"]*'"'"'/process.env.SUPABASE_ANON_KEY || ""/g' "$file"
        sed -i.bak2 's/${SUPABASE_ANON_KEY}"'"'"]*"/process.env.SUPABASE_ANON_KEY || ""/g' "$file"
        rm "$file.bak" "$file.bak2" 2>/dev/null || true
        echo "✅ $file corrigido"
    fi
done

echo ""
echo "🔍 Verificando se ainda há tokens..."
REMAINING=$(grep -r "${SUPABASE_ANON_KEY}" . --include="*.js" --include="*.mjs" --include="*.ts" | grep -v ".security-backup" | wc -l)

if [ "$REMAINING" -eq 0 ]; then
    echo "🎉 SUCESSO! Todos os tokens JWT foram removidos!"
else
    echo "⚠️  Ainda restam $REMAINING ocorrências de tokens"
    echo "Arquivos restantes:"
    grep -r "${SUPABASE_ANON_KEY}" . --include="*.js" --include="*.mjs" --include="*.ts" | grep -v ".security-backup" | head -5
fi

echo ""
echo "📁 Backup salvo em: $BACKUP_DIR"
