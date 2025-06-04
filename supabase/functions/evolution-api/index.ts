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

    // Basic API key validation for security (optional - remove in production if using Supabase auth)
    const apiKey = req.headers.get('apikey') || req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { action, instanceName, data } = await req.json()

    // Validate required parameters
    if (!action) {
      throw new Error('Missing required parameter: action')
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
        throw new Error('Invalid action')
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

    const result = await response.json()

    if (!response.ok) {
      // Add specific error handling for authentication issues
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed with Evolution API (${response.status}). Please verify your EVOLUTION_API_KEY.`)
      }
      throw new Error(`Evolution API error: ${response.status} ${response.statusText}`)
    }

    // Return the response with CORS headers
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: response.status
    })

  } catch (error) {
    console.error('Error in evolution-api function:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString(),
      path: req.url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: error.message.includes('Authentication failed') ? 401 : 500
    })
  }
}) 