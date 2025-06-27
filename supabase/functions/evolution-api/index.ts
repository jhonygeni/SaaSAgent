import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// 🔧 CORREÇÃO FINAL: Edge Function que aceita JSON direto da Evolution API V2
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')

// Helper function for detailed logging
const logDebug = (message: string, data?: any) => {
  console.log(`[EVOLUTION-API-V2] ${message}`, data ? JSON.stringify(data, null, 2) : '');
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

    // 🔧 CORREÇÃO: Validação de variáveis de ambiente
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

    // 🔧 CORREÇÃO CRÍTICA: Parse request body para extrair endpoint e method
    let requestData: any = {};
    let endpoint = '';
    let method = 'GET';
    
    try {
      // Verificar se há body na requisição
      const bodyText = await req.text();
      logDebug('📥 Raw body received', { bodyLength: bodyText.length, bodyStart: bodyText.substring(0, 100) });
      
      if (bodyText) {
        requestData = JSON.parse(bodyText);
        logDebug('✅ JSON parsed successfully', { keys: Object.keys(requestData) });
      } else {
        logDebug('⚠️ Empty body received, using defaults');
        requestData = {};
      }
      
      // Extrair endpoint e method do body da requisição
      endpoint = requestData.endpoint || '/instance/fetchInstances';
      method = requestData.method || req.method || 'GET';
      
      // Se há data no body, usar ela como payload
      const payload = requestData.data || {};
      
      logDebug('📝 Request data parsed', { 
        endpoint,
        method,
        hasData: Object.keys(payload).length > 0,
        originalKeys: Object.keys(requestData)
      });
      
      requestData = payload; // Usar apenas os dados como payload
    } catch (parseError) {
      logDebug('❌ JSON parsing failed', { 
        error: parseError.message,
        bodyPreview: 'Unable to re-read body text after error'
      });
      throw new Error(`Invalid JSON body: ${parseError.message}`);
    }

    // Construir URL completa para Evolution API
    let evolutionApiUrl = EVOLUTION_API_URL.replace(/\/$/, '') + endpoint;
    let body: string | undefined = undefined;
    
    // Evolution API v2: Handle endpoints correctly with proper data formatting
    if (method !== 'GET') {
      // For POST/PUT/DELETE requests, include the body data
      if (Object.keys(requestData).length > 0) {
        // 🔧 CORREÇÃO ESPECÍFICA: Para endpoints de webhook, envolver os dados na propriedade "webhook"
        if (endpoint.includes('/webhook/set/')) {
          // A Evolution API espera: { "webhook": { "url": "", "events": [], ... } }
          body = JSON.stringify({
            webhook: requestData
          });
          logDebug('🔗 Webhook endpoint detected - wrapping data in webhook property', {
            originalData: requestData,
            wrappedData: { webhook: requestData }
          });
        } else {
          // Para outros endpoints, usar os dados diretamente
          body = JSON.stringify(requestData);
        }
      }
    }
    
    // ⚠️ IMPORTANT: /instance/connect/{instance} is always a GET request in Evolution API v2
    // Do not modify it to POST with body
    
    logDebug('🌐 Making request to Evolution API v2', { 
      url: evolutionApiUrl, 
      method, 
      bodyLength: body ? body.length : 0,
      hasApiKey: !!EVOLUTION_API_KEY
    });

    // 🔧 CORREÇÃO: Headers padronizados para Evolution API V2
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'SaaSAgent-Supabase-Function'
    };
    headers['apikey'] = EVOLUTION_API_KEY;

    // Make the request to Evolution API
    const response = await fetch(evolutionApiUrl, {
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
        url: evolutionApiUrl,
        method
      });
      
      // 🔧 CORREÇÃO: Mensagens de erro específicas
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed with Evolution API (${response.status}). Verify EVOLUTION_API_KEY is correct.`);
      } else if (response.status === 404) {
        throw new Error(`Evolution API endpoint not found (${response.status}). Check endpoint: ${endpoint}`);
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
      stack: error instanceof Error ? error.stack : undefined,
      url: req.url,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries())
    });
    
    // Determinar status code baseado no tipo de erro
    let statusCode = 500;
    if (errorMessage.includes('Authentication failed') || errorMessage.includes('401') || errorMessage.includes('403')) {
      statusCode = 401;
    } else if (errorMessage.includes('not found') || errorMessage.includes('404')) {
      statusCode = 404;
    } else if (errorMessage.includes('Invalid JSON body')) {
      statusCode = 400;
    } else if (errorMessage.includes('Missing EVOLUTION_API')) {
      statusCode = 500; // Server configuration error
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method,
      details: 'Check Supabase logs for more information',
      requestId: `edge-${Date.now()}`,
      debug: {
        hasEvolutionUrl: !!EVOLUTION_API_URL,
        hasEvolutionKey: !!EVOLUTION_API_KEY,
        userAgent: req.headers.get('user-agent') || 'unknown'
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusCode
    });
  }
})