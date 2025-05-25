import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { diagnostic, logStep, logAsyncStep } from '@/utils/diagnostic';

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
  
  console.log('👤 UserProvider: Inicializando...');
  
  // Função auxiliar para criar um usuário com plano padrão
  const createUserWithDefaultPlan = (supabaseUser: any, defaultPlan: SubscriptionPlan = 'free') => {
    return logStep('Create User With Default Plan', () => {
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
      setUser(newUser);
      return newUser;
    });
  };
  
  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
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
          if (!user && supabaseUser) {
            createUserWithDefaultPlan(supabaseUser);
          }
          return;
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
              messageCount: 0,
              messageLimit: getMessageLimitByPlan(data.plan || 'free'),
              agents: [],
            };
            console.log("Criando novo usuário no contexto:", newUser);
            setUser(newUser);
          }
          // If we already have user data, just update the plan
          else if (user && data.plan && data.plan !== user.plan) {
            console.log(`Atualizando plano de ${user.plan} para ${data.plan}`);
            setPlan(data.plan as SubscriptionPlan);
          }
        }
      } catch (invokeError) {
        console.error('Failed to invoke check-subscription function:', invokeError);
        
        // Em caso de erro na invocação, garantimos que o usuário tenha um plano básico
        if (!user && supabaseUser) {
          createUserWithDefaultPlan(supabaseUser);
        }
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
    }
  }, [user]);
  
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
          createUserWithDefaultPlan(supabaseUser);
          
          // Check subscription status after delay to ensure auth is complete
          setTimeout(() => {
            checkSubscriptionStatus();
          }, 1000);
        }
        
        if (event === 'SIGNED_OUT') {
          console.log("Usuário deslogado");
          setUser(null);
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
        createUserWithDefaultPlan(supabaseUser);
        
        // Check subscription status after delay
        setTimeout(() => {
          checkSubscriptionStatus();
        }, 1000);
      } else {
        console.log("Nenhuma sessão existente encontrada");
      }
      
      setIsLoading(false);
    };
    
    checkSession();
    
    return () => {
      console.log("Removendo listener de autenticação");
      subscription.unsubscribe();
    };
  }, [checkSubscriptionStatus]);

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
    setTimeout(() => {
      checkSubscriptionStatus();
    }, 1000);
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
