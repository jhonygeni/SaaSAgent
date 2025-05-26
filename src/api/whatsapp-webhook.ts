import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { supabase } from '@/integrations/supabase/client';

// Busca instância pelo nome (ou id)
async function buscarInstanciaPorNomeOuId(instanceName: string) {
  const { data, error } = await supabase
    .from('whatsapp_instances')
    .select('*')
    .or(`name.eq.${instanceName},id.eq.${instanceName}`)
    .single();
  if (error || !data) throw new Error('Instância não encontrada');
  return data;
}

// Busca usuário dono da instância
async function buscarUsuarioPorInstancia(instancia: any) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', instancia.user_id)
    .single();
  if (error || !data) throw new Error('Usuário não encontrado');
  return data;
}

// Busca plano do usuário
async function buscarPlanoDoUsuario(usuario: any) {
  // Se o plano está em profiles
  if (usuario.plan && usuario.plan_status) {
    return { nome: usuario.plan, status: usuario.plan_status };
  }
  // Se usar tabela subscriptions:
  const { data, error } = await supabase
    .from('subscriptions')
    .select('status,plan_id,plan:plan_id(name)')
    .eq('user_id', usuario.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !data) return { nome: 'desconhecido', status: 'desconhecido' };
  return { nome: data.plan?.name || 'desconhecido', status: data.status || 'desconhecido' };
}

// Busca agente da instância
async function buscarAgenteDaInstancia(instancia: any) {
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .eq('instance_id', instancia.id)
    .single();
  if (error || !data) throw new Error('Agente não encontrado');
  return data;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { instance, data } = req.body;
    // 1. Buscar dados no banco usando instanceId ou instanceName
    const instancia = await buscarInstanciaPorNomeOuId(instance);
    if (instancia.status !== 'connected') {
      return res.status(200).json({ success: false, message: 'Instância não conectada, webhook não disparado.' });
    }
    const usuario = await buscarUsuarioPorInstancia(instancia);
    const plano = await buscarPlanoDoUsuario(usuario);
    const agente = await buscarAgenteDaInstancia(instancia);
    // Dados da empresa do usuário
    const site_empresa = usuario.company_name || '';
    const area_atuacao = usuario.role || '';
    const info_empresa = usuario.full_name || '';
    // FAQs e prompt do agente (armazenados em settings JSON)
    let faqs: any[] = [];
    let prompt_agente = '';
    if (agente.settings) {
      try {
        const settings = typeof agente.settings === 'string' ? JSON.parse(agente.settings) : agente.settings;
        faqs = settings.faqs || [];
        prompt_agente = settings.prompt || '';
      } catch (e) {
        faqs = [];
        prompt_agente = '';
      }
    }
    // 2. Montar o payload completo
    const payload = {
      usuario: usuario.id,
      plano: plano.nome,
      status_plano: plano.status,
      nome_instancia: instancia.name,
      telefone_instancia: instancia.phone_number || '',
      nome_agente: agente.instance_name || '',
      site_empresa,
      area_atuacao,
      info_empresa,
      prompt_agente,
      faqs,
      nome_remetente: data.pushName,
      telefone_remetente: data.key.remoteJid.replace('@s.whatsapp.net', ''),
      mensagem: data.message.conversation
    };
    // 3. Disparar para o n8n
    await axios.post('https://webhooksaas.geni.chat/webhook/principal', payload);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Erro no webhook WhatsApp:', error);
    return res.status(500).json({ error: 'Erro interno ao processar webhook' });
  }
} 