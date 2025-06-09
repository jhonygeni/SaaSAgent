#!/bin/bash
cd /Users/jhonymonhol/Desktop/SaaSAgent
echo "=== Iniciando servidor de desenvolvimento do SaaSAgent ==="
echo "Diretório atual: $(pwd)"
echo "Verificando Node.js e npm..."
node --version
npm --version
echo "Iniciando servidor..."
npm run dev
