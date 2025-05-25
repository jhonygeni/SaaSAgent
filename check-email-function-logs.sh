#!/bin/bash
# check-email-function-logs.sh
#
# Este script verifica os logs da função custom-email
# Para identificar problemas no envio de e-mails

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cabeçalho
echo -e "${BLUE}"
echo "======================================================"
echo "  Verificação de Logs da Função custom-email"
echo "======================================================"
echo -e "${NC}"

# Verificar se o CLI do Supabase está instalado
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI não encontrado! Por favor, instale-o com:${NC}"
    echo "npm install -g supabase"
    exit 1
fi

# Carregar variáveis do arquivo .env se existir
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Definir variáveis do projeto
PROJECT_REF="${PROJECT_REF:-hpovwcaskorzzrpphgkc}"

# Verificar logs da função
echo -e "${YELLOW}Buscando logs da função custom-email...${NC}"
echo -e "${YELLOW}(Isso pode demorar alguns segundos)${NC}\n"

supabase functions logs custom-email --limit 50 --project-ref "$PROJECT_REF"

if [ $? -ne 0 ]; then
    echo -e "\n${RED}Erro ao buscar logs. Verifique se você está logado no Supabase CLI.${NC}"
    echo "Para fazer login, execute: supabase login"
else
    echo -e "\n${GREEN}Logs recuperados com sucesso!${NC}"
    
    # Verificar se houve algum erro nos logs
    echo -e "\n${BLUE}Verificando erros nos logs...${NC}"
    supabase functions logs custom-email --limit 100 --project-ref "$PROJECT_REF" | grep -i "erro\|error\|falha\|failed" 
    
    if [ $? -eq 0 ]; then
        echo -e "\n${YELLOW}⚠️ Encontrados possíveis erros nos logs (listados acima).${NC}"
    else
        echo -e "\n${GREEN}✓ Nenhum erro encontrado nos logs recentes.${NC}"
    fi
fi

echo -e "\n${BLUE}Para verificar a função de email, use:${NC}"
echo -e "  ${GREEN}node test-custom-email-formats.js${NC} (Testa a função com vários formatos)"
echo -e "  ${GREEN}node check-smtp-config.js${NC} (Verifica a configuração SMTP e envia email de teste)\n"
