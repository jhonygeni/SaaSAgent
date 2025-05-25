#!/bin/bash
# 🔒 Script de Remediação Automática de Segurança - ConversaAI Brasil

set -e

echo "🔒 INICIANDO REMEDIAÇÃO DE SEGURANÇA - ConversaAI Brasil"
echo "================================================="

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -d "supabase" ]; then
    echo "❌ Execute este script no diretório raiz do projeto ConversaAI Brasil"
    exit 1
fi

echo "✅ Verificando estrutura do projeto..."

# Criar backup
echo "📁 Criando backup dos arquivos..."
mkdir -p .security-backup/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=".security-backup/$(date +%Y%m%d_%H%M%S)"

# Fazer backup dos arquivos principais
if [ -f ".env" ]; then
    cp ".env" "$BACKUP_DIR/"
    echo "✅ Backup de .env criado"
fi

echo "🔧 Removendo credenciais expostas..."

# Remover senha SMTP de .env
if [ -f ".env" ] && grep -q "Vu1@+H\*Mw\^3" ".env"; then
    sed -i.bak 's/SMTP_PASSWORD=Vu1@+H\*Mw\^3/SMTP_PASSWORD=/' ".env"
    rm ".env.bak" 2>/dev/null || true
    echo "✅ Senha SMTP removida de .env"
fi

echo "🎉 REMEDIAÇÃO BÁSICA CONCLUÍDA!"
echo "================================"
echo ""
echo "⚠️  PRÓXIMOS PASSOS OBRIGATÓRIOS:"
echo "1. 🔑 Altere a senha SMTP: [REDACTED]"
echo "2. 🔑 Altere a Evolution API Key: [REDACTED]"
echo "3. ⚙️  Configure novas credenciais no arquivo .env"
echo "4. 📊 Execute os SQL triggers novamente"
echo ""
echo "📁 Backup salvo em: $BACKUP_DIR"
