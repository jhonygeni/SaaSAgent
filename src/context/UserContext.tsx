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
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  console.log('👤 UserProvider: Inicializando... (VERSÃO CORRIGIDA)');
  
  // Função auxiliar para criar um usuário com plano padrão
  const createUserWithDefaultPlan = useCallback((supabaseUser: any, defaultPlan: SubscriptionPlan = 'free') => {
    return logStep('Create User With Default Plan', () => {
      // Verificar se já temos um usuário com este ID para evitar recriações
      if (user && user.id === supabaseUser.id) {
        console.log("✅ Usuário já existe no contexto, mantendo:", user);
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
      
      console.log("🆕 Criando novo usuário no contexto:", newUser);
      
      // Registrar evento de criação de usuário
      logAuthEvent('create_user', { 
        userId: newUser.id, 
        email: newUser.email, 
        plan: defaultPlan
      });
      
      setUser(newUser);
      return newUser;
    });
  }, [user]);
  
  // Check subscription status sem throttle inicialmente para depuração
  const rawCheckSubscriptionStatus = useCallback(async () => {
    try {
      console.log("🔍 Verificando status da assinatura...");
      
      // Registrar evento de verificação de assinatura
      logAuthEvent('subscription_check_start', { 
        userId: user?.id || 'unknown',
        timestamp: Date.now()
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
        logAuthEvent('check_session_failed', { reason: 'no_user_in_session' });
        return null;
      }        console.log("✅ Sessão válida encontrada para:", supabaseUser.email);
        logAuthEvent('check_session_success', { 
          userId: supabaseUser.id,
          email: supabaseUser.email
        });
      
      console.log("Chamando edge function check-subscription");
      
      // Se o modo mock estiver ativado, use dados simulados
      if (isMockModeEnabled()) {
        const mockData = getMockSubscriptionData(supabaseUser.id);
        console.log("🧪 Usando dados mockados:", mockData);
        
        // Simular delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (!user && supabaseUser) {
          const newUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
            plan: (mockData.plan || 'free') as SubscriptionPlan,
            messageCount: mockData.message_count || 0,
            messageLimit: getMessageLimitByPlan(mockData.plan || 'free'),
            agents: [],
          };
          console.log("Criando novo usuário no contexto com dados mockados:", newUser);
          setUser(newUser);
          return mockData;
        } else if (user) {
          updateUser({
            plan: mockData.plan as SubscriptionPlan,
            messageCount: mockData.message_count || 0,
            messageLimit: getMessageLimitByPlan(mockData.plan || 'free')
          });
          return mockData;
        }
        return mockData;
      }
      
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
        if (data && data.message_count !== undefined) {
          console.log("[DIAGNOSTIC] Valor de message_count recebido do backend:", data.message_count);
        }
        
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
            console.log("[DIAGNOSTIC] Atualizando user.messageCount para:", data.message_count);
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
  }, [user, createUserWithDefaultPlan]);
  
  // Simplificando o checkSubscriptionStatus (removendo throttle temporariamente)
  const checkSubscriptionStatus = useCallback(async () => {
    return rawCheckSubscriptionStatus();
  }, [rawCheckSubscriptionStatus]);
  
  // Simplificando o useEffect - REMOVENDO o ref que estava bloqueando
  useEffect(() => {
    console.log("🚀 Configurando listener de autenticação (SEM REF BLOQUEANTE)");
    setIsLoading(true);
    logAuthEvent('provider_init', { timestamp: Date.now() });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔔 Evento de autenticação: ${event}`, session ? "com sessão" : "sem sessão");
        
        if (event === 'SIGNED_IN' && session) {
          const supabaseUser = session.user;
          if (!supabaseUser) {
            console.log("❌ Evento SIGNED_IN mas sem usuário na sessão");
            return;
          }
          
          console.log("✅ Usuário logado detectado:", supabaseUser.email);
          
          // Limpar cache antes de criar usuário
          resetSubscriptionCache();
          
          // Create new user object with default free plan
          createUserWithDefaultPlan(supabaseUser);
          
          // Check subscription status immediately (sem delay)
          console.log("🔍 Verificando subscription imediatamente após login...");
          setTimeout(() => {
            checkSubscriptionStatus();
          }, 500); // Delay reduzido para 500ms
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("👋 Usuário deslogado");
          setUser(null);
          resetSubscriptionCache();
        }
        
        setIsLoading(false);
      }
    );
    
    // Check initial session - SEMPRE executar
    const checkSession = async () => {
      console.log("🔍 Verificando sessão inicial...");
      logAuthEvent('initial_session_check', { timestamp: Date.now() });
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("✅ Sessão existente encontrada:", session.user.email);
        logAuthEvent('session_found', { 
          sessionId: session.user.id,
          userId: session.user.id,
          email: session.user.email
        });
        
        const supabaseUser = session.user;
        
        // Create user immediately
        createUserWithDefaultPlan(supabaseUser);
        
        // Check subscription status
        setTimeout(() => {
          console.log("🔍 Verificando subscription após encontrar sessão inicial...");
          logAuthEvent('delayed_subscription_check', { 
            userId: supabaseUser.id,
            email: supabaseUser.email
          });
          checkSubscriptionStatus();
        }, 500);
      } else {
        console.log("❌ Nenhuma sessão existente encontrada");
        logAuthEvent('no_session_found', {});
      }
      
      setIsLoading(false);
    };
    
    checkSession();
    
    return () => {
      console.log("🧹 Removendo listener de autenticação");
      subscription?.unsubscribe?.();
    };
  }, []); // Dependências vazias - nunca recriar o listener

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    if (!user) {
      console.log("❌ Tentativa de atualizar usuário mas user é null");
      return;
    }
    
    console.log("🔄 Atualizando usuário:", updatedUser);
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        ...updatedUser
      };
    });
  }, [user]);

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
    
    console.log("👤 Login manual:", newUser);
    setUser(newUser);
    
    // Limpar cache antes de verificar assinatura
    resetSubscriptionCache();
    
    // Check subscription status after login
    setTimeout(() => {
      checkSubscriptionStatus();
    }, 500);
  };

  const logout = async () => {
    console.log("👋 Logout iniciado");
    resetSubscriptionCache();
    logAuthEvent('logout', { userId: user?.id, email: user?.email });
    await supabase.auth.signOut();
    setUser(null);
  };

  const setPlan = useCallback((plan: SubscriptionPlan) => {
    if (!user) {
      console.log("❌ Tentativa de definir plano mas user é null");
      return;
    }
    
    console.log(`📋 Definindo plano: ${plan}`);
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        plan,
        messageLimit: getMessageLimitByPlan(plan)
      };
    });
  }, [user]);

  // Função para obter informações de diagnóstico
  const getDiagnosticInfo = useCallback(() => {
    return {
      authEvents: getAuthDiagnostics(),
      throttleStats: getThrottleStats(),
      contextState: {
        isLoading,
        hasUser: !!user,
        userId: user?.id,
        userEmail: user?.email,
        plan: user?.plan,
        messageCount: user?.messageCount,
        timestamp: Date.now(),
      }
    };
  }, [user, isLoading]);

  // Log do estado atual para debug
  console.log("📊 Estado atual do UserContext:", {
    isLoading,
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
  });

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
