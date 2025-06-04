import { createContext, useContext, useState, ReactNode, useEffect, useCallback, useRef } from 'react';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { subscriptionManager } from '@/lib/subscription-manager';

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
  
  // Refs para controle de throttling e estado
  const isMounted = useRef(true);
  const lastCheckTime = useRef(0);
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCheckingRef = useRef(false);
  
  // Throttle de 5 segundos para evitar loops infinitos
  const CHECK_THROTTLE_DELAY = 5000;
  
  // Cleanup ao desmontar
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      isCheckingRef.current = false;
      
      // Limpar todos os timeouts
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      
      console.log("UserProvider desmontado, recursos limpos");
    };
  }, []);
  
  // Função auxiliar para criar um usuário com plano padrão (NÃO altera state diretamente)
  const createUserWithDefaultPlan = (supabaseUser: any, defaultPlan: SubscriptionPlan = 'free'): User => {
    const newUser: User = {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
      plan: defaultPlan,
      messageCount: 0,
      messageLimit: getMessageLimitByPlan(defaultPlan),
      agents: [],
    };
    console.log("Criando novo usuário com plano padrão:", newUser);
    return newUser;
  };
  
  // Check subscription status com throttling robusto
  const checkSubscriptionStatus = useCallback(async () => {
    // Verificar se já está executando para evitar múltiplas chamadas simultâneas
    if (isCheckingRef.current) {
      console.log("checkSubscriptionStatus já está executando, ignorando nova chamada");
      return;
    }
    
    // Verificar throttling baseado no tempo
    const now = Date.now();
    if (now - lastCheckTime.current < CHECK_THROTTLE_DELAY) {
      console.log("checkSubscriptionStatus throttled, aguardando cooldown");
      return;
    }
    
    // Verificar se o componente ainda está montado
    if (!isMounted.current) {
      console.log("Componente desmontado, cancelando verificação de assinatura");
      return;
    }
    
    isCheckingRef.current = true;
    lastCheckTime.current = now;
    
    try {
      console.log("Verificando status da assinatura...");
      
      // Get current session
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
      
      try {
        // Call check-subscription edge function
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) {
          console.error('Error checking subscription:', error);
          
          // Se há erro, mas o usuário está autenticado, garantimos que ele tenha um plano
          // IMPORTANTE: Usar state callback para evitar dependência de user
          setUser(currentUser => {
            if (!currentUser && supabaseUser) {
              return createUserWithDefaultPlan(supabaseUser);
            }
            return currentUser;
          });
          return;
        }
        
        console.log("Resposta de check-subscription:", data);
        
        if (data) {
          // Usar state callback para evitar dependência de user
          setUser(currentUser => {
            // If we have a user but no data in context yet, create it
            if (!currentUser && supabaseUser) {
              const newUser: User = {
                id: supabaseUser.id,
                email: supabaseUser.email || '',
                name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
                plan: (data.plan || 'free') as SubscriptionPlan,
                messageCount: 0,
                messageLimit: getMessageLimitByPlan(data.plan || 'free'),
                agents: [],
              };
              console.log("Criando novo usuário no contexto:", newUser);
              return newUser;
            }
            // If we already have user data, just update the plan
            else if (currentUser && data.plan && data.plan !== currentUser.plan) {
              console.log(`Atualizando plano de ${currentUser.plan} para ${data.plan}`);
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
        console.error('Failed to invoke check-subscription function:', invokeError);
        
        // Em caso de erro na invocação, garantimos que o usuário tenha um plano básico
        // IMPORTANTE: Usar state callback para evitar dependência de user
        setUser(currentUser => {
          if (!currentUser && supabaseUser) {
            return createUserWithDefaultPlan(supabaseUser);
          }
          return currentUser;
        });
      }
    } catch (err) {
      console.error('Failed to check subscription status:', err);
      
      // Tentamos obter uma sessão para criar um usuário básico mesmo com erro
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(currentUser => {
            if (!currentUser) {
              return createUserWithDefaultPlan(session.user);
            }
            return currentUser;
          });
        }
      } catch (sessionErr) {
        console.error('Failed to get session after subscription error:', sessionErr);
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, []); // IMPORTANTE: Array vazio remove dependência de user que causava loop infinito
  
  // Listen for auth state changes
  useEffect(() => {
    setIsLoading(true);
    console.log("Configurando listener de autenticação");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Evento de autenticação:", event, session ? "com sessão" : "sem sessão");
        
        if (event === 'SIGNED_IN' && session) {
          // Get user data from session
          const supabaseUser = session.user;
          if (!supabaseUser) return;
          
          console.log("Usuário logado:", supabaseUser);
          
          // Create new user object with default free plan
          const newUser = createUserWithDefaultPlan(supabaseUser);
          setUser(newUser);
          
          // Check subscription status after delay to ensure auth is complete
          // IMPORTANTE: Usar timeout para evitar execução imediata que causa loops
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
          checkTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              checkSubscriptionStatus();
            }
          }, 2000); // Aumentado para 2 segundos
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("Usuário deslogado");
          setUser(null);
          
          // Limpar timeouts pendentes
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
            checkTimeoutRef.current = null;
          }
        }
        
        setIsLoading(false);
      }
    );
    
    // Check initial session
    const checkSession = async () => {
      console.log("Verificando sessão inicial");
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Sessão existente encontrada");
        const supabaseUser = session.user;
        
        // Create new user object with default free plan
        const newUser = createUserWithDefaultPlan(supabaseUser);
        setUser(newUser);
        
        // Check subscription status after delay
        // IMPORTANTE: Usar timeout para evitar execução imediata que causa loops
        if (checkTimeoutRef.current) {
          clearTimeout(checkTimeoutRef.current);
        }
        checkTimeoutRef.current = setTimeout(() => {
          if (isMounted.current) {
            checkSubscriptionStatus();
          }
        }, 2000); // Aumentado para 2 segundos
      } else {
        console.log("Nenhuma sessão existente encontrada");
      }
      
      setIsLoading(false);
    };
    
    checkSession();
    
    return () => {
      console.log("Removendo listener de autenticação");
      subscription.unsubscribe();
      
      // Cleanup timeouts e refs
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current);
        checkTimeoutRef.current = null;
      }
      isMounted.current = false;
    };
  }, []); // IMPORTANTE: Array vazio remove dependência de checkSubscriptionStatus

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
    
    // Check subscription status after login with delay
    // IMPORTANTE: Usar timeout controlado para evitar loops
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    checkTimeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        checkSubscriptionStatus();
      }
    }, 2000); // Aumentado para 2 segundos
  };

  const logout = async () => {
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
