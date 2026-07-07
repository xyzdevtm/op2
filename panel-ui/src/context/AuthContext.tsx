import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../config/api';

interface UserGameAccount {
  username: string;
  playerId?: string;
  publicId?: string;
  persistentId?: string;
  clanTag?: string;
  isPrimary?: boolean;
}

interface UserStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  kda: number;
}

interface User {
  _id: string;
  phoneNumber: string;
  phone?: string;
  username: string;
  displayName?: string;
  email?: string;
  persistentId?: string;
  rank?: { current: string; elo: number; peakElo: number };
  wallet?: { balance: number };
  stats?: UserStats;
  gameAccounts?: UserGameAccount[];
  playerId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (tokens: any, userData: User) => void;
  gameLogin: (gameToken: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  gameLogin: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether we just did a fresh login — skip /auth/me verification
  // since the server already validated credentials and returned user data.
  const [freshLogin, setFreshLogin] = useState(false);

  useEffect(() => {
    if (freshLogin) {
      setFreshLogin(false);
      setLoading(false);
      return;
    }
    // Check if user is logged in via session
    api
      .get('/auth/me')
      .then((res) => {
        const raw = res.data.user || res.data;
        // Normalize: backend sends "phone", frontend expects "phoneNumber"
        if (raw.phone && !raw.phoneNumber) raw.phoneNumber = raw.phone;
        setUser(raw);
      })
      .catch(() => {
        // Not logged in
      })
      .finally(() => setLoading(false));
  }, [freshLogin]);

  const login = (tokens: any, userData: User) => {
    // Normalize phone field
    if ((userData as any).phone && !userData.phoneNumber) {
      userData.phoneNumber = (userData as any).phone;
    }
    // Our backend uses session-based auth, no tokens needed
    // Store user data for the panel UI
    localStorage.setItem('panel_user', JSON.stringify(userData));
    setUser(userData);
    setFreshLogin(true);
  };

  const gameLogin = async (gameToken: string) => {
    const panelSecret = import.meta.env.VITE_PANEL_GAME_SECRET || 'dev-panel-secret';
    const res = await fetch('/auth/game-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-game-token': gameToken,
        'x-panel-secret': panelSecret,
      },
    });
    if (!res.ok) {
      throw new Error('Game login failed');
    }
    const data = await res.json();
    // game-login returns the user object directly (not wrapped in .user)
    const userData = data.user || data;
    login(data, userData);
  };

  const logout = () => {
    localStorage.removeItem('panel_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        gameLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
