import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { diagnostic, logStep, logAsyncStep } from '@/utils/diagnostic';
import { throttledSubscriptionCheck, resetSubscriptionCache, getThrottleStats } from "@/lib/subscription-throttle";
import { logAuthEvent, getAuthDiagnostics } from '@/utils/auth-diagnostic';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { diagnostic, logStep, logAsyncStep } from '@/utils/diagnostic';
import { throttledSubscriptionCheck, resetSubscriptionCache, getThrottleStats } from "@/lib/subscription-throttle";
import { logAuthEvent, getAuthDiagnostics } from '@/utils/auth-diagnostic';

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
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  // Usar um ref para controle de inicialização e evitar loops
  const initializationAttempted = useRef(false);
  
  console.log('👤 UserProvider: Inicializando...');
  
  // Função auxiliar para criar um usuário com plano padrão
  const createUserWithDefaultPlan = (supabaseUser: any, defaultPlan: SubscriptionPlan = 'free') => {
    return logStep('Create User With Default Plan', () => {
      // Verificar se já temos um usuário com este ID para evitar recriações
      if (user && user.id === supabaseUser.id) {
        console.log("Usuário já existe, ignorando criação duplicada");
        logAuthEvent('user_exists', { 
          userId: user.id, 
          email: user.email 
        });
        return user;
      }
      
      const newUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
        plan: defaultPlan,
        messageCount: 0,
        messageLimit: getMessageLimitByPlan(defaultPlan),
        agents: [],
      };
      console.log("Criando novo usuário no contexto com plano padrão:", newUser);
      
      // Registrar evento de criação de usuário
      logAuthEvent('create_user', { 
        userId: newUser.id, 
        email: newUser.email, 
        plan: defaultPlan
      });
      
      setUser(newUser);
      return newUser;
    });
  };
  
  // Check subscription status com throttle para evitar chamadas excessivas
  // Implementação do método de verificação de assinatura (sem throttling)
  const rawCheckSubscriptionStatus = useCallback(async () => {
    try {
      console.log("Verificando status da assinatura...");
      
      // Registrar evento de verificação de assinatura
      logAuthEvent('subscription_check_start', { 
        userId: user?.id || 'unknown',
        throttleStats: getThrottleStats().global
      });
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log("Sem sessão ativa, não é possível verificar assinatura");
        logAuthEvent('check_session_failed', { reason: 'no_session' });
        return null;
      }
      
      const supabaseUser = session.user;
      if (!supabaseUser) {
        console.log("Sem usuário na sessão");
        logAuthEvent('check_session_failed', { reason: 'no_user_in_session', sessionId: session.id });
        return null;
      }
      
      logAuthEvent('check_session_success', { 
        sessionId: session.id, 
        userId: supabaseUser.id,
        email: supabaseUser.email
      });
      
      console.log("Chamando edge function check-subscription");
      
      try {
        // Call check-subscription edge function with performance logging
        console.time('check-subscription-call');
        const { data, error } = await supabase.functions.invoke('check-subscription');
        console.timeEnd('check-subscription-call');
        
        if (error) {
          console.error('Error checking subscription:', error);
          
          // Se há erro, mas o usuário está autenticado, garantimos que ele tenha um plano
          if (!user && supabaseUser) {
            createUserWithDefaultPlan(supabaseUser);
          }
          return null;
        }
        
        console.log("Resposta de check-subscription:", data);
        
        if (data) {
          // If we have a user but no data in context yet, create it
          if (!user && supabaseUser) {
            const newUser: User = {
              id: supabaseUser.id,
              email: supabaseUser.email || '',
              name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
              plan: (data.plan || 'free') as SubscriptionPlan,
              messageCount: data.message_count || 0,
              messageLimit: getMessageLimitByPlan(data.plan || 'free'),
              agents: [],
            };
            console.log("Criando novo usuário no contexto:", newUser);
            setUser(newUser);
            return data;
          }
          // If we already have user data, just update the plan
          else if (user && data.plan && data.plan !== user.plan) {
            console.log(`Atualizando plano de ${user.plan} para ${data.plan}`);
            setPlan(data.plan as SubscriptionPlan);
            return data;
          }
          // Se já temos usuário e o plano não mudou, ainda assim atualizamos os contadores
          else if (user && data.message_count !== undefined) {
            updateUser({
              messageCount: data.message_count
            });
            return data;
          }
          return data;
        }
        return null;
      } catch (invokeError) {
        console.error('Failed to invoke check-subscription function:', invokeError);
        
        // Em caso de erro na invocação, garantimos que o usuário tenha um plano básico
        if (!user && supabaseUser) {
          createUserWithDefaultPlan(supabaseUser);
        }
        return null;
      }
    } catch (err) {
      console.error('Failed to check subscription status:', err);
      
      // Tentamos obter uma sessão para criar um usuário básico mesmo com erro
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && !user) {
          createUserWithDefaultPlan(session.user);
        }
      } catch (sessionErr) {
        console.error('Failed to get session after subscription error:', sessionErr);
      }
      return null;
    }
  }, [user]);
  
  // Aplicamos o throttling na função de verificação de assinatura com contexto específico de usuário
  const checkSubscriptionStatus = useCallback(async () => {
    const throttled = throttledSubscriptionCheck(
      async () => rawCheckSubscriptionStatus(),
      { 
        userId: user?.id || 'anonymous', 
        interval: 5 * 60 * 1000 // 5 minutos
      }
    );
    return throttled();
  }, [rawCheckSubscriptionStatus, user?.id]);
  
  // Listen for auth state changes
  useEffect(() => {
    if (initializationAttempted.current) {
      // Evitar configurar listeners múltiplas vezes
      console.log("Inicialização já tentada, ignorando configuração duplicada de listener");
      logAuthEvent('provider_init_skipped', { reason: 'already_attempted' });
      return;
    }
    
    initializationAttempted.current = true;
    setIsLoading(true);
    console.log("Configurando listener de autenticação");
    logAuthEvent('provider_init', { timestamp: Date.now() });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Evento de autenticação:", event, session ? "com sessão" : "sem sessão");
        
        if (event === 'SIGNED_IN' && session) {
          // Get user data from session
          const supabaseUser = session.user;
          if (!supabaseUser) return;
          
          console.log("Usuário logado:", supabaseUser);
          
          // Limpar cache antes de criar usuário para garantir que não há dados antigos
          resetSubscriptionCache();
          
          // Create new user object with default free plan
          createUserWithDefaultPlan(supabaseUser);
          
          // Check subscription status after delay to ensure auth is complete
          setTimeout(() => {
            checkSubscriptionStatus();
          }, 1000);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("Usuário deslogado");
          setUser(null);
          // Limpar cache quando o usuário deslogar
          resetSubscriptionCache();
        }
        
        setIsLoading(false);
      }
    );
    
    // Check initial session
    const checkSession = async () => {
      console.log("Verificando sessão inicial");
      logAuthEvent('initial_session_check', { timestamp: Date.now() });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Sessão existente encontrada");
        logAuthEvent('session_found', { 
          sessionId: session.id,
          userId: session.user.id,
          email: session.user.email
        });
        
        const supabaseUser = session.user;
        
        // Create new user object with default free plan
        createUserWithDefaultPlan(supabaseUser);
        
        // Check subscription status after delay
        setTimeout(() => {
          logAuthEvent('delayed_subscription_check', { 
            userId: supabaseUser.id,
            email: supabaseUser.email
          });
          checkSubscriptionStatus();
        }, 1000);
      } else {
        console.log("Nenhuma sessão existente encontrada");
        logAuthEvent('no_session_found', {});
      }
      
      setIsLoading(false);
    };
    
    checkSession();
    
    return () => {
      console.log("Removendo listener de autenticação");
      // The subscription object from Supabase auth doesn't have unsubscribe method
      // Instead, we need to call the subscription function directly
      subscription?.unsubscribe?.();
    };
  }, []);  // Removida a dependência em checkSubscriptionStatus para prevenir recriar listener

  const updateUser = (updatedUser: Partial<User>) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedUser
      };
    });
  };

  const login = async (email: string, name: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      email,
      name,
      plan: 'free',
      messageCount: 0,
      messageLimit: getMessageLimitByPlan('free'),
      agents: [],
    };
    
    setUser(newUser);
    
    // Limpar cache antes de verificar assinatura
    resetSubscriptionCache();
    
    // Check subscription status after login with delay
    setTimeout(() => {
      checkSubscriptionStatus();
    }, 1000);
  };

  const logout = async () => {
    // Limpar cache antes de deslogar
    resetSubscriptionCache();
    logAuthEvent('logout', { userId: user?.id, email: user?.email });
    await supabase.auth.signOut();
    setUser(null);
  };

  const setPlan = (plan: SubscriptionPlan) => {
    if (!user) return;
    
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        plan,
        messageLimit: getMessageLimitByPlan(plan)
      };
    });
  };

  // Função para obter informações de diagnóstico
  const getDiagnosticInfo = useCallback(() => {
    return {
      authEvents: getAuthDiagnostics(),
      throttleStats: getThrottleStats(),
      contextState: {
        isLoading,
        hasUser: !!user,
        userId: user?.id,
        plan: user?.plan,
        initializationAttempted: initializationAttempted.current,
      }
    };
  }, [user, isLoading]);

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        updateUser, 
        setPlan, 
        logout, 
        login,
        isLoading,
        checkSubscriptionStatus,
        getDiagnosticInfo
      }}
    >
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
