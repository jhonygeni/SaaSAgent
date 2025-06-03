#!/usr/bin/env node
/**
 * Diagnóstico específico do problema de sincronização do UserContext
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

console.log('🔍 Diagnóstico do Problema de Contexto React');
console.log('='.repeat(50));

async function diagnosticarContexto() {
    try {
        console.log('\n1. 📡 Verificando sessão atual no Supabase...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.log('❌ Erro ao obter sessão:', sessionError);
            return;
        }
        
        if (!session) {
            console.log('❌ Nenhuma sessão ativa encontrada');
            console.log('💡 O usuário precisa fazer login primeiro');
            return;
        }
        
        console.log('✅ Sessão ativa encontrada!');
        console.log(`   👤 User ID: ${session.user.id}`);
        console.log(`   📧 Email: ${session.user.email}`);
        console.log(`   🔑 Token válido: ${!!session.access_token}`);
        console.log(`   ⏰ Expira em: ${new Date(session.expires_at * 1000).toLocaleString()}`);
        
        console.log('\n2. 🔄 Testando Auth State Change simulation...');
        
        // Simular o que o UserContext deveria fazer
        const user = session.user;
        
        console.log('\n3. 🧪 Dados que o UserContext deveria processar:');
        const mockUserData = {
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email || '',
            plan: 'free',
            messageCount: 0,
            messageLimit: 50,
            agents: [],
        };
        
        console.log('   UserContext deveria criar:', JSON.stringify(mockUserData, null, 2));
        
        console.log('\n4. 🔍 Verificando edge function check-subscription...');
        
        try {
            const { data: subscriptionData, error: subError } = await supabase.functions.invoke('check-subscription');
            
            if (subError) {
                console.log('⚠️  Erro na edge function:', subError);
                console.log('💡 UserContext pode estar falhando aqui');
            } else {
                console.log('✅ Edge function respondeu:');
                console.log('   ', JSON.stringify(subscriptionData, null, 2));
            }
        } catch (invokeError) {
            console.log('❌ Falha ao invocar edge function:', invokeError.message);
            console.log('💡 Este pode ser o motivo do UserContext não sincronizar');
        }
        
        console.log('\n5. 🔄 Verificando listener de Auth State Change...');
        
        let listenerTriggered = false;
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log(`🔔 Auth event detectado: ${event}`);
            console.log(`   Session: ${session ? 'presente' : 'ausente'}`);
            listenerTriggered = true;
        });
        
        // Aguardar um momento para ver se o listener é acionado
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!listenerTriggered) {
            console.log('⚠️  Listener de Auth State Change não foi acionado');
            console.log('💡 Possível problema: o UserContext pode não estar detectando mudanças');
        }
        
        subscription.unsubscribe();
        
        console.log('\n6. 🔧 Possíveis causas do problema:');
        console.log('   a) UserContext não está sendo reinicializado corretamente');
        console.log('   b) Hook useEffect com dependências incorretas');
        console.log('   c) Race condition entre auth e context');
        console.log('   d) Estado sendo resetado por outro componente');
        console.log('   e) Problema com ref initializationAttempted');
        
        console.log('\n7. 🚀 Recomendações de correção:');
        console.log('   1. Forçar reinicialização do UserContext');
        console.log('   2. Remover ref initializationAttempted que pode estar bloqueando');
        console.log('   3. Simplificar o useEffect de inicialização');
        console.log('   4. Adicionar logs mais detalhados');
        
    } catch (error) {
        console.error('❌ Erro no diagnóstico:', error);
    }
}

diagnosticarContexto().then(() => {
    console.log('\n✅ Diagnóstico concluído!');
    process.exit(0);
});
