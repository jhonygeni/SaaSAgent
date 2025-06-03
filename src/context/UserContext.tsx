import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { resetSubscriptionCache } from "@/lib/subscription-throttle";

interface UserContextType {
  user: SupabaseUser | null;
  isLoading: boolean;
  error: string | null;
  logout: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const storageKey = `sb-${import.meta.env.VITE_SUPABASE_URL.split('//')[1].split('.')[0]}-auth-token`;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initializationAttempted = useRef(false);
  const checkInProgress = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Simplified session check function
  const checkSession = useCallback(async (force = false) => {
    if (checkInProgress.current && !force) {
      console.log("Session check already in progress");
      return;
    }

    if (!force && retryCount.current >= maxRetries) {
      console.log("Max retries reached");
      setIsLoading(false);
      return;
    }

    try {
      checkInProgress.current = true;
      console.log("Starting session check");

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session?.user) {
        console.log("Session found, updating user");
        setUser(session.user);
        setError(null);
        retryCount.current = 0;
      } else {
        console.log("No active session found");
        setUser(null);
        
        if (retryCount.current < maxRetries - 1) {
          retryCount.current++;
          setTimeout(() => checkSession(true), 1000);
          return;
        }
      }
    } catch (err) {
      console.error('Session check error:', err);
      setError('Session check failed');
      setUser(null);
    } finally {
      checkInProgress.current = false;
      setIsLoading(false);
    }
  }, []);

  // Initial session check
  useEffect(() => {
    if (initializationAttempted.current) return;
    
    console.log("Starting initial session check");
    initializationAttempted.current = true;
    checkSession(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);

      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        setError(null);
        setIsLoading(false);
        retryCount.current = 0;
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
        setIsLoading(false);
        localStorage.removeItem(storageKey);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSession]);

  const logout = async () => {
    try {
      setIsLoading(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      
      setUser(null);
      setError(null);
      localStorage.removeItem(storageKey);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError) throw subError;
      setUser(prev => prev ? { ...prev, subscription } : null);
    } catch (err) {
      console.error('Subscription check error:', err);
    }
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      isLoading, 
      error,
      logout,
      checkSubscriptionStatus
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
