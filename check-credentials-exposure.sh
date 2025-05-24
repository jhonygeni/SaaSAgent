#!/bin/bash
# check-credentials-exposure.sh - Script para verificar se há credenciais expostas no código

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}===== Verificador de Credenciais Expostas =====${NC}"
echo ""

# Arrays para padrões e arquivos a verificar
PATTERNS=(
  "password=\"[^\"]+"
  "password=[^\"']+"
  "PASSWORD=\"[^\"]+"
  "PASSWORD=[^\"']+"
  "api[_-]key=\"[^\"]+"
  "api[_-]key=[^\"']+"
  "token=\"[^\"]+"
  "token=[^\"']+"
  "secret=\"[^\"]+"
  "secret=[^\"']+"
)

# Arquivos/diretórios a ignorar
IGNORE_DIRS=(
  "node_modules"
  "dist"
  ".git"
  "build"
  ".env"
  ".env.local"
  ".env.development"
  ".env.production"
)

ignore_opts=""
for dir in "${IGNORE_DIRS[@]}"; do
  ignore_opts="$ignore_opts --exclude-dir=$dir"
done

# Função para verificar exposição de credenciais
check_credentials() {
  local pattern=$1
  echo -e "Verificando padrão: ${YELLOW}$pattern${NC}"
  
  # Executar grep com o padrão
  results=$(grep -r $ignore_opts "$pattern" --include="*.{js,ts,tsx,jsx,sh,md}" . 2>/dev/null)
  
  if [ -n "$results" ]; then
    echo -e "${RED}⚠️  EXPOSIÇÃO DETECTADA!${NC}"
    echo "$results" | while read -r line; do
      echo -e "${RED}$line${NC}"
    done
    echo ""
    return 1
  else
    echo -e "${GREEN}✅ Nenhuma exposição detectada${NC}"
    echo ""
    return 0
  fi
}

# Verificar cada padrão
status=0
for pattern in "${PATTERNS[@]}"; do
  check_credentials "$pattern"
  if [ $? -ne 0 ]; then
    status=1
  fi
done

echo ""
if [ $status -eq 0 ]; then
  echo -e "${GREEN}✅ Nenhuma credencial exposta detectada nos arquivos verificados.${NC}"
  echo -e "${YELLOW}IMPORTANTE: Esta verificação é básica e pode não detectar todos os casos.${NC}"
  echo -e "${YELLOW}Considere usar ferramentas especializadas como GitGuardian para uma análise mais completa.${NC}"
else
  echo -e "${RED}⚠️  ATENÇÃO: Credenciais expostas foram encontradas no código fonte!${NC}"
  echo -e "${RED}Por favor, remova essas credenciais e substitua por variáveis de ambiente.${NC}"
  echo -e "${YELLOW}Consulte o arquivo SECURITY-GUIDE.md para orientações sobre como proteger credenciais.${NC}"
fi

exit $status
