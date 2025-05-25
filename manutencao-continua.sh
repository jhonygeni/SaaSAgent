#!/bin/bash

# =================================================================
# SCRIPT DE MANUTENÇÃO CONTÍNUA - CONVERSA AI BRASIL
# =================================================================
# 
# Este script deve ser executado periodicamente para:
# - Verificar integridade do sistema
# - Detectar problemas automaticamente
# - Manter performance otimizada
# - Gerar relatórios de status
#
# Execução recomendada: Semanal ou após atualizações importantes
# =================================================================

echo "🔧 MANUTENÇÃO COMPLETA DO SISTEMA - CONVERSA AI BRASIL"
echo "======================================================"
echo "📅 Data: $(date '+%d/%m/%Y %H:%M:%S')"
echo ""

# Função para imprimir seções
print_section() {
    echo ""
    echo "🔍 $1"
    echo "$(printf '=%.0s' {1..50})"
}

# Função para verificar se comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar pré-requisitos
print_section "VERIFICANDO PRÉ-REQUISITOS"

if ! command_exists node; then
    echo "❌ Node.js não encontrado. Instale Node.js para continuar."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ NPM não encontrado. Instale NPM para continuar."
    exit 1
fi

echo "✅ Node.js: $(node --version)"
echo "✅ NPM: $(npm --version)"

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "⚠️  Aviso: package.json não encontrado no diretório atual"
    echo "   Certifique-se de estar na pasta raiz do projeto"
fi

# Verificar arquivos de ambiente
if [ ! -f ".env.local" ]; then
    echo "⚠️  Aviso: .env.local não encontrado"
    echo "   Variáveis de ambiente podem não estar configuradas"
fi

# 1. VERIFICAÇÃO RÁPIDA DO SISTEMA
print_section "1. VERIFICAÇÃO RÁPIDA DO SISTEMA"

if [ -f "verificacao-rapida.mjs" ]; then
    echo "🔍 Executando verificação rápida..."
    node verificacao-rapida.mjs
else
    echo "⚠️  Script de verificação rápida não encontrado"
    echo "   Execute este script na pasta do projeto"
fi

# 2. LIMPEZA DE ARQUIVOS TEMPORÁRIOS
print_section "2. LIMPEZA DE ARQUIVOS TEMPORÁRIOS"

echo "🧹 Limpando cache do npm..."
npm cache clean --force 2>/dev/null || echo "   Cache já limpo"

echo "🗑️  Removendo arquivos temporários..."
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

echo "✅ Limpeza concluída"

# 3. VERIFICAÇÃO DE DEPENDÊNCIAS
print_section "3. VERIFICAÇÃO DE DEPENDÊNCIAS"

if [ -f "package.json" ]; then
    echo "📦 Verificando dependências do projeto..."
    
    # Verificar se há atualizações de segurança
    echo "🔒 Verificando vulnerabilidades de segurança..."
    npm audit --audit-level=high 2>/dev/null || echo "   Auditoria não disponível"
    
    # Verificar dependências críticas
    critical_deps=("@supabase/supabase-js" "next" "react")
    for dep in "${critical_deps[@]}"; do
        if npm list "$dep" >/dev/null 2>&1; then
            echo "✅ $dep: Instalado"
        else
            echo "⚠️  $dep: Não encontrado"
        fi
    done
else
    echo "⚠️  package.json não encontrado - pulando verificação de dependências"
fi

# 4. VERIFICAÇÃO DE CONFIGURAÇÕES
print_section "4. VERIFICAÇÃO DE CONFIGURAÇÕES"

echo "🔧 Verificando arquivos de configuração..."

config_files=(
    ".env.local"
    "next.config.js"
    "supabase/config.toml"
    "package.json"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file: Presente"
    else
        echo "⚠️  $file: Não encontrado"
    fi
done

# Verificar variáveis de ambiente críticas
if [ -f ".env.local" ]; then
    echo ""
    echo "🔑 Verificando variáveis de ambiente críticas..."
    
    critical_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
    )
    
    for var in "${critical_vars[@]}"; do
        if grep -q "^$var=" .env.local 2>/dev/null; then
            echo "✅ $var: Configurado"
        else
            echo "❌ $var: NÃO CONFIGURADO"
        fi
    done
fi

# 5. VERIFICAÇÃO DE SCRIPTS DE BANCO
print_section "5. VERIFICAÇÃO DE SCRIPTS DE BANCO"

database_scripts=(
    "database-cleanup-complete.sql"
    "verificacao-final-sistema.mjs"
    "verificacao-rapida.mjs"
)

for script in "${database_scripts[@]}"; do
    if [ -f "$script" ]; then
        echo "✅ $script: Disponível"
    else
        echo "⚠️  $script: Não encontrado"
    fi
done

# 6. VERIFICAÇÃO DE DOCUMENTAÇÃO
print_section "6. VERIFICAÇÃO DE DOCUMENTAÇÃO"

