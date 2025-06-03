import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from '@supabase/supabase-js';
import {
  checkRateLimit,
  createErrorResponse,
  validateRequest,
  ERROR_MESSAGES,
  corsHeaders,
} from '../config';

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UpdateStatsPayload {
  user_id: string;
  messages_sent?: number;
  messages_received?: number;
  active_sessions?: number;
  new_contacts?: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate request
    if (!validateRequest(req)) {
      return createErrorResponse(ERROR_MESSAGES.UNAUTHORIZED, 401);
    }

    // Check rate limit
    const context = { env: { USAGE_STATS_KV: await Deno.openKv() } };
    const isAllowed = await checkRateLimit(req, context, 'USAGE_STATS');
    if (!isAllowed) {
      return createErrorResponse(ERROR_MESSAGES.RATE_LIMIT, 429);
    }

    // Parse request body
    const payload: UpdateStatsPayload = await req.json();
    if (!payload.user_id) {
      return createErrorResponse(ERROR_MESSAGES.INVALID_REQUEST);
    }

    // Get current date
    const today = new Date().toISOString().split('T')[0];

    // Get current stats
    const { data: currentStats, error: statsError } = await supabase
      .from('usage_stats')
      .select('*')
      .eq('user_id', payload.user_id)
      .eq('date', today)
      .single();

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is "not found"
      throw statsError;
    }

    // Prepare update data
    const updateData = {
      user_id: payload.user_id,
      date: today,
      messages_sent: (currentStats?.messages_sent || 0) + (payload.messages_sent || 0),
      messages_received: (currentStats?.messages_received || 0) + (payload.messages_received || 0),
      active_sessions: payload.active_sessions !== undefined ? payload.active_sessions : (currentStats?.active_sessions || 0),
      new_contacts: (currentStats?.new_contacts || 0) + (payload.new_contacts || 0),
    };

    // Update or insert stats
    const { data: updatedStats, error: updateError } = await supabase
      .from('usage_stats')
      .upsert([updateData])
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify(updatedStats),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('Error in update-usage-stats function:', error);
    return createErrorResponse('Internal server error', 500);
  }
}); 