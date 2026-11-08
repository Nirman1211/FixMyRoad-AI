import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Record<string, any>) => Promise<void>;
  logout: () => void;
  demoLogin: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('fixmyroad_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
        } catch (err) {
          console.warn('Session expired or invalid token:', err);
          logout();
        }
      }
      setIsLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);
    const data = await api.login(formData);
    localStorage.setItem('fixmyroad_token', data.access_token);
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (userData: Record<string, any>) => {
    await api.register(userData);
    await login(userData.email, userData.password);
  };

  const logout = () => {
    localStorage.removeItem('fixmyroad_token');
    setToken(null);
    setUser(null);
  };

  const demoLogin = async (role: UserRole) => {
    const credentials = {
      ADMIN: { email: 'admin@fixmyroad.org', pass: 'Admin@2026' },
      OFFICER: { email: 'officer@fixmyroad.org', pass: 'Officer@2026' },
      CITIZEN: { email: 'citizen@fixmyroad.org', pass: 'Citizen@2026' },
    };
    const cred = credentials[role];
    if (cred) {
      await login(cred.email, cred.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        demoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

