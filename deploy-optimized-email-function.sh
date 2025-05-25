#!/bin/bash
# deploy-optimized-email-function.sh
#
# Script para implantar a versão otimizada da função custom-email
# 
# Este script:
# 1. Faz backup da função atual
# 2. Move a nova versão para o lugar
# 3. Implanta a função otimizada
# 4. Configura as variáveis de ambiente necessárias

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cabeçalho
echo -e "${BLUE}"
echo "======================================================"
echo "  Implantação da Função Edge custom-email Otimizada"
echo "======================================================"
echo -e "${NC}"

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
  echo -e "${RED}Arquivo .env não encontrado. Criando um básico...${NC}"
  touch .env
  echo "# Variáveis de ambiente para o projeto" >> .env
  echo "PROJECT_REF=hpovwcaskorzzrpphgkc" >> .env
  echo "SUPABASE_URL=https://hpovwcaskorzzrpphgkc.supabase.co" >> .env
  echo "SMTP_HOST=smtp.hostinger.com" >> .env
  echo "SMTP_PORT=465" >> .env
  echo "SMTP_USERNAME=validar@geni.chat" >> .env
  echo "SMTP_FROM=validar@geni.chat" >> .env
  echo "SITE_URL=https://app.conversaai.com.br" >> .env
fi

# Carregar variáveis do arquivo .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Definir variáveis do projeto
PROJECT_REF="${PROJECT_REF:-hpovwcaskorzzrpphgkc}"
SITE_URL="${SITE_URL:-https://app.conversaai.com.br}"
SMTP_HOST="${SMTP_HOST:-smtp.hostinger.com}"
SMTP_PORT="${SMTP_PORT:-465}"
SMTP_USERNAME="${SMTP_USERNAME:-validar@geni.chat}"
SMTP_FROM="${SMTP_FROM:-validar@geni.chat}"

# Solicitar senha SMTP se não estiver disponível
if [ -z "$SMTP_PASSWORD" ]; then
  echo -e "${YELLOW}SMTP_PASSWORD não encontrada no ambiente.${NC}"
  echo -n "Digite a senha SMTP para $SMTP_USERNAME: "
  read -s SMTP_PASSWORD
  echo ""
  
  if [ -z "$SMTP_PASSWORD" ]; then
    echo -e "${RED}Nenhuma senha fornecida. Abortando...${NC}"
    exit 1
  fi
fi

# 1. Criar backup da função atual
echo -e "${BLUE}1. Criando backup da função atual...${NC}"
BACKUP_DIR="./supabase/functions/custom-email-backup"
mkdir -p "$BACKUP_DIR"

if [ -f "./supabase/functions/custom-email/index.ts" ]; then
  cp "./supabase/functions/custom-email/index.ts" "$BACKUP_DIR/index.ts.bak"
  echo -e "${GREEN}✓ Backup criado em $BACKUP_DIR/index.ts.bak${NC}"
else
  echo -e "${YELLOW}⚠️ Função original não encontrada. Pulando backup.${NC}"
fi

# 2. Mover a nova versão para o local correto
echo -e "${BLUE}2. Instalando nova versão da função...${NC}"
if [ -f "./supabase/functions/custom-email/index.ts.new" ]; then
  mv "./supabase/functions/custom-email/index.ts.new" "./supabase/functions/custom-email/index.ts"
  echo -e "${GREEN}✓ Nova versão instalada${NC}"
else
  echo -e "${RED}❌ Arquivo da nova versão não encontrado!${NC}"
  echo -e "${RED}Verifique se o arquivo ./supabase/functions/custom-email/index.ts.new existe.${NC}"
  exit 1
fi

# 3. Implantar a função
echo -e "${BLUE}3. Implantando função Edge atualizada...${NC}"
cd ./supabase
supabase functions deploy custom-email \
  --project-ref "$PROJECT_REF" \
  --no-verify-jwt

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Falha ao implantar função!${NC}"
  echo "Verificando a existência do arquivo index.ts"
  ls -la ./functions/custom-email/
  exit 1
fi

echo -e "${GREEN}✓ Função implantada com sucesso${NC}"

# 4. Configurar variáveis de ambiente
echo -e "${BLUE}4. Configurando variáveis de ambiente...${NC}"
supabase secrets set \
  SMTP_HOST="$SMTP_HOST" \
  SMTP_PORT="$SMTP_PORT" \
  SMTP_USERNAME="$SMTP_USERNAME" \
  SMTP_PASSWORD="$SMTP_PASSWORD" \
  SMTP_FROM="$SMTP_FROM" \
  SITE_URL="$SITE_URL" \
  PROJECT_REF="$PROJECT_REF" \
  --project-ref "$PROJECT_REF"

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Falha ao configurar variáveis de ambiente!${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Variáveis de ambiente configuradas${NC}"

# Finalizar
echo -e "${BLUE}"
echo "======================================================"
echo "  Implantação Concluída com Sucesso"
echo "======================================================"
echo -e "${NC}"
echo ""
echo -e "Para testar a função, execute: ${GREEN}node test-custom-email-formats.js${NC}"
echo -e "Para verificar os logs, execute: ${GREEN}supabase functions logs custom-email --project-ref $PROJECT_REF${NC}"
echo ""
