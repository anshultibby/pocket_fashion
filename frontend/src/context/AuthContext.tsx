import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import api from '../api/axios';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const login = (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setIsAuthenticated(true);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
  };

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await api.get('/api/auth/verify');
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
