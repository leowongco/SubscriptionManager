import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { api, setUnauthorizedHandler } from '@/lib/api';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
    status: AuthStatus;
    username: string | null;
    login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<AuthStatus>('loading');
    const [username, setUsername] = useState<string | null>(null);

    useEffect(() => {
        // API 呼叫途中 session 過期（例如久放分頁後 cookie 到期）時，任何 fetch 收到 401
        // 都會呼叫這裡，直接把畫面切回登入頁，而不用每個頁面各自處理。
        setUnauthorizedHandler(() => {
            setStatus('unauthenticated');
            setUsername(null);
        });
        return () => setUnauthorizedHandler(null);
    }, []);

    useEffect(() => {
        api.getAuthStatus()
            .then(({ authenticated, username }) => {
                setStatus(authenticated ? 'authenticated' : 'unauthenticated');
                setUsername(username);
            })
            .catch(() => setStatus('unauthenticated'));
    }, []);

    const login = useCallback(async (u: string, p: string) => {
        const result = await api.login(u, p);
        if (result.ok) {
            setStatus('authenticated');
            setUsername(u);
        }
        return result;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } finally {
            setStatus('unauthenticated');
            setUsername(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ status, username, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
