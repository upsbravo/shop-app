"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { GoogleAuthProvider, onIdTokenChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { clientAuth, clientDb, firebaseReady } from "@/lib/firebase";
import type { Permissions } from "@/lib/permissions";

interface Session {
  /** True while the first auth check is running. */
  loading: boolean;
  user: User | null;
  shopId: string | null;
  roleId: string | null;
  superAdmin: boolean;
  /** The signed-in user's role permissions, used only to hide UI. */
  permissions: Permissions | null;
  signIn: () => Promise<void>;
  signOutNow: () => Promise<void>;
  /** Reloads the token after the server changes this user's claims. */
  refresh: () => Promise<void>;
  /** Calls a server route with the user's ID token attached. */
  api: (path: string, init?: RequestInit) => Promise<Response>;
}

const SessionContext = createContext<Session | null>(null);

export function useSession(): Session {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used inside AuthProvider");
  return value;
}

interface Claims {
  shopId: string | null;
  roleId: string | null;
  superAdmin: boolean;
}

const NO_CLAIMS: Claims = { shopId: null, roleId: null, superAdmin: false };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(firebaseReady);
  const [user, setUser] = useState<User | null>(null);
  const [claims, setClaims] = useState<Claims>(NO_CLAIMS);
  const [permissions, setPermissions] = useState<Permissions | null>(null);

  useEffect(() => {
    if (!firebaseReady) return;
    return onIdTokenChanged(clientAuth(), async (next) => {
      if (!next) {
        setUser(null);
        setClaims(NO_CLAIMS);
        setPermissions(null);
        setLoading(false);
        return;
      }
      const result = await next.getIdTokenResult();
      const shopId = typeof result.claims.shopId === "string" ? result.claims.shopId : null;
      const roleId = typeof result.claims.roleId === "string" ? result.claims.roleId : null;
      let rolePermissions: Permissions | null = null;
      if (shopId && roleId) {
        try {
          const snapshot = await getDoc(doc(clientDb(), "shops", shopId, "roles", roleId));
          rolePermissions = (snapshot.data()?.permissions as Permissions | undefined) ?? null;
        } catch {
          rolePermissions = null;
        }
      }
      setUser(next);
      setClaims({ shopId, roleId, superAdmin: result.claims.superAdmin === true });
      setPermissions(rolePermissions);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    await signInWithPopup(clientAuth(), new GoogleAuthProvider());
  }, []);

  const signOutNow = useCallback(async () => {
    await signOut(clientAuth());
  }, []);

  const refresh = useCallback(async () => {
    // Forces a new token, which fires onIdTokenChanged with the new claims.
    await clientAuth().currentUser?.getIdToken(true);
  }, []);

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    const current = clientAuth().currentUser;
    if (!current) throw new Error("Sign in first.");
    const token = await current.getIdToken();
    const headers = new Headers(init.headers);
    headers.set("authorization", `Bearer ${token}`);
    if (init.body) headers.set("content-type", "application/json");
    return fetch(path, { ...init, headers });
  }, []);

  const value = useMemo<Session>(
    () => ({ loading, user, ...claims, permissions, signIn, signOutNow, refresh, api }),
    [loading, user, claims, permissions, signIn, signOutNow, refresh, api],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
