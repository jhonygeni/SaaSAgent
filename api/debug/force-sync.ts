// Força sincronização entre Evolution API e Supabase
import { createClient } from '@supabase/supabase-js';
import https from 'https';

export default async function handler(req: any, res: any) {
  console.log('[FORCE SYNC] Handler started');
  
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
    const evolutionApiKey = process.env.EVOLUTION_API_KEY;
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';

    if (!supabaseUrl || !supabaseKey || !evolutionApiKey) {
      return res.status(500).json({ 
        error: 'Missing credentials'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const userId = 'e8e521f6-7011-418c-a0b4-7ca696e56030';

    console.log('[FORCE SYNC] Getting instances from Evolution API...');

    // 1. Buscar instâncias na Evolution API
    const evolutionInstances = await new Promise((resolve, reject) => {
      const url = new URL(`${evolutionApiUrl}/instance/fetchInstances`);
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        }
      };

      const httpsReq = https.request(options, (httpRes) => {
        let data = '';
        httpRes.on('data', (chunk) => data += chunk);
        httpRes.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve({ error: 'Parse failed', raw: data });
          }
        });
      });

      httpsReq.on('error', reject);
      httpsReq.setTimeout(10000);
      httpsReq.end();
    }) as any;

    if (evolutionInstances.error) {
      return res.status(500).json({
        error: 'Failed to get Evolution API instances',
        details: evolutionInstances
      });
    }

    console.log('[FORCE SYNC] Found Evolution instances:', evolutionInstances?.length || 0);

    // 2. Buscar instâncias existentes no Supabase
    const { data: existingInstances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('instance_name, status')
      .eq('user_id', userId);

    if (fetchError) {
      return res.status(500).json({
        error: 'Failed to fetch existing instances from Supabase',
        details: fetchError
      });
    }

    const existingNames = existingInstances?.map(i => i.instance_name) || [];
    console.log('[FORCE SYNC] Existing Supabase instances:', existingNames);

    // 3. Sincronizar cada instância da Evolution API
    const syncResults = [];
    
    if (Array.isArray(evolutionInstances)) {
      for (const instance of evolutionInstances) {
        const instanceName = instance.instance?.instanceName || instance.instanceName;
        const instanceStatus = instance.instance?.status || instance.status || 'unknown';
        
        if (!instanceName) continue;

        try {
          if (existingNames.includes(instanceName)) {
            // Atualizar instância existente
            const { data: updateData, error: updateError } = await supabase
              .from('whatsapp_instances')
              .update({
                status: instanceStatus,
                last_seen: new Date().toISOString(),
                settings: JSON.stringify(instance)
              })
              .eq('user_id', userId)
              .eq('instance_name', instanceName)
              .select();

            syncResults.push({
              instanceName,
              action: 'updated',
              success: !updateError,
              error: updateError?.message,
              data: updateData
            });
          } else {
            // Criar nova instância
            const { data: insertData, error: insertError } = await supabase
              .from('whatsapp_instances')
              .insert({
                user_id: userId,
                instance_name: instanceName,
                status: instanceStatus,
                settings: JSON.stringify(instance),
                created_at: new Date().toISOString(),
                last_seen: new Date().toISOString()
              })
              .select();

            syncResults.push({
              instanceName,
              action: 'created',
              success: !insertError,
              error: insertError?.message,
              data: insertData
            });
          }
        } catch (syncError) {
          syncResults.push({
            instanceName,
            action: 'failed',
            success: false,
            error: syncError instanceof Error ? syncError.message : String(syncError)
          });
        }
      }
    }

    // 4. Verificar resultado final
    const { data: finalInstances, error: finalError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('user_id', userId);

    return res.status(200).json({
      timestamp: new Date().toISOString(),
      userId,
      sync: {
        evolutionInstancesFound: Array.isArray(evolutionInstances) ? evolutionInstances.length : 0,
        existingInSupabase: existingNames.length,
        syncResults,
        finalCount: finalInstances?.length || 0,
        success: syncResults.filter(r => r.success).length,
        failed: syncResults.filter(r => !r.success).length
      },
      finalInstances: finalInstances?.map(i => ({
        id: i.id,
        instance_name: i.instance_name,
        status: i.status,
        created_at: i.created_at,
        last_seen: i.last_seen
      }))
    });

  } catch (error) {
    console.error('[FORCE SYNC] Caught error:', error);
    return res.status(500).json({
      error: 'Force sync failed',
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}
