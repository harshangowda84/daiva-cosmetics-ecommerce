import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<User>;
  loginWithGoogle: (googleData: { email: string; fullName?: string; googleSub?: string; profilePictureUrl?: string }) => Promise<User>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('daiva_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Background refresh profile from backend on app load
  useEffect(() => {
    if (user?.id) {
      api.getProfile(user.id)
        .then((fresh) => {
          setUser((prev) => (prev ? { ...prev, ...fresh } : fresh));
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('daiva_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('daiva_user');
    }
  }, [user]);

  const refreshUser = async () => {
    if (!user?.id) return null;
    try {
      const fresh = await api.getProfile(user.id);
      setUser((prev) => (prev ? { ...prev, ...fresh } : fresh));
      return fresh;
    } catch {
      return user;
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    try {
      const fullProfile = await api.getProfile(res.id);
      const combined = { ...res, ...fullProfile };
      setUser(combined);
      return combined;
    } catch {
      setUser(res);
      return res;
    }
  };

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    const res = await api.register({ fullName, email, password, phone });
    try {
      const fullProfile = await api.getProfile(res.id);
      const combined = { ...res, ...fullProfile };
      setUser(combined);
      return combined;
    } catch {
      setUser(res);
      return res;
    }
  };

  const loginWithGoogle = async (googleData: { email: string; fullName?: string; googleSub?: string; profilePictureUrl?: string }) => {
    const res = await api.googleAuth(googleData);
    try {
      const fullProfile = await api.getProfile(res.id);
      const combined = { ...res, ...fullProfile };
      setUser(combined);
      return combined;
    } catch {
      setUser(res);
      return res;
    }
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = async (updated: Partial<User>) => {
    if (!user) throw new Error('Not logged in');
    const res = await api.updateProfile(user.id, updated);
    const merged = { ...user, ...res };
    setUser(merged);
    return merged;
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        loginWithGoogle,
        logout,
        updateUser,
        refreshUser,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
