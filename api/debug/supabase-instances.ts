// Diagnóstico da tabela whatsapp_instances no Supabase
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  console.log('[SUPABASE DEBUG] Handler started');
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    console.log('[SUPABASE DEBUG] Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      url: supabaseUrl?.substring(0, 20) + '...'
    });

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: 'Supabase credentials not configured',
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const userId = 'e8e521f6-7011-418c-a0b4-7ca696e56030';

    console.log('[SUPABASE DEBUG] Testing queries for user:', userId);

    // 1. Teste básico de conexão
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    // 2. Verificar estrutura da tabela whatsapp_instances
    let tableInfo = null;
    let tableError = null;
    try {
      const result = await supabase.rpc('get_table_info', { table_name: 'whatsapp_instances' });
      tableInfo = result.data;
      tableError = result.error;
    } catch (error) {
      tableError = 'RPC not available';
    }

    // 3. Buscar todas as instâncias do usuário (sem filtros)
    const { data: allInstances, error: allError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId);

    // 4. Buscar instâncias conectadas (query que estava falhando com 406 - agora corrigida)
    // Fix para 406 error: buscar todas as instâncias do usuário e filtrar por status no cliente
    const { data: allInstancesForConnected, error: connectedError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId);
    
    // Filtrar instâncias conectadas no lado do cliente para evitar 406 error
    const connectedInstances = allInstancesForConnected?.filter(instance => instance.status === 'connected') || [];

    // 5. Buscar últimas instâncias criadas
    const { data: recentInstances, error: recentError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // 6. Contar total de registros na tabela
    const { count, error: countError } = await supabase
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      userId,
      environment: {
        supabaseUrl: supabaseUrl?.substring(0, 30) + '...',
        hasKey: !!supabaseKey
      },
      tests: {
        connection: {
          success: !connectionError,
          error: connectionError?.message,
          data: connectionTest?.length || 0
        },
        tableInfo: {
          success: !tableError,
          error: tableError,
          data: tableInfo
        },
        allInstances: {
          count: allInstances?.length || 0,
          success: !allError,
          error: allError?.message,
          data: allInstances?.slice(0, 3) // Primeiros 3 registros
        },
        connectedInstances: {
          count: connectedInstances?.length || 0,
          success: !connectedError,
          error: connectedError?.message,
          errorCode: connectedError?.code,
          data: connectedInstances
        },
        recentInstances: {
          count: recentInstances?.length || 0,
          success: !recentError,
          error: recentError?.message,
          data: recentInstances?.map(i => ({
            id: i.id,
            instance_name: i.instance_name,
            status: i.status,
            user_id: i.user_id,
            created_at: i.created_at
          }))
        },
        totalCount: {
          count,
          success: !countError,
          error: countError?.message
        }
      }
    });

  } catch (error) {
    console.error('[SUPABASE DEBUG] Caught error:', error);
    return res.status(500).json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : String(error),
      type: (error as any)?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString()
    });
  }
}
