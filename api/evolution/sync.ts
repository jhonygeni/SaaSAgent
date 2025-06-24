import { createClient } from '@supabase/supabase-js';

/**
 * Endpoint de sincronização entre Evolution API e Supabase
 * Funcionalidades:
 * 1. Sincronizar instâncias criadas na Evolution para a tabela agents do Supabase
 * 2. Atualizar status de conexão das instâncias
 * 3. Buscar instâncias ativas e sincronizar dados
 */
export default async function handler(req: any, res: any) {
  // Permitir apenas métodos GET e POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Validar credenciais
  const apiKey = process.env.EVOLUTION_API_KEY;
  const apiUrl = process.env.EVOLUTION_API_URL || 'https://cloudsaas.geni.chat';
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!apiKey || !supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ 
      error: 'Credenciais não configuradas',
      missing: {
        evolutionApiKey: !apiKey,
        supabaseUrl: !supabaseUrl,
        supabaseServiceKey: !supabaseServiceKey
      }
    });
  }

  // Configurar cliente Supabase com service key para operações administrativas
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const baseUrl = apiUrl.replace(/\/$/, '');

    if (req.method === 'GET') {
      // Sincronização completa: buscar todas as instâncias da Evolution e sincronizar com Supabase
      return await fullSync(baseUrl, apiKey, supabase, res);
    } else if (req.method === 'POST') {
      // Sincronização específica: processar dados específicos enviados no body
      return await partialSync(baseUrl, apiKey, supabase, req.body, res);
    }

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return res.status(500).json({ 
      error: 'Erro interno na sincronização', 
      details: String(error) 
    });
  }
}

/**
 * Sincronização completa: busca todas as instâncias da Evolution API e atualiza no Supabase
 */
async function fullSync(baseUrl: string, apiKey: string, supabase: any, res: any) {
  try {
    console.log('Iniciando sincronização completa...');

    // 1. Buscar todas as instâncias da Evolution API
    const evolutionResponse = await fetch(`${baseUrl}/instance/fetchInstances`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': apiKey,
      }
    });

    if (!evolutionResponse.ok) {
      throw new Error(`Evolution API error: ${evolutionResponse.status}`);
    }

    const evolutionInstances = await evolutionResponse.json() as any[];
    console.log(`Encontradas ${evolutionInstances.length} instâncias na Evolution API`);

    // 2. Buscar todos os agentes no Supabase
    const { data: supabaseAgents, error: fetchError } = await supabase
      .from('agents')
      .select('*');

    if (fetchError) {
      throw new Error(`Erro ao buscar agentes no Supabase: ${fetchError.message}`);
    }

    console.log(`Encontrados ${supabaseAgents?.length || 0} agentes no Supabase`);

    const syncResults = {
      created: 0,
      updated: 0,
      errors: 0,
      processed: evolutionInstances.length,
      details: [] as any[]
    };

    // 3. Processar cada instância da Evolution
    for (const instance of evolutionInstances) {
      try {
        const result = await syncInstance(instance, supabaseAgents, supabase);
        syncResults.details.push(result);
        
        if (result.action === 'created') syncResults.created++;
        else if (result.action === 'updated') syncResults.updated++;
        
      } catch (error) {
        syncResults.errors++;
        syncResults.details.push({
          instanceName: instance.instance?.instanceName || 'unknown',
          action: 'error',
          error: String(error)
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Sincronização completa finalizada',
      results: syncResults
    });

  } catch (error) {
    console.error('Erro na sincronização completa:', error);
    return res.status(500).json({
      error: 'Erro na sincronização completa',
      details: String(error)
    });
  }
}

/**
 * Sincronização específica: processa dados específicos enviados no body
 */
