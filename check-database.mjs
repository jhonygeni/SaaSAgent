// Verificar dados no Supabase diretamente
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = 'https://fdzhhdmxhzsrfbtqmwip.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkemhoZG14aHpzcmZidHFtd2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1ODYxNTAsImV4cCI6MjA0NzE2MjE1MH0.7QON3_zSNGF5oOTU1Pzo1nRCFZ-YxnKCTSXasDz2aOY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('🔍 Verificando dados no banco...');
    
    try {
        // Verificar usuário atual
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            console.error('❌ Erro de auth:', userError);
            return;
        }
        
        if (!user) {
            console.log('⚠️ Usuário não autenticado');
            return;
        }
        
        console.log('✅ Usuário autenticado:', user.email, 'ID:', user.id);
        
        // Verificar agentes
        const { data: agents, error: agentsError, count } = await supabase
            .from('agents')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id);
            
        if (agentsError) {
            console.error('❌ Erro ao buscar agentes:', agentsError);
            return;
        }
        
        console.log(`📊 Total de agentes: ${count}`);
        console.log('📋 Dados dos agentes:', agents);
        
        if (agents && agents.length > 0) {
            agents.forEach((agent, index) => {
                console.log(`Agent ${index + 1}:`, {
                    id: agent.id,
                    name: agent.name,
                    status: agent.status,
                    is_active: agent.is_active,
                    settings: agent.settings,
                    created_at: agent.created_at
                });
            });
        } else {
            console.log('⚠️ Nenhum agente encontrado para este usuário');
            console.log('🎯 DIAGNÓSTICO: Esta é a causa do problema - não há agentes no banco!');
        }
        
    } catch (error) {
        console.error('❌ Exceção:', error);
    }
}

checkDatabase();
