import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Auto-populate profile from Google OAuth
        if (event === 'SIGNED_IN' && session?.user) {
          const meta = session.user.user_metadata;
          if (meta?.avatar_url || meta?.full_name) {
            setTimeout(async () => {
              try {
                const { data: profile } = await supabase
                  .from('profiles')
                  .select('avatar_url, full_name, username')
                  .eq('user_id', session.user.id)
                  .single();
                if (profile) {
                  const updates: Record<string, string> = {};
                  if (!profile.avatar_url && meta.avatar_url) updates.avatar_url = meta.avatar_url;
                  if (!profile.full_name && meta.full_name) updates.full_name = meta.full_name;
                  if (!profile.username && meta.email) {
                    const base = meta.email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '').substring(0, 20);
                    if (base.length >= 5) updates.username = base;
                  }
                  if (Object.keys(updates).length > 0) {
                    await supabase.from('profiles').update(updates).eq('user_id', session.user.id);
                  }
                }
              } catch (e) { console.error('Profile sync error:', e); }
            }, 1000);
          }
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
