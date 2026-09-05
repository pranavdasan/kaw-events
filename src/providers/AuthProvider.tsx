import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { onAuthStateChanged, signOut, User, getIdTokenResult } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextValue {
  authUser: User | null;
  isAdmin: boolean;
  authLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
  }, []);

  useEffect(() => {
    const allowedUids = import.meta.env.VITE_ADMIN_UIDS?.split(',').map((u: string) => u.trim()) || [];

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthLoading(false);

      if (user) {
        try {
          const tokenResult = await getIdTokenResult(user, true);
          setIsAdmin(tokenResult.claims.admin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = useMemo(() => ({
    authUser,
    isAdmin,
    authLoading,
    signOut: handleSignOut,
  }), [authUser, isAdmin, authLoading, handleSignOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}