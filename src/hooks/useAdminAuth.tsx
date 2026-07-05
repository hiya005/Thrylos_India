import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  loading: boolean;
  adminLogout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Admin role check failed:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Admin role check exception:', error);
      return false;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (session?.user) {
          const isAdmin = await checkAdminRole(session.user.id);
          if (!isMounted) return;
          setIsAdminAuthenticated(isAdmin);
        } else {
          setIsAdminAuthenticated(false);
        }
      } catch (error) {
        console.error('Admin auth initialization error:', error);
        if (isMounted) setIsAdminAuthenticated(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        try {
          if (session?.user) {
            const isAdmin = await checkAdminRole(session.user.id);
            if (isMounted) setIsAdminAuthenticated(isAdmin);
          } else if (isMounted) {
            setIsAdminAuthenticated(false);
          }
        } catch (error) {
          console.error('Admin auth state change error:', error);
          if (isMounted) setIsAdminAuthenticated(false);
        } finally {
          if (isMounted) setLoading(false);
        }
      })();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const adminLogout = async () => {
    await supabase.auth.signOut();
    setIsAdminAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, loading, adminLogout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
