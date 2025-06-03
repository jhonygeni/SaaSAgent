import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { resetSubscriptionCache } from "@/lib/subscription-throttle";

interface UserContextType {
  user: User | null;
  updateUser: (updatedUser: Partial<User>) => void;
  setPlan: (plan: SubscriptionPlan) => void;
  logout: () => Promise<void>;
  login: (email: string, name: string) => void;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
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
      return;
    }

    try {
      checkInProgress.current = true;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }
      
      const supabaseUser = session.user;
      if (!supabaseUser) {
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription', {
        body: { userId: supabaseUser.id }
      });
      
      if (error) {
        if (!user && supabaseUser) {
          await createUserWithDefaultPlan(supabaseUser);
        }
        return;
      }
      
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
    try {
      setIsLoading(true);
      // Primeiro limpa o cache e o estado local
      resetSubscriptionCache();
      setUser(null);
      
      // Depois faz o signOut do Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      
      // Por fim redireciona
      window.location.href = '/entrar';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, tenta redirecionar
      window.location.href = '/entrar';
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, name: string) => {
    try {
      setIsLoading(true);
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      if (supabaseUser) {
        await createUserWithDefaultPlan(supabaseUser);
        await checkSubscriptionStatus();
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    } finally {
      setIsLoading(false);
    }
  }, [createUserWithDefaultPlan, checkSubscriptionStatus]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          await createUserWithDefaultPlan(session.user);
          await checkSubscriptionStatus();
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        resetSubscriptionCache();
        window.location.href = '/entrar';
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
        console.error('Erro ao inicializar usuário:', error);
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
