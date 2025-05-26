const express = require('express');
const cors = require('cors');

console.log('Starting webhook server...');

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;

console.log(`Server will run on port ${PORT}`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Webhook Principal para Evolution API
app.post('/webhook/principal', async (req, res) => {
  try {
    console.log('[WEBHOOK-PRINCIPAL] Recebendo webhook da Evolution API');
    
    const evolutionData = req.body;
    
    console.log('[WEBHOOK-PRINCIPAL] Dados recebidos:', {
      instance: evolutionData.instance,
      event: evolutionData.event,
      hasData: !!evolutionData.data,
      timestamp: new Date().toISOString()
    });

    // Verificar se é uma mensagem
    if (!evolutionData.data || !evolutionData.data.key) {
      console.log('[WEBHOOK-PRINCIPAL] Evento ignorado - não é uma mensagem');
      return res.status(200).json({ success: true, message: 'Evento ignorado' });
    }

    // Filtrar mensagens próprias e de status
    const remoteJid = evolutionData.data.key.remoteJid;
    if (remoteJid === 'status@broadcast' || remoteJid.includes('g.us')) {
      console.log('[WEBHOOK-PRINCIPAL] Mensagem ignorada - status ou grupo');
      return res.status(200).json({ success: true, message: 'Mensagem ignorada' });
    }

    // Verificar se há conteúdo de mensagem
    if (!evolutionData.data.message) {
      console.log('[WEBHOOK-PRINCIPAL] Evento ignorado - sem mensagem');
      return res.status(200).json({ success: true, message: 'Evento ignorado - sem conteúdo' });
    }

    // Filtrar eventos que não são mensagens de texto
    if (evolutionData.event !== 'messages.upsert' && evolutionData.event !== 'MESSAGES_UPSERT') {
      console.log('[WEBHOOK-PRINCIPAL] Evento ignorado - não é mensagem:', evolutionData.event);
      return res.status(200).json({ success: true, message: 'Evento ignorado - tipo incorreto' });
    }

    // Extrair dados da mensagem
    const mensagem = evolutionData.data.message?.conversation || 
                    evolutionData.data.message?.extendedTextMessage?.text || 
                    '[Mensagem não suportada]';
    
    const telefoneRemetente = remoteJid.replace('@s.whatsapp.net', '');
    const nomeRemetente = evolutionData.data.pushName || 'Sem nome';

    console.log('[WEBHOOK-PRINCIPAL] Mensagem processada:', {
      de: nomeRemetente,
      telefone: telefoneRemetente,
      mensagem: mensagem.substring(0, 100),
      instancia: evolutionData.instance
    });

    // Simular envio para N8N
    console.log('[WEBHOOK-PRINCIPAL] Enviando para N8N (simulado)');

    res.status(200).json({ 
      success: true, 
      message: 'Mensagem processada com sucesso',
      data: {
        from: telefoneRemetente,
        name: nomeRemetente,
        message: mensagem.substring(0, 100),
        instance: evolutionData.instance
      }
    });

  } catch (error) {
    console.error('[WEBHOOK-PRINCIPAL] Erro:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check
app.get('/webhook/principal', (req, res) => {
  res.json({
    status: 'ok',
    webhook: 'webhook-principal',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Iniciar servidor
console.log('About to start server...');
app.listen(PORT, () => {
  console.log(`🚀 Webhook Principal rodando em http://localhost:${PORT}`);
  console.log(`📍 Endpoint: http://localhost:${PORT}/webhook/principal`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
