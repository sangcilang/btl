import { useState } from "react";
import { clearCurrentSession, getCurrentSession, saveCurrentSession } from "../lib/auth";
import type { AuthSession, User } from "../types";

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(() => getCurrentSession());

  function login(nextSession: AuthSession) {
    saveCurrentSession(nextSession);
    setSession(nextSession);
  }

  function logout() {
    clearCurrentSession();
    setSession(null);
  }

  return {
    user: (session?.user ?? null) as User | null,
    login,
    logout
  };
}
