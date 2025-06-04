import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { usageStatsRateLimiter } from '@/lib/rate-limiter';
import { usageStatsCache } from '@/lib/cache-manager';

interface UsageStats {
  id: string;
  user_id: string;
  date: string;
  messages_sent: number;
  messages_received: number;
  active_sessions: number;
  new_contacts: number;
  created_at: string;
  updated_at: string;
}

const INITIAL_STATS: UsageStats = {
  id: '',
  user_id: '',
  date: new Date().toISOString().split('T')[0],
  messages_sent: 0,
  messages_received: 0,
  active_sessions: 0,
  new_contacts: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff delays in ms
const THROTTLE_INTERVAL = 5000; // 5 seconds between updates
const MAX_RETRIES = 3;

export function useRealTimeUsageStats() {
  const { user } = useUser();
  const [stats, setStats] = useState<UsageStats>(INITIAL_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isMounted = useRef(true);
  const lastUpdateTime = useRef(0);
  const retryCount = useRef(0);
  const updateTimeout = useRef<NodeJS.Timeout>();
  const subscription = useRef<any>(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (updateTimeout.current) {
        clearTimeout(updateTimeout.current);
      }
      if (subscription.current) {
        subscription.current.unsubscribe();
      }
    };
  }, []);

  // Function to fetch stats with retry logic
  const fetchStats = async (retryAttempt = 0) => {
    if (!user?.id || !isMounted.current) return;

    // Check rate limiting
    const rateLimitKey = `usage_stats_${user.id}`;
    if (usageStatsRateLimiter.isRateLimited(rateLimitKey)) {
      console.warn('Rate limit reached for usage stats');
      return;
    }

    // Check cache first
    const cacheKey = `usage_stats_${user.id}_${new Date().toISOString().split('T')[0]}`;
    const cachedData = usageStatsCache.get<UsageStats>(cacheKey);
    if (cachedData) {
      setStats(cachedData);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Check throttling
    const now = Date.now();
    if (now - lastUpdateTime.current < THROTTLE_INTERVAL) {
      return;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('usage_stats')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (fetchError) throw fetchError;

      if (isMounted.current && data) {
        const statsData = data as UsageStats;
        setStats(statsData);
        setError(null);
        lastUpdateTime.current = now;
        retryCount.current = 0;

        // Cache the successful response
        usageStatsCache.set(cacheKey, statsData);
      }
    } catch (err) {
      console.error('Error fetching usage stats:', err);
      
      if (!isMounted.current) return;

      setError('Erro ao carregar estatísticas de uso');
      
      // Retry logic with exponential backoff
      if (retryAttempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryAttempt] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        updateTimeout.current = setTimeout(() => {
          if (isMounted.current) {
            fetchStats(retryAttempt + 1);
          }
        }, delay);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  // Importar o gerenciador de subscriptions centralizado
  import { subscriptionManager } from '@/lib/subscription-manager';
  
  // Set up real-time subscription and initial fetch usando o gerenciador centralizado
  useEffect(() => {
    if (!user?.id) {
      setStats(INITIAL_STATS);
      setIsLoading(false);
      return;
    }

    // Initial fetch with timeout para evitar loops
    const fetchTimeout = setTimeout(() => {
      if (isMounted.current) {
        fetchStats();
      }
    }, 100);

    // ID único para esta subscription
    const subscriptionId = `usage_stats_central_${user.id}`;

    // Configurar com gerenciador centralizado
    const unsubscribe = subscriptionManager.subscribe(subscriptionId, {
      table: 'usage_stats',
      event: '*',
      filter: `user_id=eq.${user.id}`,
      callback: (payload) => {
        if (!isMounted.current || !payload.new) return;
        
        const now = Date.now();
        const rateLimitKey = `usage_stats_rt_${user.id}`;
        
        // Rate limiting with proper throttle
        if (!usageStatsRateLimiter.isRateLimited(rateLimitKey) && 
            now - lastUpdateTime.current >= THROTTLE_INTERVAL) {
          const statsData = payload.new as UsageStats;
          setStats(statsData);
          lastUpdateTime.current = now;

          // Update cache
          const cacheKey = `usage_stats_${user.id}_${statsData.date}`;
          usageStatsCache.set(cacheKey, statsData);
        }
      }
    });

    return () => {
      clearTimeout(fetchTimeout);
      unsubscribe();
    };
  }, [user?.id]); // Remove circular dependencies

  const refreshStats = () => {
    if (isMounted.current) {
      retryCount.current = 0;
      fetchStats();
    }
  };

  return {
    stats,
    isLoading,
    error,
    refreshStats,
  };
} 