async function partialSync(baseUrl: string, apiKey: string, supabase: any, body: any, res: any) {
  try {
    console.log('Iniciando sincronização específica...', body);

    const { instanceName, userId, action } = body;

    if (!instanceName) {
      return res.status(400).json({ error: 'instanceName é obrigatório' });
    }

    if (action === 'create') {
      // Criar nova entrada no Supabase para instância criada na Evolution
      return await createAgentFromInstance(instanceName, userId, baseUrl, apiKey, supabase, res);
    } else if (action === 'update') {
      // Atualizar dados de instância existente
      return await updateAgentFromInstance(instanceName, baseUrl, apiKey, supabase, res);
    } else if (action === 'delete') {
      // Remover/desativar agente quando instância é deletada na Evolution
      return await deactivateAgentFromInstance(instanceName, supabase, res);
    } else {
      return res.status(400).json({ error: 'Ação não suportada. Use: create, update, delete' });
    }

  } catch (error) {
    console.error('Erro na sincronização específica:', error);
    return res.status(500).json({
      error: 'Erro na sincronização específica',
      details: String(error)
    });
  }
}

/**
 * Sincroniza uma instância específica da Evolution com o Supabase
 */
async function syncInstance(evolutionInstance: any, supabaseAgents: any[], supabase: any) {
  const instanceName = evolutionInstance.instance?.instanceName;
  
  if (!instanceName) {
    throw new Error('Nome da instância não encontrado');
  }

  // Procurar agente correspondente no Supabase
  const existingAgent = supabaseAgents.find(agent => 
    agent.instance_name === instanceName || 
    agent.instance_id === evolutionInstance.instance?.id
  );

  if (existingAgent) {
    // Atualizar agente existente
    const updatedSettings = {
      ...JSON.parse(existingAgent.settings || '{}'),
      evolution_instance_id: evolutionInstance.instance?.id,
      connection_status: evolutionInstance.instance?.connectionStatus,
      phone_number: evolutionInstance.instance?.owner || null,
      connected: evolutionInstance.instance?.connectionStatus === 'open',
      last_sync: new Date().toISOString()
    };

    const { error } = await supabase
      .from('agents')
      .update({ 
        settings: updatedSettings,
        status: evolutionInstance.instance?.connectionStatus === 'open' ? 'ativo' : 'pendente',
        instance_id: evolutionInstance.instance?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingAgent.id);

    if (error) {
      throw new Error(`Erro ao atualizar agente: ${error.message}`);
    }

    return {
      instanceName,
      action: 'updated',
      agentId: existingAgent.id,
      status: evolutionInstance.instance?.connectionStatus
    };

  } else {
    // Verificar se devemos criar um novo agente (apenas se tiver informações suficientes)
    if (!evolutionInstance.instance?.owner) {
      return {
        instanceName,
        action: 'skipped',
        reason: 'Instância sem owner/usuário associado'
      };
    }

    // Tentar encontrar usuário pelo número de telefone (se disponível)
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone_number', evolutionInstance.instance.owner)
      .limit(1);

    const userId = users?.[0]?.id;

    if (!userId) {
      return {
        instanceName,
        action: 'skipped',
        reason: 'Usuário não encontrado para esta instância'
      };
    }

    // Criar novo agente
    const newAgent = {
      user_id: userId,
      instance_name: instanceName,
      instance_id: evolutionInstance.instance.id,
      status: evolutionInstance.instance.connectionStatus === 'open' ? 'ativo' : 'pendente',
      settings: JSON.stringify({
        name: `Agent ${instanceName}`,
        evolution_instance_id: evolutionInstance.instance.id,
        connection_status: evolutionInstance.instance.connectionStatus,
        phone_number: evolutionInstance.instance.owner,
        connected: evolutionInstance.instance.connectionStatus === 'open',
        created_from_sync: true,
        last_sync: new Date().toISOString()
      })
    };

    const { data, error } = await supabase
      .from('agents')
      .insert(newAgent)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar agente: ${error.message}`);
    }

    return {
      instanceName,
      action: 'created',
      agentId: data.id,
      status: evolutionInstance.instance.connectionStatus
    };
  }
}

/**
 * Cria um agente no Supabase a partir de uma instância criada na Evolution
 */
async function createAgentFromInstance(instanceName: string, userId: string, baseUrl: string, apiKey: string, supabase: any, res: any) {
  // Buscar informações da instância na Evolution API
  const instanceResponse = await fetch(`${baseUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': apiKey,
    }
  });

  if (!instanceResponse.ok) {
    return res.status(500).json({ error: 'Erro ao buscar instância na Evolution API' });
  }

  const instances = await instanceResponse.json() as any[];
  const instance = instances.find((inst: any) => inst.instance?.instanceName === instanceName);

  if (!instance) {
    return res.status(404).json({ error: 'Instância não encontrada na Evolution API' });
  }

  // Criar agente no Supabase
  const newAgent = {
    user_id: userId,
    instance_name: instanceName,
    instance_id: instance.instance?.id,
    status: 'pendente',
    settings: JSON.stringify({
      name: `Agent ${instanceName}`,
      evolution_instance_id: instance.instance?.id,
      connection_status: instance.instance?.connectionStatus || 'close',
      phone_number: instance.instance?.owner || null,
      connected: false,
      created_from_evolution: true,
      created_at: new Date().toISOString()
    })
  };

  const { data, error } = await supabase
    .from('agents')
    .insert(newAgent)
    .select()
    .single();

  if (error) {
    return res.status(500).json({ 
      error: 'Erro ao criar agente no Supabase', 
      details: error.message 
    });
  }

  return res.status(201).json({
    success: true,
    message: 'Agente criado com sucesso a partir da instância Evolution',
    agent: data
  });
}

