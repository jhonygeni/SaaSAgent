// filepath: /Users/jhonymonhol/Desktop/SaaSAgent/src/context/UserContext.tsx
import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef, useMemo } from 'react';
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
  
  // Refs para controle rigoroso de execução - EVITA LOOPS INFINITOS
  const isMounted = useRef(true);
  const isCheckingSubscription = useRef(false);
  const authListenerSet = useRef(false);
  const initialSessionChecked = useRef(false);
  
  // Cleanup no desmonte
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      logger.debug("UserProvider: Limpeza completa no desmonte");
      isMounted.current = false;
      isCheckingSubscription.current = false;
      authListenerSet.current = false;
      initialSessionChecked.current = false;
    };
  }, []);
  
  // Função MEMOIZADA para criar usuário com plano padrão
  const createUserWithDefaultPlan = useMemo(() => 
    (supabaseUser: any, defaultPlan: SubscriptionPlan = 'free'): User => {
      const newUser: User = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
        plan: defaultPlan,
        messageCount: 0,
        messageLimit: getMessageLimitByPlan(defaultPlan),
        agents: [],
      };
      logger.sensitive("UserContext: Criando usuário com plano padrão", { email: newUser.email, plan: newUser.plan });
      return newUser;
    }, []
  );
  
  // Check subscription status com controle rigoroso de execução
  const checkSubscriptionStatus = useCallback(async () => {
    // Verificações de segurança para evitar múltiplas execuções
    if (!isMounted.current) {
      console.log("🚫 UserContext: Componente desmontado, cancelando verificação");
      return;
    }
    
    if (isCheckingSubscription.current) {
      console.log("⏸️ UserContext: Verificação já em andamento, ignorando");
      return;
    }
    
    isCheckingSubscription.current = true;
    
    try {
      console.log("🔍 UserContext: Verificando status da assinatura...");
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.log("❌ UserContext: Sem sessão ativa para verificar assinatura");
        return;
      }
      
      const supabaseUser = session.user;
      logger.sensitive("UserContext: Usuário encontrado na sessão", { email: supabaseUser.email });
      
      try {
        // Call check-subscription edge function
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('⚠️ UserContext: Erro ao verificar assinatura:', error);
          
          // Se há erro mas usuário está autenticado, criar com plano padrão
          if (!user && isMounted.current) {
            const newUser = createUserWithDefaultPlan(supabaseUser);
            setUser(newUser);
          }
          return;
        }
        
        console.log("📊 UserContext: Resposta da verificação:", data);
        
        if (data && isMounted.current) {
          // Create or update user based on subscription data
          setUser(currentUser => {
            // Se não há usuário no contexto, criar um novo
            if (!currentUser) {
              return createUserWithDefaultPlan(supabaseUser, data.plan || 'free');
            }
            // Se há usuário mas plano mudou, atualizar
            else if (data.plan && data.plan !== currentUser.plan) {
              console.log(`🔄 UserContext: Atualizando plano de ${currentUser.plan} para ${data.plan}`);
              return {
                ...currentUser,
                plan: data.plan as SubscriptionPlan,
                messageLimit: getMessageLimitByPlan(data.plan)
              };
            }
            // Retornar usuário existente sem alterações
            return currentUser;
          });
        }
      } catch (invokeError) {
        console.error('🚨 UserContext: Falha ao invocar função de verificação:', invokeError);
        
        // Em caso de erro, garantir usuário com plano básico
        if (!user && isMounted.current) {
          const newUser = createUserWithDefaultPlan(supabaseUser);
          setUser(newUser);
        }
      }
    } catch (err) {
      console.error('🚨 UserContext: Erro geral na verificação:', err);
    } finally {
      isCheckingSubscription.current = false;
    }
  }, [user, createUserWithDefaultPlan]);
  
  // Auth state listener - EXECUTADO APENAS UMA VEZ
  useEffect(() => {
    if (authListenerSet.current) {
      console.log("⚠️ UserContext: Auth listener já configurado, ignorando");
      return;
    }
    
    console.log("🔐 UserContext: Configurando listener de autenticação");
    authListenerSet.current = true;
    setIsLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return;
        
        console.log("🔄 UserContext: Evento de auth:", event, session ? "com sessão" : "sem sessão");
        
        if (event === 'SIGNED_IN' && session?.user) {
          const supabaseUser = session.user;
          logger.sensitive("UserContext: Usuário logado", { email: supabaseUser.email });
          
          // Criar usuário imediatamente com plano padrão
          const newUser = createUserWithDefaultPlan(supabaseUser);
          setUser(newUser);
          
          // Verificar assinatura após delay (evita execução imediata)
          setTimeout(() => {
            if (isMounted.current && !isCheckingSubscription.current) {
              checkSubscriptionStatus();
            }
          }, 1500);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("👋 UserContext: Usuário deslogado");
          setUser(null);
        }
        
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    );
    
    // Verificar sessão inicial - APENAS UMA VEZ
    const checkInitialSession = async () => {
      if (initialSessionChecked.current) {
        console.log("⚠️ UserContext: Sessão inicial já verificada, ignorando");
        return;
      }
      
      initialSessionChecked.current = true;
      console.log("🔍 UserContext: Verificando sessão inicial");
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && isMounted.current) {
          logger.sensitive("UserContext: Sessão existente encontrada", { email: session.user.email });
          
          // Criar usuário com plano padrão
          const newUser = createUserWithDefaultPlan(session.user);
          setUser(newUser);
          
          // Verificar assinatura após delay
          setTimeout(() => {
            if (isMounted.current && !isCheckingSubscription.current) {
              checkSubscriptionStatus();
            }
          }, 1500);
        } else {
          console.log("ℹ️ UserContext: Nenhuma sessão existente");
        }
      } catch (error) {
        console.error("🚨 UserContext: Erro ao verificar sessão inicial:", error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };
    
    checkInitialSession();
    
    return () => {
      console.log("🧹 UserContext: Removendo listener de autenticação");
      subscription.unsubscribe();
      authListenerSet.current = false;
    };
  }, []); // IMPORTANTE: Array vazio - executar apenas uma vez
  
  // Função para atualizar usuário
  const updateUser = useCallback((updatedUser: Partial<User>) => {
    if (!user) {
      console.log("⚠️ UserContext: Tentativa de atualizar usuário inexistente");
      return;
    }
    
    setUser(prev => {
      if (!prev) return null;
      console.log("🔄 UserContext: Atualizando usuário:", Object.keys(updatedUser));
      return { ...prev, ...updatedUser };
    });
  }, [user]);

  // Função de login
  const login = useCallback(async (email: string, name: string) => {
    logger.sensitive("UserContext: Login manual", { email });
    
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
    
    // Verificar assinatura após login
    setTimeout(() => {
      if (isMounted.current && !isCheckingSubscription.current) {
        checkSubscriptionStatus();
      }
    }, 1500);
  }, [checkSubscriptionStatus]);

  // Função de logout
  const logout = useCallback(async () => {
    console.log("👋 UserContext: Fazendo logout");
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("🚨 UserContext: Erro no logout:", error);
    }
  }, []);

  // Função para definir plano
  const setPlan = useCallback((plan: SubscriptionPlan) => {
    if (!user) {
      console.log("⚠️ UserContext: Tentativa de definir plano para usuário inexistente");
      return;
    }
    
    console.log("📋 UserContext: Definindo plano:", plan);
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        plan,
        messageLimit: getMessageLimitByPlan(plan)
      };
    });
  }, [user]);

  // Memoizar o valor do contexto para evitar re-renders desnecessários
  const contextValue = useMemo(() => ({
    user,
    updateUser,
    setPlan,
    logout,
    login,
    isLoading,
    checkSubscriptionStatus
  }), [user, updateUser, setPlan, logout, login, isLoading, checkSubscriptionStatus]);

  return (
    <UserContext.Provider value={contextValue}>
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
