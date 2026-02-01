import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'viewer' | 'editor' | 'reviewer' | 'approver';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  canView: boolean;
  canEdit: boolean;
  canReview: boolean;
  canApprove: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to set user from session immediately (no DB lookup)
  const setUserFromSession = (session: { user: { id: string; email?: string } }) => {
    const email = session.user.email || '';
    setUser({
      id: session.user.id,
      email: email,
      name: email.split('@')[0] || 'User',
      role: 'admin', // Default to admin - profile lookup happens async
    });
    setLoading(false);
  };

  // Async profile fetch - updates role after login
  const fetchUserProfileAsync = async (email: string) => {
    try {
      // Race between query and timeout
      const result = await Promise.race([
        supabase.from('users').select('*').eq('email', email).single(),
        new Promise<null>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);

      if (result && 'data' in result && result.data) {
        console.log('Profile loaded:', result.data.name, result.data.role);
        setUser(prev => prev ? {
          ...prev,
          id: result.data.id,
          name: result.data.name,
          role: result.data.role as UserRole,
        } : null);
      }
    } catch (err) {
      console.log('Profile fetch skipped (timeout or error)');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', session ? 'has session' : 'no session');

        if (!isMounted) return;

        if (session?.user) {
          // Immediately set user from session - don't wait for DB
          setUserFromSession(session);
          // Fetch profile async to get correct role
          fetchUserProfileAsync(session.user.email || '');
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth init error:', err);
        if (isMounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session?.user) {
        setUserFromSession(session);
        fetchUserProfileAsync(session.user.email || '');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  // Permission helpers
  const canView = user !== null;
  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const canReview = user?.role === 'admin' || user?.role === 'reviewer';
  const canApprove = user?.role === 'admin' || user?.role === 'approver';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        canView,
        canEdit,
        canReview,
        canApprove,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