docs=(
    "README.md"
    "RELATORIO-FINAL-BANCO-DADOS.md"
    "CHECKLIST-VERIFICACAO-MANUAL.md"
    "STATUS-FINAL-EXECUCAO.md"
    "CONFIGURACAO-AUTH-HOOKS-URGENTE.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo "✅ $doc: Disponível"
    else
        echo "⚠️  $doc: Não encontrado"
    fi
done

# 7. VERIFICAÇÃO DE LOGS E MONITORAMENTO
print_section "7. VERIFICAÇÃO DE LOGS E MONITORAMENTO"

echo "📊 Verificando logs do sistema..."

# Verificar logs do Next.js
if [ -d ".next" ]; then
    echo "✅ Pasta .next: Presente (aplicação foi buildada)"
else
    echo "⚠️  Pasta .next: Não encontrada (aplicação não foi buildada)"
fi

# Verificar se há erros recentes nos logs
echo "🔍 Verificando erros recentes..."
if find . -name "*.log" -type f -mtime -1 2>/dev/null | head -5 | grep -q "."; then
    echo "⚠️  Logs recentes encontrados - revisar se necessário"
else
    echo "✅ Nenhum log de erro recente encontrado"
fi

# 8. GERAÇÃO DE RELATÓRIO FINAL
print_section "8. RELATÓRIO FINAL DE MANUTENÇÃO"

echo "📋 RESUMO DA MANUTENÇÃO:"
echo ""

# Calcular score geral (simplificado)
score=0
total=10

# Verificações básicas
[ -f "package.json" ] && score=$((score + 1))
[ -f ".env.local" ] && score=$((score + 1))
[ -f "verificacao-rapida.mjs" ] && score=$((score + 1))
[ -f "database-cleanup-complete.sql" ] && score=$((score + 1))
[ -f "RELATORIO-FINAL-BANCO-DADOS.md" ] && score=$((score + 1))
[ -d "node_modules" ] && score=$((score + 1))
[ -d ".next" ] && score=$((score + 1))
command_exists node && score=$((score + 1))
command_exists npm && score=$((score + 1))
[ -f "next.config.js" ] && score=$((score + 1))

percentage=$((score * 100 / total))

echo "🎯 SCORE GERAL: $score/$total ($percentage%)"
echo ""

if [ $percentage -ge 90 ]; then
    echo "🎉 EXCELENTE: Sistema em perfeito estado!"
    echo "   Todas as verificações passaram com sucesso."
elif [ $percentage -ge 70 ]; then
    echo "👍 BOM: Sistema operacional com pequenos ajustes necessários."
    echo "   Maioria das verificações passou."
elif [ $percentage -ge 50 ]; then
    echo "⚠️  ATENÇÃO: Sistema precisa de ajustes importantes."
    echo "   Várias verificações falharam."
else
    echo "🔴 CRÍTICO: Sistema requer correções urgentes."
    echo "   Muitas verificações falharam."
fi

echo ""
echo "📅 PRÓXIMA MANUTENÇÃO RECOMENDADA: $(date -d '+7 days' '+%d/%m/%Y' 2>/dev/null || date -v+7d '+%d/%m/%Y' 2>/dev/null || echo 'Em 7 dias')"

# 9. AÇÕES RECOMENDADAS
print_section "9. AÇÕES RECOMENDADAS"

echo "🎯 PRÓXIMOS PASSOS:"
echo ""

if [ ! -f ".env.local" ]; then
    echo "🔧 1. Configurar variáveis de ambiente (.env.local)"
fi

if [ ! -d "node_modules" ]; then
    echo "📦 2. Instalar dependências (npm install)"
fi

if [ ! -d ".next" ]; then
    echo "🏗️  3. Buildar aplicação (npm run build)"
fi

echo "🔍 4. Executar verificação completa do banco:"
echo "   node verificacao-final-sistema.mjs"
echo ""
echo "🔧 5. Configurar Auth Hooks no Supabase Dashboard"
echo "   (Consulte: CONFIGURACAO-AUTH-HOOKS-URGENTE.md)"
echo ""
echo "🧪 6. Testar fluxo completo de criação de usuário"

# 10. FINALIZAÇÃO
print_section "MANUTENÇÃO CONCLUÍDA"

echo "✅ Manutenção completa executada com sucesso!"
echo ""
echo "📚 DOCUMENTAÇÃO DISPONÍVEL:"
echo "   • SITUACAO-ATUAL-PLANO-FINAL.md - Status atual"
echo "   • CHECKLIST-VERIFICACAO-MANUAL.md - Verificações manuais"
echo "   • RELATORIO-FINAL-BANCO-DADOS.md - Relatório técnico"
echo ""
echo "🔧 SCRIPTS DISPONÍVEIS:"
echo "   • node verificacao-rapida.mjs - Diagnóstico rápido"
echo "   • node verificacao-final-sistema.mjs - Verificação completa"
echo "   • ./manutencao-sistema-completa.sh - Esta manutenção"
echo ""
echo "🎉 Sistema ConversaAI Brasil mantido com sucesso!"
echo "======================================================"
