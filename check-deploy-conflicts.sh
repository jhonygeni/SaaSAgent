#!/bin/bash

# Script para verificar e resolver conflitos de arquivos antes do deploy Vercel
# Resolve o erro: "Two or more files have conflicting paths or names"

echo "🔍 Verificando conflitos de arquivos para deploy Vercel..."

# Função para encontrar conflitos
check_conflicts() {
    echo "📋 Procurando por arquivos com mesmo nome mas extensões diferentes..."
    
    # Procurar por arquivos .js, .ts, .jsx, .tsx
    find . -name "*.js" -o -name "*.ts" -o -name "*.jsx" -o -name "*.tsx" | \
    grep -E '\.(js|ts|jsx|tsx)$' | \
    sed 's/\.[^.]*$//' | \
    sort | uniq -d > /tmp/conflicts.txt
    
    if [ -s /tmp/conflicts.txt ]; then
        echo "⚠️  Conflitos encontrados:"
        while read -r conflict; do
            echo "   $conflict.*"
            ls -la "$conflict".* 2>/dev/null
        done < /tmp/conflicts.txt
        return 1
    else
        echo "✅ Nenhum conflito encontrado!"
        return 0
    fi
}

# Função para limpar arquivos temporários/debug desnecessários
clean_temp_files() {
    echo "🧹 Limpando arquivos temporários e de debug..."
    
    # Remover arquivos de debug específicos que podem causar conflitos
    find . -name "*-debug.*" -type f | head -10 | while read -r file; do
        if [[ -f "$file" ]]; then
            echo "   Removendo: $file"
            rm "$file"
        fi
    done
    
    # Remover arquivos de teste duplicados
    find . -name "*test*" -type f | grep -E '\.(js|ts)$' | while read -r file; do
        base=$(echo "$file" | sed 's/\.[^.]*$//')
        if [[ -f "${base}.js" && -f "${base}.ts" ]]; then
            echo "   Conflito encontrado: $base"
            # Manter o .js se ambos existirem (geralmente mais recente)
            if [[ "$file" == "${base}.ts" ]]; then
                echo "   Removendo: $file"
                rm "$file"
            fi
        fi
    done
}

# Verificar estrutura da pasta api
check_api_structure() {
    echo "📁 Verificando estrutura da pasta api..."
    
    if [[ -d "api" ]]; then
        echo "   Pasta api encontrada"
        
        # Verificar se há arquivos com mesmo nome
        find api -name "*.js" -o -name "*.ts" | while read -r file; do
            basename_file=$(basename "$file" | sed 's/\.[^.]*$//')
            dirname_file=$(dirname "$file")
            
            js_file="${dirname_file}/${basename_file}.js"
            ts_file="${dirname_file}/${basename_file}.ts"
            
            if [[ -f "$js_file" && -f "$ts_file" ]]; then
                echo "   ⚠️  Conflito: $basename_file (js e ts)"
                echo "      JS: $(stat -f%m "$js_file" 2>/dev/null || echo "N/A")"
                echo "      TS: $(stat -f%m "$ts_file" 2>/dev/null || echo "N/A")"
            fi
        done
    else
        echo "   Pasta api não encontrada"
    fi
}

# Executar verificações
main() {
    echo "🚀 Iniciando verificação de conflitos para Vercel..."
    echo "Data: $(date)"
    echo ""
    
    # Mudar para o diretório do projeto
    cd "$(dirname "$0")"
    
    # Executar verificações
    check_api_structure
    echo ""
    
    clean_temp_files
    echo ""
    
    if check_conflicts; then
        echo ""
        echo "✅ Projeto pronto para deploy na Vercel!"
        echo "   Pode executar: vercel --prod"
        exit 0
    else
        echo ""
        echo "❌ Conflitos encontrados! Resolva antes do deploy."
        echo "   Execute este script novamente após resolver."
        exit 1
    fi
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
