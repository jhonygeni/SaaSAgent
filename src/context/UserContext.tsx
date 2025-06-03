import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { diagnostic, logStep, logAsyncStep } from '@/utils/diagnostic';
import { throttledSubscriptionCheck, resetSubscriptionCache, getThrottleStats } from "@/lib/subscription-throttle";
import { logAuthEvent, getAuthDiagnostics } from '@/utils/auth-diagnostic';
import { getMockSubscriptionData, isMockModeEnabled } from '@/lib/mock-subscription-data';

interface UserContextType {
  user: User | null;
  updateUser: (updatedUser: Partial<User>) => void;
  setPlan: (plan: SubscriptionPlan) => void;
  logout: () => void;
  login: (email: string, name: string) => void;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
  getDiagnosticInfo: () => any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkInProgress = useRef(false);

  // Função para criar usuário com plano padrão
  const createUserWithDefaultPlan = useCallback(async (supabaseUser: any) => {
    const defaultUser = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuário',
      plan: 'free' as SubscriptionPlan,
      messageLimit: getMessageLimitByPlan('free'),
      subscriptionEnd: null,
      messageCount: 0,
      agents: []
    };
    setUser(defaultUser);
    return defaultUser;
  }, []);

  // Check subscription status com proteção contra chamadas simultâneas
  const checkSubscriptionStatus = useCallback(async () => {
    if (checkInProgress.current) {
      console.log("Verificação de assinatura já em andamento, ignorando chamada");
      return;
    }

    try {
      checkInProgress.current = true;
      console.log("Verificando status da assinatura...");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("Sem sessão ativa, não é possível verificar assinatura");
        return;
      }
      
      const supabaseUser = session.user;
      if (!supabaseUser) {
        console.log("Sem usuário na sessão");
        return;
      }

      console.log("Chamando edge function check-subscription");
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: { userId: supabaseUser.id }
      });
      
      if (error) {
        console.error('Error checking subscription:', error);
        if (!user && supabaseUser) {
          await createUserWithDefaultPlan(supabaseUser);
        }
        return;
      }

      console.log("Resposta de check-subscription:", data);
      
      if (data) {
        const updatedUser = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuário',
          plan: data.plan as SubscriptionPlan,
          messageLimit: getMessageLimitByPlan(data.plan),
          subscriptionEnd: data.subscription_end,
          messageCount: data.message_count || 0,
          agents: user?.agents || []
        };
        setUser(updatedUser);
      } else if (!user) {
        await createUserWithDefaultPlan(supabaseUser);
      }
    } catch (error) {
      console.error('Erro inesperado ao verificar assinatura:', error);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && !user) {
        await createUserWithDefaultPlan(session.user);
      }
    } finally {
      checkInProgress.current = false;
    }
  }, [user, createUserWithDefaultPlan]);

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : null);
  }, []);

  const setPlan = useCallback((plan: SubscriptionPlan) => {
    updateUser({ plan, messageLimit: getMessageLimitByPlan(plan) });
  }, [updateUser]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    resetSubscriptionCache();
  }, []);

  const login = useCallback(async (email: string, name: string) => {
    const { data: { user: supabaseUser } } = await supabase.auth.getUser();
    if (supabaseUser) {
      await createUserWithDefaultPlan(supabaseUser);
      await checkSubscriptionStatus();
    }
  }, [createUserWithDefaultPlan, checkSubscriptionStatus]);

  const getDiagnosticInfo = useCallback(() => {
    return {
      user,
      isLoading,
      authDiagnostics: getAuthDiagnostics(),
      throttleStats: getThrottleStats()
    };
  }, [user, isLoading]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      logAuthEvent(event, { session });
      
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          await createUserWithDefaultPlan(session.user);
          await checkSubscriptionStatus();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        resetSubscriptionCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [createUserWithDefaultPlan, checkSubscriptionStatus]);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await createUserWithDefaultPlan(session.user);
          await checkSubscriptionStatus();
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeUser();
  }, [createUserWithDefaultPlan, checkSubscriptionStatus]);

  return (
    <UserContext.Provider value={{
      user,
      updateUser,
      setPlan,
      logout,
      login,
      isLoading,
      checkSubscriptionStatus,
      getDiagnosticInfo
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
