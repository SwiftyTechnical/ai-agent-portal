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

  // Tracks whether we've already handled the initial auth check
  const mfaHandledRef = useRef(false);
  // Tracks whether user explicitly signed out / cancelled
  const signedOutRef = useRef(false);

  // Helper to clear all Supabase cached data from localStorage
  const clearSupabaseCache = () => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
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

  // Handle MFA for a session that is at aal1 (not yet MFA-verified)
  const handleMfaForSession = async () => {
    if (signedOutRef.current) return;

    setMfaCheckPending(true);
    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();

      if (signedOutRef.current) return;

      if (factorsError) {
        console.error('Error listing MFA factors:', factorsError);
        // Can't determine MFA status - sign out for safety
        await forceSignOut();
        return;
      }

      const totpFactors = factorsData?.totp || [];
      const verifiedFactors = totpFactors.filter(f => f.status === 'verified');
      const unverifiedFactors = totpFactors.filter(f => (f.status as string) !== 'verified');

      console.log('MFA factors:', totpFactors.length, 'verified:', verifiedFactors.length);

      if (verifiedFactors.length > 0) {
        // User has MFA enrolled - show the code entry screen immediately
        if (!signedOutRef.current) {
          setMfaRequired(true);
          setMfaFactorId(verifiedFactors[0].id);
          setMfaCheckPending(false);
        }
      } else {
        // No verified MFA - need to enroll
        // Clean up unverified factors first
        for (const factor of unverifiedFactors) {
          if (signedOutRef.current) return;
          try {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          } catch (err) {
            console.error('Error removing unverified factor:', err);
          }
        }

        if (signedOutRef.current) return;

        // Start fresh enrollment
        await startMfaEnrollment();
        if (!signedOutRef.current) {
          setMfaCheckPending(false);
        }
      }
    } catch (err) {
      console.error('Error checking MFA status:', err);
      if (!signedOutRef.current) {
        await forceSignOut();
      }
    }
  };

  // Start MFA enrollment process
  const startMfaEnrollment = async () => {
    if (signedOutRef.current) return;

    try {
      const friendlyName = `Authenticator-${Date.now()}`;
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName
      });

      if (signedOutRef.current) return;

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

  // Force sign out and reset everything
  const forceSignOut = async () => {
    signedOutRef.current = true;
    resetAuthState();
    clearSupabaseCache();
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignore errors
    }
  };

  // Complete MFA enrollment with verification code
  const completeMfaEnrollment = async (code: string): Promise<{ error: string | null }> => {
    if (!enrollmentData) {
      return { error: 'No enrollment in progress' };
    }

    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollmentData.factorId
      });

      if (challengeError) {
        return { error: challengeError.message };
      }

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
      setMfaCheckPending(false);

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
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId
      });

      if (challengeError) {
        return { error: challengeError.message };
      }

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
    console.log('Cancelling MFA - signing out');
    await forceSignOut();
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        signedOutRef.current = false;
        mfaHandledRef.current = false;

        const { data: { session } } = await supabase.auth.getSession();
        console.log('Session check:', session ? 'has session' : 'no session');

        if (!isMounted || signedOutRef.current) return;

        if (session?.user) {
          // Check MFA assurance level
          const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          const currentLevel = aalData?.currentLevel;
          const nextLevel = aalData?.nextLevel;

          console.log('Current AAL:', currentLevel, 'Next AAL:', nextLevel);

          if (!isMounted || signedOutRef.current) return;

          if (currentLevel === 'aal2') {
            // Fully authenticated with MFA - go to dashboard
            setUserFromSession(session);
            fetchUserProfileAsync(session.user.email || '');
            mfaHandledRef.current = true;
          } else if (nextLevel === 'aal2' || nextLevel === 'aal1') {
            // Session exists but MFA not verified yet
            setUserFromSession(session);
            mfaHandledRef.current = true;
            await handleMfaForSession();
          } else {
            // No MFA requirement detected - just log in
            setUserFromSession(session);
            fetchUserProfileAsync(session.user.email || '');
            mfaHandledRef.current = true;
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
      console.log('Auth event:', event, 'signedOut:', signedOutRef.current, 'mfaHandled:', mfaHandledRef.current);
      if (!isMounted) return;

      // If we explicitly signed out, ignore all events except from a new signIn call
      if (signedOutRef.current) {
        console.log('Ignoring event - user signed out');
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Only process if we haven't already handled MFA (avoids duplicate handling from initAuth)
        if (!mfaHandledRef.current) {
          mfaHandledRef.current = true;
          setUserFromSession(session);
          await handleMfaForSession();
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        // Token refresh - just update session, don't re-trigger MFA
        console.log('Token refreshed - session still valid');
        // If we're already fully authenticated, just keep going
      } else if (event === 'SIGNED_OUT') {
        console.log('SIGNED_OUT event received');
        mfaHandledRef.current = false;
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
      // Reset flags for new sign-in attempt
      signedOutRef.current = false;
      mfaHandledRef.current = false;

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

      // Don't clear mfaCheckPending here - let handleMfaForSession handle it
      return { error: null };
    } catch (error) {
      setMfaCheckPending(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    console.log('Signing out...');
    await forceSignOut();
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
