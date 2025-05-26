const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.text({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * Webhook Principal para Evolution API
 * Este endpoint simula o processamento que seria feito pelo sistema real
 */
app.post('/webhook/principal', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('[WEBHOOK-PRINCIPAL] Recebendo webhook da Evolution API');
    
    const evolutionData = req.body;
    
    console.log('[WEBHOOK-PRINCIPAL] Dados recebidos:', {
      instance: evolutionData.instance,
      event: evolutionData.event,
      hasData: !!evolutionData.data,
      timestamp: new Date().toISOString()
    });

    // Verificar se é uma mensagem (não um evento de status)
    if (!evolutionData.data || !evolutionData.data.key) {
      console.log('[WEBHOOK-PRINCIPAL] Evento ignorado - não é uma mensagem');
      return res.status(200).json({ success: true, message: 'Evento ignorado - não é mensagem' });
    }

    // Filtrar mensagens próprias e de status
    const remoteJid = evolutionData.data.key.remoteJid;
    if (remoteJid === 'status@broadcast' || remoteJid.includes('g.us')) {
      console.log('[WEBHOOK-PRINCIPAL] Mensagem ignorada - status ou grupo');
      return res.status(200).json({ success: true, message: 'Mensagem ignorada - status/grupo' });
    }

    // Verificar se há conteúdo de mensagem
    if (!evolutionData.data.message) {
      console.log('[WEBHOOK-PRINCIPAL] Evento ignorado - sem mensagem');
      return res.status(200).json({ success: true, message: 'Evento ignorado - sem conteúdo' });
    }

    // Extrair dados da mensagem
    const mensagem = evolutionData.data.message.conversation || 
                    evolutionData.data.message.extendedTextMessage?.text || 
                    '[Mensagem não suportada]';
    
    const telefoneRemetente = remoteJid.replace('@s.whatsapp.net', '');
    const nomeRemetente = evolutionData.data.pushName || 'Sem nome';

    console.log('[WEBHOOK-PRINCIPAL] Mensagem processada:', {
      de: nomeRemetente,
      telefone: telefoneRemetente,
      mensagem: mensagem.substring(0, 100),
      instancia: evolutionData.instance
    });

    // Simular processamento (aqui seria feita a consulta ao banco e envio para N8N)
    await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay de processamento

    // Simular envio para N8N
    const payloadN8N = {
      usuario: 'user_example',
      plano: 'premium',
      status_plano: 'ativo',
      nome_instancia: evolutionData.instance,
      telefone_instancia: '5511999999999',
      nome_agente: 'Bot Exemplo',
      site_empresa: 'Empresa Teste',
      area_atuacao: 'Vendas',
      info_empresa: 'Informações da empresa',
      prompt_agente: 'Você é um assistente virtual...',
      faqs: [
        { pergunta: 'Horário de funcionamento?', resposta: '8h às 18h' }
      ],
      nome_remetente: nomeRemetente,
      telefone_remetente: telefoneRemetente,
      mensagem: mensagem,
      timestamp: new Date().toISOString(),
      message_type: 'text'
    };

    console.log('[WEBHOOK-PRINCIPAL] Enviando para N8N (simulado):', {
      telefone: telefoneRemetente,
      instancia: evolutionData.instance,
      payloadSize: JSON.stringify(payloadN8N).length
    });

    const duration = Date.now() - startTime;
    
    console.log(`[WEBHOOK-PRINCIPAL] Processado com sucesso em ${duration}ms`);
    res.status(200).json({ 
      success: true, 
      message: 'Mensagem processada e enviada para N8N',
      duration: `${duration}ms`,
      processedData: {
        from: telefoneRemetente,
        name: nomeRemetente,
        message: mensagem.substring(0, 100),
        instance: evolutionData.instance
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[WEBHOOK-PRINCIPAL] Erro não tratado em ${duration}ms:`, error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro interno',
      duration: `${duration}ms`
    });
  }
});

// Health check
app.get('/webhook/principal', (req, res) => {
  res.json({
    status: 'ok',
    webhook: 'webhook-principal',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Status geral
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Fallback para outras rotas
app.all('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    availableEndpoints: [
      'GET /webhook/principal',
      'POST /webhook/principal',
      'GET /health'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('[WEBHOOK-SERVER] Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Webhook Principal rodando em http://localhost:${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/webhook/principal`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🕐 Iniciado em: ${new Date().toISOString()}`);
});

module.exports = app;
