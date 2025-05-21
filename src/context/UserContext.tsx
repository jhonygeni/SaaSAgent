
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, SubscriptionPlan } from '../types';
import { getMessageLimitByPlan } from '../lib/utils';
import { supabase } from '@/integrations/supabase/client';

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
  
  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const supabaseUser = session.user;
      if (!supabaseUser) return;
      
      // Call check-subscription edge function
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        return;
      }
      
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
          setUser(newUser);
        }
        // If we already have user data, just update the plan
        else if (user && data.plan && data.plan !== user.plan) {
          setPlan(data.plan as SubscriptionPlan);
        }
      }
    } catch (err) {
      console.error('Failed to check subscription status:', err);
    }
  }, [user]);
  
  // Listen for auth state changes
  useEffect(() => {
    setIsLoading(true);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Get user data from session
          const supabaseUser = session.user;
          if (!supabaseUser) return;
          
          // Create new user object
          const newUser: User = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
            plan: 'free',
            messageCount: 0,
            messageLimit: getMessageLimitByPlan('free'),
            agents: [],
          };
          
          setUser(newUser);
          
          // Check subscription status
          setTimeout(() => {
            checkSubscriptionStatus();
          }, 0);
        }
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // Check initial session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const supabaseUser = session.user;
        
        // Create new user object
        const newUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email || '',
          name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
          plan: 'free',
          messageCount: 0,
          messageLimit: getMessageLimitByPlan('free'),
          agents: [],
        };
        
        setUser(newUser);
        
        // Check subscription status
        setTimeout(() => {
          checkSubscriptionStatus();
        }, 0);
      }
      
      setIsLoading(false);
    };
    
    checkSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
    
    // Check subscription status after login
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
