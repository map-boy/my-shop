// FILE: src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider, OWNER_EMAIL } from '../lib/firebase';
import type { AdminRole, AdminUser } from '../lib/types';

interface AuthState {
  user: User | null;
  admin: AdminUser | null;
  role: AdminRole | null;
  isAdmin: boolean;
  isOwner: boolean;
  /** `true` while the initial auth + admin lookup is still running. */
  loading: boolean;
  /** Set when a signed-in Google account is not on the admin roster. */
  denied: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState<string | null>(null);

  /**
   * Resolves the admin record for a signed-in Google account.
   * The bootstrap owner is self-provisioned on first sign-in so the very first
   * login works against an empty database.
   */
  const resolveAdmin = async (u: User | null) => {
    if (!u?.email) {
      setAdmin(null);
      setDenied(null);
      return;
    }
    const email = u.email.toLowerCase();
    const refDoc = doc(db, 'admins', email);

    try {
      const snap = await getDoc(refDoc);

      if (!snap.exists()) {
        if (email === OWNER_EMAIL) {
          const owner: Omit<AdminUser, 'id'> = {
            email,
            name: u.displayName ?? 'Owner',
            photoURL: u.photoURL ?? '',
            role: 'owner',
            disabled: false,
            addedBy: 'system',
            addedAt: Date.now(),
            lastLogin: Date.now(),
          };
          await setDoc(refDoc, { ...owner, createdAt: serverTimestamp() }, { merge: true });
          setAdmin({ id: email, ...owner });
          setDenied(null);
          return;
        }
        setAdmin(null);
        setDenied(email);
        return;
      }

      const data = { id: email, ...(snap.data() as Omit<AdminUser, 'id'>) };

      if (data.disabled) {
        setAdmin(null);
        setDenied(email);
        return;
      }

      // The bootstrap owner can never be locked out of owner rights.
      if (email === OWNER_EMAIL) data.role = 'owner';

      setAdmin(data);
      setDenied(null);
      void setDoc(
        refDoc,
        { lastLogin: Date.now(), name: u.displayName ?? data.name, photoURL: u.photoURL ?? data.photoURL },
        { merge: true },
      );
    } catch {
      // Rules deny reading somebody else's admin doc — treat as "not an admin".
      setAdmin(null);
      setDenied(email);
    }
  };

  useEffect(() => {
    // Completes a redirect-based sign-in (used when pop-ups are blocked).
    void getRedirectResult(auth).catch(() => undefined);

    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      await resolveAdmin(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      throw err;
    }
  };

  const signOut = async () => {
    await fbSignOut(auth);
    setAdmin(null);
    setDenied(null);
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      admin,
      role: admin?.role ?? null,
      isAdmin: !!admin,
      isOwner: admin?.role === 'owner' || user?.email?.toLowerCase() === OWNER_EMAIL,
      loading,
      denied,
      signInWithGoogle,
      signOut,
      refresh: () => resolveAdmin(auth.currentUser),
    }),
    [user, admin, loading, denied],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
