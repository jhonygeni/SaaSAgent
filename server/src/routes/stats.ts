import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';

const router = Router();

// Get dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const { data: usageData, error: usageError } = await supabaseAdmin
      .from('usage_stats')
      .select('date, messages_sent, messages_received, user_id')
      .eq('user_id', userId)
      .gte('date', sevenDaysAgo.toISOString().split('T')[0])
      .lte('date', today.toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (usageError) {
      console.error('Error fetching usage stats:', usageError);
      return res.status(500).json({ error: 'Failed to fetch usage stats' });
    }

    // If no data found, try without user filter
    if (!usageData || usageData.length === 0) {
      const { data: anyData, error: anyError } = await supabaseAdmin
        .from('usage_stats')
        .select('date, messages_sent, messages_received, user_id')
        .order('date', { ascending: false })
        .limit(10);

      if (anyError) {
        console.error('Error fetching any stats:', anyError);
        return res.status(500).json({ error: 'Failed to fetch stats' });
      }

      // Use demo data if available
      if (anyData && anyData.length > 0) {
        const processedData = anyData.slice(0, 7).map(item => {
          const date = new Date(item.date);
          const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
          return {
            dia: dayNames[date.getDay()],
            enviadas: item.messages_sent || 0,
            recebidas: item.messages_received || 0,
            date: item.date
          };
        });

        const totalMessages = processedData.reduce((sum, day) => sum + day.enviadas, 0);

        return res.json({
          data: processedData,
          totalMessages,
          isDemo: true
        });
      }
    }

    // Process user-specific data
    const processedData = (usageData || []).map(item => {
      const date = new Date(item.date);
      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      return {
        dia: dayNames[date.getDay()],
        enviadas: item.messages_sent || 0,
        recebidas: item.messages_received || 0,
        date: item.date
      };
    });

    const totalMessages = processedData.reduce((sum, day) => sum + day.enviadas, 0);

    return res.json({
      data: processedData,
      totalMessages,
      isDemo: false
    });
  } catch (error) {
    console.error('Error in /stats/dashboard:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get realtime stats
router.get('/realtime', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data: statsData, error: statsError } = await supabaseAdmin
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching realtime stats:', statsError);
      return res.status(500).json({ error: 'Failed to fetch realtime stats' });
    }

    return res.json(statsData || {
      messages_sent: 0,
      messages_received: 0,
      active_sessions: 0,
      new_contacts: 0
    });
  } catch (error) {
    console.error('Error in /stats/realtime:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stats
router.post('/update', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { messages_sent, messages_received, active_sessions, new_contacts } = req.body;
    const today = new Date().toISOString().split('T')[0];

    // Get current stats
    const { data: currentStats, error: statsError } = await supabaseAdmin
      .from('usage_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Error fetching current stats:', statsError);
      return res.status(500).json({ error: 'Failed to fetch current stats' });
    }

    // Prepare update data
    const updateData = {
      user_id: userId,
      date: today,
      messages_sent: (currentStats?.messages_sent || 0) + (messages_sent || 0),
      messages_received: (currentStats?.messages_received || 0) + (messages_received || 0),
      active_sessions: active_sessions !== undefined ? active_sessions : (currentStats?.active_sessions || 0),
      new_contacts: (currentStats?.new_contacts || 0) + (new_contacts || 0),
    };

    // Update or insert stats
    const { data: updatedStats, error: updateError } = await supabaseAdmin
      .from('usage_stats')
      .upsert([updateData])
      .select()
      .single();

    if (updateError) {
      console.error('Error updating stats:', updateError);
      return res.status(500).json({ error: 'Failed to update stats' });
    }

    return res.json(updatedStats);
  } catch (error) {
    console.error('Error in /stats/update:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 