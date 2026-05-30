import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiRequest } from '../api/client';

type UserProfile = {
  sub: number;
  username: string;
  roles: string[];
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
};

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  authedRequest: <T>(
    path: string,
    options?: RequestInit,
  ) => Promise<T>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    accessToken: null,
    refreshToken: null,
    user: null,
  });

  const setTokens = useCallback((accessToken: string, refreshToken: string) => {
    setState((prev) => ({ ...prev, accessToken, refreshToken }));
  }, []);

  const loadProfile = useCallback(async (accessToken: string) => {
    const profile = await apiRequest<UserProfile>('/v1/auth/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    setState((prev) => ({ ...prev, user: profile }));
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      const tokens = await apiRequest<{ access_token: string; refresh_token: string }>(
        '/v1/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        },
      );
      setTokens(tokens.access_token, tokens.refresh_token);
      await loadProfile(tokens.access_token);
    },
    [loadProfile, setTokens],
  );

  const refresh = useCallback(async () => {
    if (!state.refreshToken) {
      throw new Error('Missing refresh token');
    }
    const tokens = await apiRequest<{ access_token: string; refresh_token: string }>(
      '/v1/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken: state.refreshToken }),
      },
    );
    setTokens(tokens.access_token, tokens.refresh_token);
    await loadProfile(tokens.access_token);
    return tokens.access_token;
  }, [loadProfile, setTokens, state.refreshToken]);

  const logout = useCallback(async () => {
    if (state.accessToken) {
      try {
        await apiRequest('/v1/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${state.accessToken}` },
        });
      } catch {
        // ignore
      }
    }
    setState({ accessToken: null, refreshToken: null, user: null });
  }, [state.accessToken]);

  const authedRequest = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      if (!state.accessToken) {
        throw new Error('Missing access token');
      }

      try {
        return await apiRequest<T>(path, {
          ...options,
          headers: {
            ...(options.headers ?? {}),
            Authorization: `Bearer ${state.accessToken}`,
          },
        });
      } catch (error) {
        if ((error as { status?: number }).status === 401) {
          const nextToken = await refresh();
          return apiRequest<T>(path, {
            ...options,
            headers: {
              ...(options.headers ?? {}),
              Authorization: `Bearer ${nextToken}`,
            },
          });
        }
        throw error;
      }
    },
    [refresh, state.accessToken],
  );

  const value = useMemo(
    () => ({ ...state, login, logout, authedRequest }),
    [state, login, logout, authedRequest],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
