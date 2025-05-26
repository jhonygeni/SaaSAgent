import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

// Funções mock para buscar dados no banco (substitua por queries reais)
async function buscarInstanciaPorNomeOuId(instance: string) {
  return {
    id: 'instancia-123',
    nome: instance,
    telefone: '5511999999999',
  };
}
async function buscarUsuarioPorInstancia(instanciaId: string) {
  return {
    id: 'usuario-abc',
    name: 'Nome do Usuário',
    plan: 'premium',
    planStatus: 'ativo',
    companySite: 'https://empresa.com',
    companyArea: 'Tecnologia',
    companyInfo: 'CNPJ 00.000.000/0001-00, Endereço X',
    phoneNumber: '5511912345678',
  };
}
async function buscarPlanoDoUsuario(usuarioId: string) {
  return { nome: 'premium', status: 'ativo' };
}
async function buscarEmpresaDoUsuario(usuarioId: string) {
  return { site: 'https://empresa.com', areaAtuacao: 'Tecnologia', info: 'CNPJ 00.000.000/0001-00, Endereço X' };
}
async function buscarAgenteDaInstancia(instanciaId: string) {
  return { nome: 'Agente IA', prompt: 'Seja cordial', faqs: [ { pergunta: 'Como funciona?', resposta: 'Assim...' } ] };
}
async function buscarFaqsDoAgente(agenteId: string) {
  return [ { pergunta: 'Como funciona?', resposta: 'Assim...' } ];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { instance, data } = req.body;
    // 1. Buscar dados no banco usando instanceId ou instanceName
    const instancia = await buscarInstanciaPorNomeOuId(instance);
    const usuario = await buscarUsuarioPorInstancia(instancia.id);
    const plano = await buscarPlanoDoUsuario(usuario.id);
    const empresa = await buscarEmpresaDoUsuario(usuario.id);
    const agente = await buscarAgenteDaInstancia(instancia.id);
    const faqs = await buscarFaqsDoAgente(agente.id);

    // 2. Montar o payload completo
    const payload = {
      usuario: usuario.id,
      plano: plano.nome,
      status_plano: plano.status,
      nome_instancia: instancia.nome,
      telefone_instancia: instancia.telefone,
      nome_agente: agente.nome,
      site_empresa: empresa.site,
      area_atuacao: empresa.areaAtuacao,
      info_empresa: empresa.info,
      prompt_agente: agente.prompt,
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