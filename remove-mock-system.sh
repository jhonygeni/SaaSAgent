#!/bin/bash

# Script para remover sistema mock e preparar para produção
# Execute: chmod +x remove-mock-system.sh && ./remove-mock-system.sh

echo "🧹 Removendo sistema mock para produção..."

# 1. Remover DebugPanel do App.tsx
echo "📝 Removendo DebugPanel do App.tsx..."
sed -i '' '/import.*DebugPanel/d' src/App.tsx
sed -i '' '/<DebugPanel/d' src/App.tsx

# 2. Remover imports mock do UserContext.tsx
echo "📝 Removendo imports mock do UserContext.tsx..."
sed -i '' '/import.*mock-subscription-data/d' src/context/UserContext.tsx

# 3. Remover lógica mock do UserContext.tsx
echo "📝 Removendo lógica mock do UserContext.tsx..."
# Este será um processo manual pois envolve blocos de código complexos

# 4. Remover arquivos mock
echo "🗑️  Removendo arquivos mock..."
rm -f src/lib/mock-subscription-data.ts
rm -f src/components/DebugPanel.tsx
rm -f activate-mock-mode-browser.js
rm -f activate-mock-mode.js

# 5. Verificar se há referências restantes
echo "🔍 Verificando referências restantes ao sistema mock..."
grep -r "mock" src/ --exclude-dir=node_modules || echo "✅ Nenhuma referência mock encontrada"
grep -r "DebugPanel" src/ --exclude-dir=node_modules || echo "✅ Nenhuma referência DebugPanel encontrada"

echo "✅ Sistema mock removido!"
echo "⚠️  ATENÇÃO: Revise manualmente o UserContext.tsx para remover a lógica mock"
echo "📦 Execute 'npm run build' para verificar se não há erros"
