#!/bin/bash

# Script para testar confirmação de email após correções no Dashboard
# Execute este script depois de fazer mudanças no Supabase Dashboard

echo "🧪 === TESTE RÁPIDO - CONFIRMAÇÃO DE EMAIL ==="
echo ""

echo "📋 PREPARAÇÃO:"
echo "1. ✅ Certifique-se de ter aplicado as correções no Dashboard"
echo "2. ✅ Auth Hooks desabilitados (se existirem)"
echo "3. ✅ Rate limits ajustados (Token verifications >= 150/hora)"
echo "4. ✅ Configurações básicas verificadas"
echo ""

echo "🎯 TESTE MANUAL:"
echo "1. Acesse: https://ia.geni.chat/entrar"
echo "2. Clique em 'Criar conta'"
echo "3. Use email de teste: teste_$(date +%s)@exemplo.com"
echo "4. Senha: TestPassword123!"
echo "5. Aguarde receber email"
echo "6. Clique no link de confirmação"
echo ""

echo "✅ RESULTADO ESPERADO:"
echo "• Página mostra: 'E-mail confirmado!'"
echo "• Redirecionamento para dashboard ou login"
echo "• SEM erro 'Token de confirmação inválido'"
echo ""

echo "❌ SE AINDA FALHAR:"
echo "• Problema pode estar em Auth Hooks específicos"
echo "• Verificar logs da função custom-email"
echo "• Considerar auto-confirmação temporária"
echo ""

echo "📞 Para verificar logs da função:"
echo "supabase functions logs custom-email --project-ref hpovwcaskorzzrpphgkc"
echo ""

echo "🔗 Links úteis:"
echo "• Auth Hooks: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/hooks"
echo "• Rate Limits: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/rate-limits"
echo "• Settings: https://supabase.com/dashboard/project/hpovwcaskorzzrpphgkc/auth/settings"
echo ""

read -p "Pressione ENTER para continuar com teste automatizado (ou Ctrl+C para sair)..."

# Se chegou aqui, tentar teste automatizado (requer dependências)
if command -v node &> /dev/null && [ -f "package.json" ]; then
    echo ""
    echo "🤖 Executando teste automatizado..."
    
    # Criar arquivo de teste temporário
    cat > teste_automatico_temp.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testeRapido() {
  const testEmail = `teste_${Date.now()}@exemplo.com`;
  console.log(`\n📧 Testando com: ${testEmail}`);
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
      options: { data: { name: 'Teste Rápido' } }
    });
    
    if (error) {
      console.log(`❌ Erro no signup: ${error.message}`);
      return;
    }
    
    if (data.session) {
      console.log('⚠️  ATENÇÃO: Usuário criado COM sessão - auto-confirmação ativa');
      console.log('   Isso pode significar que o problema foi resolvido OU');
      console.log('   que confirmação foi desabilitada.');
    } else {
      console.log('✅ Usuário criado sem sessão - comportamento esperado');
      console.log('   Agora teste o link do email manualmente.');
    }
    
    console.log(`\n👤 Usuário criado: ${data.user?.id}`);
    console.log('📬 Verifique sua caixa de entrada para o email de confirmação');
    
  } catch (err) {
    console.log(`❌ Erro: ${err.message}`);
  }
}

testeRapido();
EOF
    
    node teste_automatico_temp.js
    rm teste_automatico_temp.js
    
else
    echo "⚠️  Node.js não disponível ou package.json não encontrado"
    echo "Execute o teste manual seguindo as instruções acima"
fi

echo ""
echo "✅ Teste concluído!"
echo "Se ainda houver problemas, verifique os Auth Hooks no Dashboard."
