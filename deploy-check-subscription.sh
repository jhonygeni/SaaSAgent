#!/bin/bash
# Script de implantação para função check-subscription

echo "== Iniciando implantação da função check-subscription =="

# Verificando se o CLI do Supabase está instalado
if ! command -v supabase &> /dev/null
then
    echo "ERRO: CLI do Supabase não encontrado."
    echo "Por favor, instale-o com: npm install -g supabase"
    exit 1
fi

# Verificando se o Docker está rodando
if ! docker info &> /dev/null
then
    echo "ERRO: Docker não está rodando."
    echo "Por favor, inicie o Docker Desktop e tente novamente."
    exit 1
fi

# Navegando para o diretório raiz do projeto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR" || exit 1

echo "== Implantando função check-subscription =="
supabase functions deploy check-subscription

if [ $? -eq 0 ]; then
    echo "== Implantação concluída com sucesso =="
    echo "Verificando funções implantadas..."
    supabase functions list
    
    echo ""
    echo "== PRÓXIMOS PASSOS =="
    echo "1. Acesse a aplicação em produção"
    echo "2. Limpe o cache do navegador ou use Modo Anônimo"
    echo "3. Faça login na aplicação"
    echo "4. Verifique se a barra de progresso mostra valores corretos"
else
    echo "== ERRO na implantação =="
    echo "Por favor, verifique os logs acima para mais detalhes."
fi
