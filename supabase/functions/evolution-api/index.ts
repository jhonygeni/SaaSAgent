import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// 🔧 CORREÇÃO CRÍTICA: Configuração otimizada para Evolution API V2
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')

// Helper function for detailed logging
const logDebug = (message: string, data?: any) => {
  console.log(`[EVOLUTION-API] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    logDebug('🚀 Request received', { 
      method: req.method, 
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    // 🔧 CORREÇÃO: Validação aprimorada de variáveis de ambiente
    if (!EVOLUTION_API_URL) {
      const error = 'Missing EVOLUTION_API_URL. Configure: supabase secrets set EVOLUTION_API_URL=https://your-evolution-api.com';
      logDebug('❌ Missing URL', { error });
      throw new Error(error);
    }
    if (!EVOLUTION_API_KEY) {
      const error = 'Missing EVOLUTION_API_KEY. Configure: supabase secrets set EVOLUTION_API_KEY=your_global_api_key';
      logDebug('❌ Missing API Key', { error });
      throw new Error(error);
    }

    logDebug('✅ Environment variables validated', { 
      apiUrl: EVOLUTION_API_URL,
      apiKeyPresent: !!EVOLUTION_API_KEY 
    });

    // 🔧 CORREÇÃO: Parsing seguro do body
    let requestBody: any = {};
    try {
      const bodyText = await req.text();
      requestBody = bodyText ? JSON.parse(bodyText) : {};
      logDebug('📝 Request body parsed', requestBody);
    } catch (parseError) {
      logDebug('❌ JSON parsing failed', { error: parseError.message });
      throw new Error(`Invalid JSON body: ${parseError.message}`);
    }

    const { action, instanceName, data } = requestBody;

    // Validate required parameters
    if (!action) {
      logDebug('❌ Missing action parameter');
      throw new Error('Missing required parameter: action');
    }

    // 🔧 CORREÇÃO: URLs padronizadas para Evolution API V2
    let url = EVOLUTION_API_URL.replace(/\/$/, ''); // Remove trailing slash
    let method = 'GET';
    let body: string | undefined = undefined;

    logDebug('🔗 Building request', { action, instanceName, hasData: !!data });

    switch (action) {
      case 'create':
        url += '/instance/create';
        method = 'POST';
        body = JSON.stringify(data || {});
        break;
      case 'connect':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for connect');
        url += `/instance/connect/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        break;
      case 'qrcode':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for qrcode');
        url += `/instance/qrcode/${encodeURIComponent(instanceName)}`;
        break;
      case 'info':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for info');
        url += `/instance/info/${encodeURIComponent(instanceName)}`;
        break;
      case 'fetchInstances':
        url += '/instance/fetchInstances';
        break;
      case 'connectionState':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for connectionState');
        url += `/instance/connectionState/${encodeURIComponent(instanceName)}`;
        break;
      case 'delete':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for delete');
        url += `/instance/delete/${encodeURIComponent(instanceName)}`;
        method = 'DELETE';
        break;
      case 'webhook':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for webhook');
        url += `/webhook/set/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(data || {});
        break;
      case 'webhookFind':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for webhookFind');
        url += `/webhook/find/${encodeURIComponent(instanceName)}`;
        break;
      case 'settings':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for settings');
        url += `/settings/set/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(data || {});
        break;
      case 'sendText':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for sendText');
        url += `/message/sendText/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(data || {});
        break;
      case 'sendMedia':
        if (!instanceName) throw new Error('Missing required parameter: instanceName for sendMedia');
        url += `/message/sendMedia/${encodeURIComponent(instanceName)}`;
        method = 'POST';
        body = JSON.stringify(data || {});
        break;
      default:
        logDebug('❌ Invalid action', { action, availableActions: ['create', 'connect', 'qrcode', 'info', 'fetchInstances', 'connectionState', 'delete', 'webhook', 'webhookFind', 'settings', 'sendText', 'sendMedia'] });
        throw new Error(`Invalid action: ${action}`);
    }

    logDebug('🌐 Making request to Evolution API', { 
      url, 
      method, 
      bodyLength: body ? body.length : 0,
      hasApiKey: !!EVOLUTION_API_KEY
    });

    // 🔧 CORREÇÃO CRÍTICA: Headers padronizados para Evolution API V2
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'SaaSAgent-Supabase-Function'
    };

    // 🔧 CORREÇÃO: Evolution API V2 usa 'apikey' header (não Authorization)
    headers['apikey'] = EVOLUTION_API_KEY;

    logDebug('📡 Request headers prepared', { 
      hasContentType: !!headers['Content-Type'],
      hasApiKey: !!headers['apikey'],
      headerCount: Object.keys(headers).length
    });

    // Make the request to Evolution API
    const response = await fetch(url, {
      method,
      headers,
      body
    });

    logDebug('📨 Evolution API response', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    // 🔧 CORREÇÃO: Tratamento robusto da resposta
    let result: any;
    const contentType = response.headers.get('content-type') || '';
    
    try {
      if (contentType.includes('application/json')) {
        result = await response.json();
      } else {
        const textResult = await response.text();
        logDebug('⚠️ Non-JSON response', { contentType, textLength: textResult.length });
        
        // Try to parse as JSON anyway
        try {
          result = JSON.parse(textResult);
        } catch {
          result = { message: textResult, status: response.status };
        }
      }
    } catch (parseError) {
      logDebug('❌ Response parsing failed', { error: parseError.message });
      result = { 
        error: 'Failed to parse response', 
        status: response.status,
        statusText: response.statusText
      };
    }

    if (!response.ok) {
      logDebug('❌ Evolution API error', { 
        status: response.status, 
        result,
        url,
        method
      });
      
      // 🔧 CORREÇÃO: Mensagens de erro específicas
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed with Evolution API (${response.status}). Verify EVOLUTION_API_KEY is correct.`);
      } else if (response.status === 404) {
        throw new Error(`Evolution API endpoint not found (${response.status}). Check EVOLUTION_API_URL: ${url}`);
      } else if (response.status >= 500) {
        throw new Error(`Evolution API server error (${response.status}). Server may be down or misconfigured.`);
      }
      
      throw new Error(`Evolution API error: ${response.status} ${response.statusText} - ${JSON.stringify(result)}`);
    }

    logDebug('✅ Success', { responseKeys: Object.keys(result || {}) });

    // Return the response with CORS headers
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logDebug('💥 Fatal error', { 
      error: errorMessage, 
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      path: req.url,
      details: 'Check Supabase logs for more information'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: errorMessage.includes('Authentication failed') ? 401 : 
              errorMessage.includes('not found') ? 404 : 500
    });
  }
}) 