'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ensureProfileExists } from '@/lib/supabase/ensure-profile';
import type { User } from '@supabase/supabase-js';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  ready: boolean; // true when auth check is complete (user may or may not exist)
  authError: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  ready: false,
  authError: null,
  retry: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

function humanizeAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (/anonymous_provider_disabled|anonymous sign-ins are disabled/i.test(msg)) {
    return '익명 로그인이 비활성화되어 있습니다. Supabase 대시보드 > Authentication > Providers에서 Anonymous sign-ins를 켜주세요.';
  }
  if (/Failed to fetch|NetworkError/i.test(msg)) {
    return '네트워크 연결을 확인해주세요.';
  }
  return `인증 초기화 실패: ${msg}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const initAuth = useCallback(async () => {
    const supabase = createClient();
    setAuthError(null);

    try {
      const { data: { user: existingUser } } = await supabase.auth.getUser();

      if (existingUser) {
        setUser(existingUser);
        return;
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;

      if (data.user) {
        // 프로필 생성은 선택적. 실패해도 user 세션은 유지.
        try {
          await ensureProfileExists(supabase, data.user);
        } catch (profileErr) {
          console.warn('Profile creation deferred:', profileErr);
        }
        setUser(data.user);
      }
    } catch (err) {
      console.error('Auto-auth failed:', err);
      setAuthError(humanizeAuthError(err));
    } finally {
      setLoading(false);
      setReady(true);
    }
  }, []);

  useEffect(() => {
    initAuth();

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [initAuth, attempt]);

  const retry = useCallback(() => {
    setLoading(true);
    setReady(false);
    setAttempt((n) => n + 1);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, ready, authError, retry }}>
      {children}
    </AuthContext.Provider>
  );
}
