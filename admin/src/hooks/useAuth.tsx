import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { adminApi, setAuthTokens, clearAuthTokens, getAccessToken } from '@/services/api';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
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
          const userData = await adminApi.getCurrentUser();
          const typedUser = userData as User;
          if (typedUser.is_staff) {
            setUser(typedUser);
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
    const userData = response.user as User;

    if (!userData.is_staff) {
      throw new Error('Access denied. Admin privileges required.');
    }

    setAuthTokens(response.tokens);
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
