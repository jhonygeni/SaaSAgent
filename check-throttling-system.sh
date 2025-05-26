#!/bin/bash

# Script para verificar e testar o sistema anti-looping HTTP
echo "==================================="
echo "VERIFICADOR DE SISTEMA ANTI-LOOPING"
echo "==================================="
echo

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Verifica arquivos
echo -e "${YELLOW}Verificando arquivos de implementação...${NC}"
sleep 1

# Verificar arquivos necessários
if [ -f "./src/lib/subscription-throttle.ts" ]; then
  echo -e "${GREEN}✓ subscription-throttle.ts encontrado${NC}"
else
  echo -e "${RED}✗ subscription-throttle.ts não encontrado!${NC}"
fi

if [ -f "./src/lib/api-throttle.ts" ]; then
  echo -e "${GREEN}✓ api-throttle.ts encontrado${NC}"
else
  echo -e "${RED}✗ api-throttle.ts não encontrado!${NC}"
fi

echo
echo -e "${YELLOW}Verificando implementação em arquivos críticos...${NC}"
sleep 1

# Verificar UserContext.tsx
if grep -q "throttledSubscriptionCheck" "./src/context/UserContext.tsx"; then
  echo -e "${GREEN}✓ Throttling implementado em UserContext.tsx${NC}"
else
  echo -e "${RED}✗ Throttling NÃO implementado em UserContext.tsx!${NC}"
fi

# Verificar AgentChat.tsx
if grep -q "throttleApiCall" "./src/components/AgentChat.tsx"; then
  echo -e "${GREEN}✓ Throttling implementado em AgentChat.tsx${NC}"
else
  echo -e "${RED}✗ Throttling NÃO implementado em AgentChat.tsx!${NC}"
fi

echo
echo -e "${YELLOW}Executando testes do sistema anti-looping...${NC}"
echo

# Executa os testes
node test-throttling-system.mjs

echo
echo -e "${YELLOW}Checklist final:${NC}"
echo "1. Verificar no navegador (DevTools > Network) se as chamadas HTTP estão sendo limitadas"
echo "2. Confirmar que as requisições para '/messages' não estão em loop"
echo "3. Confirmar que 'check-subscription' ocorre no máximo a cada 5 minutos"
echo "4. Verificar que não há múltiplos canais de tempo real para o mesmo agente"
echo
echo "Execute o teste completo abrindo o aplicativo no navegador com as ferramentas de"
echo "desenvolvedor abertas na aba Network e observe o comportamento por pelo menos 5 minutos."
echo
echo -e "${GREEN}Verificação concluída!${NC}"
