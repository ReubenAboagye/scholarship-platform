"use client";

import {
  createContext, useContext, useState, useEffect, useCallback,
} from "react";

interface ImpersonationState {
  targetUserId: string | null;
  targetEmail: string | null;
  targetName: string | null;
}

interface ImpersonationContextType extends ImpersonationState {
  isImpersonating: boolean;
  startImpersonation: (userId: string, email: string, name: string | null) => void;
  stopImpersonation: () => void;
}

const ImpersonationContext = createContext<ImpersonationContextType>({
  targetUserId: null,
  targetEmail: null,
  targetName: null,
  isImpersonating: false,
  startImpersonation: () => {},
  stopImpersonation: () => {},
});

const STORAGE_KEY = "sb_admin_impersonation";

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ImpersonationState>({
    targetUserId: null,
    targetEmail: null,
    targetName: null,
  });

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.targetUserId) {
          setState({
            targetUserId: parsed.targetUserId,
            targetEmail: parsed.targetEmail ?? null,
            targetName: parsed.targetName ?? null,
          });
        }
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const startImpersonation = useCallback((userId: string, email: string, name: string | null) => {
    const next = { targetUserId: userId, targetEmail: email, targetName: name };
    setState(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const stopImpersonation = useCallback(() => {
    setState({ targetUserId: null, targetEmail: null, targetName: null });
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <ImpersonationContext.Provider
      value={{
        ...state,
        isImpersonating: !!state.targetUserId,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  return useContext(ImpersonationContext);
}