/**
 * Atualiza um agente no Supabase com dados da Evolution
 */
async function updateAgentFromInstance(instanceName: string, baseUrl: string, apiKey: string, supabase: any, res: any) {
  // Buscar informações da instância na Evolution API
  const instanceResponse = await fetch(`${baseUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'apikey': apiKey,
    }
  });

  if (!instanceResponse.ok) {
    return res.status(500).json({ error: 'Erro ao buscar instância na Evolution API' });
  }

  const instances = await instanceResponse.json() as any[];
  const instance = instances.find((inst: any) => inst.instance?.instanceName === instanceName);

  if (!instance) {
    return res.status(404).json({ error: 'Instância não encontrada na Evolution API' });
  }

  // Buscar agente correspondente no Supabase
  const { data: existingAgent, error: fetchError } = await supabase
    .from('agents')
    .select('*')
    .eq('instance_name', instanceName)
    .single();

  if (fetchError) {
    return res.status(404).json({ error: 'Agente não encontrado no Supabase' });
  }

  // Atualizar settings do agente
  const currentSettings = JSON.parse(existingAgent.settings || '{}');
  const updatedSettings = {
    ...currentSettings,
    evolution_instance_id: instance.instance?.id,
    connection_status: instance.instance?.connectionStatus,
    phone_number: instance.instance?.owner || currentSettings.phone_number,
    connected: instance.instance?.connectionStatus === 'open',
    last_sync: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('agents')
    .update({ 
      settings: updatedSettings,
      status: instance.instance?.connectionStatus === 'open' ? 'ativo' : 'pendente',
      instance_id: instance.instance?.id,
      updated_at: new Date().toISOString()
    })
    .eq('id', existingAgent.id);

  if (updateError) {
    return res.status(500).json({ 
      error: 'Erro ao atualizar agente no Supabase', 
      details: updateError.message 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Agente atualizado com sucesso',
    agentId: existingAgent.id
  });
}

/**
 * Desativa um agente no Supabase quando a instância é deletada na Evolution
 */
async function deactivateAgentFromInstance(instanceName: string, supabase: any, res: any) {
  // Buscar agente correspondente no Supabase
  const { data: existingAgent, error: fetchError } = await supabase
    .from('agents')
    .select('*')
    .eq('instance_name', instanceName)
    .single();

  if (fetchError) {
    return res.status(404).json({ error: 'Agente não encontrado no Supabase' });
  }

  // Atualizar status para inativo
  const currentSettings = JSON.parse(existingAgent.settings || '{}');
  const updatedSettings = {
    ...currentSettings,
    connected: false,
    connection_status: 'deleted',
    deleted_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('agents')
    .update({ 
      settings: updatedSettings,
      status: 'inativo',
      updated_at: new Date().toISOString()
    })
    .eq('id', existingAgent.id);

  if (updateError) {
    return res.status(500).json({ 
      error: 'Erro ao desativar agente no Supabase', 
      details: updateError.message 
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Agente desativado com sucesso',
    agentId: existingAgent.id
  });
}
