import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { adminApi, clearAuthTokens, getAccessToken } from '@/services/api';
import { setSessionToken } from '@/lib/convexClient';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  isStaff: boolean;
  isSuperuser: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const userData = await adminApi.getCurrentUser() as User;
          if (userData?.isStaff) {
            setUser(userData);
          } else {
            clearAuthTokens();
          }
        } catch {
          clearAuthTokens();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await adminApi.login(email, password);
    setSessionToken(response.token);

    const userData = await adminApi.getCurrentUser() as User;
    if (!userData?.isStaff) {
      clearAuthTokens();
      throw new Error('Access denied. Admin privileges required.');
    }

    setUser(userData);
  };

  const logout = () => {
    clearAuthTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
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
