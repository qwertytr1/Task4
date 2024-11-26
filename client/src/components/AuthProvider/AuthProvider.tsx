import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useMemo,
} from 'react';
import { AuthContextType, AuthProviderProps } from '../../utils/interfaces';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('authToken');
    return !!token; // Проверяем наличие токена для определения статуса аутентификации
  });

  const login = (token: string | null) => {
    if (token) {
      localStorage.setItem('authToken', token);
      setIsAuthenticated(true);
    } else {
      console.error('Invalid token received. Token was not saved.');
    }
  };

  const logout = () => {
    // Удаляем токен из localStorage и обновляем состояние
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  const value = useMemo(
    () => ({ isAuthenticated, login, logout }),
    [isAuthenticated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
