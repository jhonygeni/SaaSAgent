import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/safeLog';

interface UserContextType {
  user: User | null;
  updateUser: (updatedUser: Partial<User>) => void;
  setPlan: (plan: SubscriptionPlan) => void;
  logout: () => void;
  login: (email: string, name: string) => void;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Refs para controle rigoroso - EVITA LOOPS INFINITOS
  const isMounted = useRef(true);
  const lastCheckTime = useRef(0);
  const isCheckingRef = useRef(false);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Throttle de 10 segundos para evitar loops infinitos
  const CHECK_THROTTLE_DELAY = 10000;
  
  // Cleanup ao desmontar
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      console.log('🧹 UserProvider: Limpando recursos no desmonte');
      isMounted.current = false;
      isCheckingRef.current = false;
      
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Função auxiliar para criar usuário (NÃO altera state diretamente)
  const createUserWithDefaultPlan = useCallback((supabaseUser: any, defaultPlan: SubscriptionPlan = 'free'): User => {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      plan: defaultPlan,
      messageCount: 0,
      messageLimit: getMessageLimitByPlan(defaultPlan),
      agents: [],
    };
  }, []);
  
  // Check subscription com controle rigoroso
  const checkSubscriptionStatus = useCallback(async () => {
    // PROTEÇÃO 1: Verificar se já está executando
    if (isCheckingRef.current) {
      console.log('⏸️ UserContext: checkSubscriptionStatus já executando, ignorando');
      return;
    }
    
    // PROTEÇÃO 2: Throttle baseado no tempo
    const now = Date.now();
    if (now - lastCheckTime.current < CHECK_THROTTLE_DELAY) {
      console.log(`⏱️ UserContext: Throttle ativo (${Math.round((CHECK_THROTTLE_DELAY - (now - lastCheckTime.current)) / 1000)}s restantes)`);
      return;
    }
    
    // PROTEÇÃO 3: Verificar se componente está montado
    if (!isMounted.current) {
      console.log('🚫 UserContext: Componente desmontado, cancelando verificação');
      return;
    }
    
    isCheckingRef.current = true;
    lastCheckTime.current = now;
    
    try {
      console.log('🔍 UserContext: Verificando status da assinatura...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log('👤 UserContext: Sem sessão ativa');
        return;
      }
      
      const supabaseUser = session.user;
      
      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.warn('⚠️ UserContext: Erro na verificação, usando plano padrão:', error.message);
          
          // Usar callback para evitar dependência de user
          setUser(currentUser => {
            if (!currentUser) {
              const newUser = createUserWithDefaultPlan(supabaseUser);
              logger.sensitive('✅ UserContext: Usuário criado com plano padrão (erro)', { email: newUser.email });
              return newUser;
            }
            return currentUser;
          });
          return;
        }
        
        console.log('📊 UserContext: Resposta da verificação:', data);
        
        if (data) {
          setUser(currentUser => {
            if (!currentUser) {
              const newUser = createUserWithDefaultPlan(supabaseUser, data.plan || 'free');
              logger.sensitive('✅ UserContext: Usuário criado com plano da API', { email: newUser.email, plan: newUser.plan });
              return newUser;
            } else if (data.plan && data.plan !== currentUser.plan) {
              console.log(`🔄 UserContext: Atualizando plano de ${currentUser.plan} para ${data.plan}`);
              return {
                ...currentUser,
                plan: data.plan as SubscriptionPlan,
                messageLimit: getMessageLimitByPlan(data.plan)
              };
            }
            return currentUser;
          });
        }
      } catch (invokeError) {
        console.error('🚨 UserContext: Erro na invocação da function:', invokeError);
        
        setUser(currentUser => {
          if (!currentUser) {
            const newUser = createUserWithDefaultPlan(supabaseUser);
            logger.sensitive('✅ UserContext: Usuário criado após erro de invocação', { email: newUser.email });
            return newUser;
          }
          return currentUser;
        });
      }
    } catch (err) {
      console.error('🚨 UserContext: Erro geral na verificação:', err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [createUserWithDefaultPlan]);
  
  // Listen for auth state changes - SEM DEPENDÊNCIAS PROBLEMÁTICAS
  useEffect(() => {
    console.log('🔐 UserContext: Configurando listener de autenticação');
    setIsLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔐 UserContext: Evento de auth: ${event}`, session ? 'com sessão' : 'sem sessão');
        
        if (event === 'SIGNED_IN' && session?.user) {
          const supabaseUser = session.user;
          const newUser = createUserWithDefaultPlan(supabaseUser);
          
          logger.sensitive('✅ UserContext: Usuário logado, criando contexto', { email: newUser.email });
          setUser(newUser);
          
          // Verificar subscription após delay controlado
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
          
          checkTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              checkSubscriptionStatus();
            }
          }, 3000); // 3 segundos de delay
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('👋 UserContext: Usuário deslogado');
          setUser(null);
          
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
            checkTimeoutRef.current = null;
          }
        }
        
        setIsLoading(false);
      }
    );
    
    // Verificar sessão inicial
    const checkInitialSession = async () => {
      try {
        console.log('🔍 UserContext: Verificando sessão inicial');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const newUser = createUserWithDefaultPlan(session.user);
          console.log('✅ UserContext: Sessão inicial encontrada:', newUser.email);
          setUser(newUser);
          
          // Verificar subscription após delay
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
          
          checkTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              checkSubscriptionStatus();
            }
          }, 3000);
        } else {
          console.log('ℹ️ UserContext: Nenhuma sessão inicial encontrada');
        }
      } catch (err) {
        console.error('🚨 UserContext: Erro ao verificar sessão inicial:', err);
      }
      
      setIsLoading(false);
    };
    
    checkInitialSession();
    
    return () => {
      console.log('🧹 UserContext: Removendo listener de autenticação');
      subscription.unsubscribe();
      
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
    };
  }, []); // IMPORTANTE: Array vazio - sem dependências

  const updateUser = useCallback((updatedUser: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      return { ...prev, ...updatedUser };
    });
  }, []);

  const login = useCallback(async (email: string, name: string) => {
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
    
    // Check subscription com delay controlado
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    checkTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        checkSubscriptionStatus();
      }
    }, 3000);
  }, [checkSubscriptionStatus]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const setPlan = useCallback((plan: SubscriptionPlan) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        plan,
        messageLimit: getMessageLimitByPlan(plan)
      };
    });
  }, []);

  return (
    <UserContext.Provider 
      value={{ 
        user, 
        updateUser, 
        setPlan, 
        logout, 
        login,
        isLoading,
        checkSubscriptionStatus 
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