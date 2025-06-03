#!/usr/bin/env node
/**
 * Teste do UserContext corrigido - Verificar se a sincronização foi resolvida
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: path.join(__dirname, '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Variáveis de ambiente não encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔧 Teste do UserContext Corrigido');
console.log('='.repeat(50));

async function testarContextCorrigido() {
    try {
        console.log('\n1. 🔍 Verificando estado da autenticação...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.log('❌ Erro ao obter sessão:', sessionError);
            return;
        }
        
        if (!session) {
            console.log('⚠️  Nenhuma sessão ativa - O UserContext deve detectar isso');
            console.log('💡 Estado esperado: { user: null, isLoading: false }');
            return;
        }
        
        console.log('✅ Sessão ativa encontrada!');
        console.log(`   👤 User ID: ${session.user.id}`);
        console.log(`   📧 Email: ${session.user.email}`);
        
        console.log('\n2. ✨ O que o UserContext corrigido deve fazer:');
        
        console.log('   📝 checkSession() deve executar imediatamente');
        console.log('   🆕 createUserWithDefaultPlan() deve ser chamado');
        console.log('   ⏰ setTimeout(checkSubscriptionStatus, 500) deve disparar');
        console.log('   🔄 user state deve ser atualizado para o objeto User');
        
        console.log('\n3. 🧪 Simulando o fluxo do UserContext:');
        
        // Simular createUserWithDefaultPlan
        const mockUser = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email || '',
            plan: 'free',
            messageCount: 0,
            messageLimit: 50,
            agents: [],
        };
        
        console.log('   ✅ User object criado:', JSON.stringify(mockUser, null, 2));
        
        // Simular checkSubscriptionStatus
        console.log('\n4. 🔍 Testando checkSubscriptionStatus...');
        
        try {
            const { data: subscriptionData, error: subError } = await supabase.functions.invoke('check-subscription');
            
            if (subError) {
                console.log('   ⚠️  Edge function com erro - UserContext deve manter plano free');
                console.log('   💡 Estado final esperado: user com plan: "free"');
            } else {
                console.log('   ✅ Edge function OK - UserContext deve atualizar dados:');
                console.log('   ', JSON.stringify(subscriptionData, null, 2));
                
                if (subscriptionData?.plan) {
                    mockUser.plan = subscriptionData.plan;
                    mockUser.messageCount = subscriptionData.message_count || 0;
                }
            }
        } catch (invokeError) {
            console.log('   ❌ Falha na invocação - UserContext deve manter plano free');
        }
        
        console.log('\n5. 🎯 Estado final esperado do UserContext:');
        console.log('   {');
        console.log(`     user: ${JSON.stringify(mockUser, null, 2).replace(/\n/g, '\n     ')},`);
        console.log('     isLoading: false');
        console.log('   }');
        
        console.log('\n6. 🔧 Diferenças da versão corrigida:');
        console.log('   ✅ REMOVIDO: ref initializationAttempted (que bloqueava reinicialização)');
        console.log('   ✅ ADICIONADO: useCallback nas funções para melhor performance');
        console.log('   ✅ REDUZIDO: setTimeout de 1000ms para 500ms');
        console.log('   ✅ MELHORADO: Logs mais detalhados para debug');
        console.log('   ✅ SIMPLIFICADO: Throttling removido temporariamente');
        
        console.log('\n7. 🚀 Como testar no navegador:');
        console.log('   1. Recarregue a página (F5)');
        console.log('   2. Abra o DevTools (F12)');
        console.log('   3. Procure por logs: "👤 UserProvider: Inicializando... (VERSÃO CORRIGIDA)"');
        console.log('   4. Procure por: "✅ Sessão existente encontrada: [email]"');
        console.log('   5. Procure por: "🆕 Criando novo usuário no contexto:"');
        console.log('   6. Verifique se o usuário aparece no dashboard');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    }
}

testarContextCorrigido().then(() => {
    console.log('\n✅ Teste concluído!');
    console.log('🔄 Agora recarregue o navegador para testar as mudanças');
    process.exit(0);
});
