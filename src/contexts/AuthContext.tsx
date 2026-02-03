import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type UserRole = 'admin' | 'viewer' | 'editor' | 'reviewer' | 'approver' | 'auditor';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface MfaEnrollmentData {
  factorId: string;
  qrCode: string;
  secret: string;
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
  // MFA
  mfaRequired: boolean;
  mfaEnrollmentRequired: boolean;
  mfaCheckPending: boolean;
  mfaFactorId: string | null;
  enrollmentData: MfaEnrollmentData | null;
  verifyMfa: (code: string) => Promise<{ error: string | null }>;
  completeMfaEnrollment: (code: string) => Promise<{ error: string | null }>;
  cancelMfa: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // MFA state
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaEnrollmentRequired, setMfaEnrollmentRequired] = useState(false);
  const [mfaCheckPending, setMfaCheckPending] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<MfaEnrollmentData | null>(null);

  // Ref to track if MFA operations should be cancelled
  const mfaCancelledRef = useRef(false);

  // Helper to clear all Supabase cached data from localStorage
  const clearSupabaseCache = () => {
    // Clear all Supabase-related localStorage items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log('Clearing localStorage key:', key);
      localStorage.removeItem(key);
    });
  };

  // Helper to reset all auth state
  const resetAuthState = () => {
    setUser(null);
    setMfaRequired(false);
    setMfaEnrollmentRequired(false);
    setMfaCheckPending(false);
    setMfaFactorId(null);
    setEnrollmentData(null);
    setLoading(false);
  };

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

  // Check MFA status and handle enrollment/challenge
  const checkMfaStatus = async () => {
    setMfaCheckPending(true);
    try {
      // Check if cancelled before starting
      if (mfaCancelledRef.current) {
        console.log('MFA check cancelled before start');
        return;
      }

      console.log('Checking MFA status...');
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

      // Check if cancelled after listFactors
      if (mfaCancelledRef.current) {
        console.log('MFA check cancelled after listFactors');
        return;
      }

      if (factorsError) {
        console.error('Error listing MFA factors:', factorsError);
        setMfaCheckPending(false);
        return;
      }

      const totpFactors = factorsData?.totp || [];
      const verifiedFactors = totpFactors.filter(f => f.status === 'verified');
      const unverifiedFactors = totpFactors.filter(f => (f.status as string) !== 'verified');

      console.log('MFA factors found:', totpFactors.length, 'verified:', verifiedFactors.length, 'unverified:', unverifiedFactors.length);

      if (verifiedFactors.length === 0) {
        // No verified MFA - need to enroll or complete enrollment

        // First, clean up any unverified factors to avoid conflicts
        for (const factor of unverifiedFactors) {
          if (mfaCancelledRef.current) {
            console.log('MFA check cancelled during unenroll loop');
            return;
          }
          console.log('Removing unverified factor:', factor.id);
          try {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          } catch (err) {
            console.error('Error removing unverified factor:', err);
          }
        }

        // Check if cancelled before enrollment
        if (mfaCancelledRef.current) {
          console.log('MFA check cancelled before enrollment');
          return;
        }

        // Now start fresh enrollment
        console.log('No verified MFA factors, starting enrollment');
        await startMfaEnrollment();
      } else {
        // MFA enrolled - require verification
        if (!mfaCancelledRef.current) {
          console.log('MFA factor found, requiring verification');
          setMfaRequired(true);
          setMfaFactorId(verifiedFactors[0].id);
        }
      }
    } catch (err) {
      console.error('Error checking MFA status:', err);
    } finally {
      if (!mfaCancelledRef.current) {
        setMfaCheckPending(false);
      }
    }
  };

  // Start MFA enrollment process
  const startMfaEnrollment = async () => {
    try {
      // Check if cancelled before starting
      if (mfaCancelledRef.current) {
        console.log('MFA enrollment cancelled before start');
        return;
      }

      console.log('Starting MFA enrollment...');
      // Use a unique friendly name to avoid conflicts
      const friendlyName = `Authenticator-${Date.now()}`;
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName
      });

      // Check if cancelled after enroll
      if (mfaCancelledRef.current) {
        console.log('MFA enrollment cancelled after enroll call');
        return;
      }

      if (error) {
        console.error('MFA enrollment error:', error);
        return;
      }

      if (data) {
        console.log('MFA enrollment started, QR code generated');
        setEnrollmentData({
          factorId: data.id,
          qrCode: data.totp.qr_code,
          secret: data.totp.secret
        });
        setMfaEnrollmentRequired(true);
      }
    } catch (err) {
      console.error('Error starting MFA enrollment:', err);
    }
  };

  // Complete MFA enrollment with verification code
  const completeMfaEnrollment = async (code: string): Promise<{ error: string | null }> => {
    if (!enrollmentData) {
      return { error: 'No enrollment in progress' };
    }

    try {
      // Challenge the factor first
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.factorId
      });

      if (challengeError) {
        return { error: challengeError.message };
      }

      // Verify the challenge with the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollmentData.factorId,
        challengeId: challengeData.id,
        code
      });

      if (verifyError) {
        return { error: verifyError.message };
      }

      // Success - clear enrollment state
      setMfaEnrollmentRequired(false);
      setEnrollmentData(null);

      // Fetch user profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        fetchUserProfileAsync(session.user.email);
      }

      return { error: null };
    } catch (err) {
      return { error: 'Failed to complete MFA enrollment' };
    }
  };

  // Verify MFA code during login
  const verifyMfa = async (code: string): Promise<{ error: string | null }> => {
    if (!mfaFactorId) {
      return { error: 'No MFA factor to verify' };
    }

    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId
      });

      if (challengeError) {
        return { error: challengeError.message };
      }

      // Verify the challenge
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challengeData.id,
        code
      });

      if (verifyError) {
        return { error: verifyError.message };
      }

      // Success - clear MFA state
      setMfaRequired(false);
      setMfaFactorId(null);

      // Fetch user profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        fetchUserProfileAsync(session.user.email);
      }

      return { error: null };
    } catch (err) {
      return { error: 'Failed to verify MFA code' };
    }
  };

  // Cancel MFA and sign out
  const cancelMfa = async () => {
    console.log('Cancelling MFA...');
    // Set cancellation flag immediately to stop any pending MFA operations
    mfaCancelledRef.current = true;

    // Clear all state immediately
    resetAuthState();

    // Clear Supabase localStorage cache
    clearSupabaseCache();

    // Sign out globally to invalidate session on server
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('Sign out completed');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Reset cancellation flag on init
        mfaCancelledRef.current = false;

        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', session ? 'has session' : 'no session');

        if (!isMounted) return;

        // Check if cancelled while waiting for session
        if (mfaCancelledRef.current) {
          console.log('Init cancelled');
          return;
        }

        if (session?.user) {
          // Check MFA assurance level
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          const currentLevel = aalData?.currentLevel;

          console.log('Current AAL:', currentLevel);

          // Check if cancelled while waiting for AAL
          if (mfaCancelledRef.current) {
            console.log('Init cancelled after AAL check');
            return;
          }

          if (currentLevel === 'aal2') {
            // Fully authenticated with MFA
            setUserFromSession(session);
            fetchUserProfileAsync(session.user.email || '');
          } else {
            // Need to check MFA status - set pending BEFORE setting user
            setMfaCheckPending(true);
            setUserFromSession(session);
            await checkMfaStatus();
          }
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
      console.log('Auth event:', event, 'cancelled:', mfaCancelledRef.current);
      if (!isMounted) return;

      // If MFA was cancelled, ignore SIGNED_IN events until we see SIGNED_OUT
      if (mfaCancelledRef.current && event === 'SIGNED_IN') {
        console.log('Ignoring SIGNED_IN event - MFA was cancelled');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Set pending BEFORE setting user to prevent race condition
        setMfaCheckPending(true);
        setUserFromSession(session);
        // Check MFA status after sign in
        await checkMfaStatus();
      } else if (event === 'SIGNED_OUT') {
        console.log('SIGNED_OUT event received');
        // Reset cancellation flag on sign out
        mfaCancelledRef.current = false;
        // Clear all auth state
        resetAuthState();
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Reset cancellation flag for new sign-in attempt
      mfaCancelledRef.current = false;

      // Set MFA check pending before attempting sign in
      setMfaCheckPending(true);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMfaCheckPending(false);
        return { error: error.message };
      }

      // Don't clear mfaCheckPending here - let checkMfaStatus handle it
      return { error: null };
    } catch (error) {
      setMfaCheckPending(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    // Set cancellation flag to stop any pending MFA operations
    mfaCancelledRef.current = true;

    // Clear all state
    resetAuthState();

    // Clear Supabase localStorage cache
    clearSupabaseCache();

    // Sign out globally
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('Sign out completed');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  // Permission helpers - only grant permissions if MFA is complete
  const mfaComplete = !mfaRequired && !mfaEnrollmentRequired && !mfaCheckPending;
  const canView = user !== null && mfaComplete;
  const canEdit = mfaComplete && (user?.role === 'admin' || user?.role === 'editor');
  const canReview = mfaComplete && (user?.role === 'admin' || user?.role === 'reviewer');
  const canApprove = mfaComplete && (user?.role === 'admin' || user?.role === 'approver');
  const isAdmin = mfaComplete && user?.role === 'admin';

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
        // MFA
        mfaRequired,
        mfaEnrollmentRequired,
        mfaCheckPending,
        mfaFactorId,
        enrollmentData,
        verifyMfa,
        completeMfaEnrollment,
        cancelMfa,
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
