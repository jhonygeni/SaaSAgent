import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL')
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY')

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate required environment variables with specific error messages
    if (!EVOLUTION_API_URL) {
      throw new Error('Missing EVOLUTION_API_URL. Please set this secret using: supabase secrets set EVOLUTION_API_URL=your_url')
    }
    if (!EVOLUTION_API_KEY) {
      throw new Error('Missing EVOLUTION_API_KEY. Please set this secret using: supabase secrets set EVOLUTION_API_KEY=your_key')
    }

    // Basic API key validation for security
    const apiKey = req.headers.get('apikey') || req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!apiKey) {
      return new Response(JSON.stringify({ 
        error: 'API key required',
        status: 401,
        timestamp: new Date().toISOString()
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Safely parse request body
    let requestData = null
    try {
      const bodyText = await req.text()
      if (bodyText) {
        try {
          requestData = JSON.parse(bodyText)
        } catch (parseError) {
          return new Response(JSON.stringify({
            error: 'Invalid JSON format',
            message: 'Request body must be valid JSON',
            details: parseError.message,
            status: 400,
            timestamp: new Date().toISOString()
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
    } catch (bodyError) {
      return new Response(JSON.stringify({
        error: 'Request body error',
        message: 'Failed to read request body',
        details: bodyError.message,
        status: 400,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Handle empty body for actions that don't require it
    let { action, instanceName, data } = requestData || { action: null, instanceName: null, data: null }

    // For fetchInstances, we don't need body data
    if (!action && req.method === 'GET') {
      action = 'fetchInstances'
    }

    if (!action) {
      return new Response(JSON.stringify({
        error: 'Missing parameter',
        message: 'The action parameter is required',
        status: 400,
        timestamp: new Date().toISOString()
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Build the Evolution API URL based on the action
    let url = EVOLUTION_API_URL
    let method = 'GET'
    let body: string | undefined = undefined

    switch (action) {
      case 'create':
        url += '/instance/create'
        method = 'POST'
        body = JSON.stringify(data)
        break
      case 'connect':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/instance/connect/${instanceName}`
        break
      case 'qrcode':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/instance/qrcode/${instanceName}`
        break
      case 'info':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/instance/info/${instanceName}`
        break
      case 'fetchInstances':
        url += '/instance/fetchInstances'
        break
      case 'connectionState':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/instance/connectionState/${instanceName}`
        break
      case 'delete':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/instance/delete/${instanceName}`
        method = 'DELETE'
        break
      case 'webhook':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/webhook/set/${instanceName}`
        method = 'POST'
        body = JSON.stringify(data)
        break
      case 'webhookFind':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/webhook/find/${instanceName}`
        break
      case 'settings':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/settings/set/${instanceName}`
        method = 'POST'
        body = JSON.stringify(data)
        break
      case 'sendText':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/message/sendText/${instanceName}`
        method = 'POST'
        body = JSON.stringify(data)
        break
      case 'sendMedia':
        if (!instanceName) throw new Error('Missing required parameter: instanceName')
        url += `/message/sendMedia/${instanceName}`
        method = 'POST'
        body = JSON.stringify(data)
        break
      default:
        return new Response(JSON.stringify({
          error: 'Invalid action',
          message: `Action '${action}' is not supported`,
          status: 400,
          timestamp: new Date().toISOString()
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    console.log(`Making request to Evolution API: ${url}`)

    // Make the request to Evolution API
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY,
        'Accept': 'application/json'
      },
      body
    })

    let result
    try {
      result = await response.json()
    } catch (jsonError) {
      return new Response(JSON.stringify({
        error: 'Invalid response from Evolution API',
        message: 'Failed to parse Evolution API response',
        details: jsonError.message,
        status: 502,
        timestamp: new Date().toISOString()
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!response.ok) {
      // Add specific error handling for authentication issues
      if (response.status === 401 || response.status === 403) {
        return new Response(JSON.stringify({
          error: 'Authentication failed',
          message: 'Failed to authenticate with Evolution API',
          status: response.status,
          timestamp: new Date().toISOString()
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({
        error: 'Evolution API error',
        message: `Evolution API returned status ${response.status}`,
        details: result,
        status: response.status,
        timestamp: new Date().toISOString()
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Return the response with CORS headers
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status
    })

  } catch (error) {
    console.error('Error in evolution-api function:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message,
      status: 500,
      timestamp: new Date().toISOString(),
      path: req.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
}) 