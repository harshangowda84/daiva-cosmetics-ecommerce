import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

export const getActiveSessionUser = (): User | null => {
  try {
    const saved = sessionStorage.getItem('aura_customer_session') || sessionStorage.getItem('daiva_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const getActiveAdminSession = (): User | null => {
  try {
    const saved = sessionStorage.getItem('aura_admin_session');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

interface AuthContextType {
  user: User | null;
  adminUser: User | null;
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
  // Dedicated Tab-scoped session storage for Admin (isolated from customer session)
  const [adminUser, setAdminUser] = useState<User | null>(() => {
    try {
      const savedAdmin = sessionStorage.getItem('aura_admin_session');
      if (savedAdmin) {
        const parsed: User = JSON.parse(savedAdmin);
        if (parsed.role === 'ADMIN') return parsed;
      }
    } catch {}
    return null;
  });

  // Dedicated Tab-scoped session storage for Storefront Customer / Active User
  const [user, setUser] = useState<User | null>(() => {
    try {
      // Purge any old persistent localStorage credentials to eliminate cross-session contamination
      localStorage.removeItem('daiva_user');

      const saved = sessionStorage.getItem('aura_customer_session');
      if (saved) return JSON.parse(saved);

      const savedAdmin = sessionStorage.getItem('aura_admin_session');
      if (savedAdmin) {
        const parsed = JSON.parse(savedAdmin);
        if (parsed.role === 'ADMIN') return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Sync customer session to tab-scoped sessionStorage
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('aura_customer_session', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('aura_customer_session');
    }
  }, [user]);

  // Sync admin session to tab-scoped sessionStorage
  useEffect(() => {
    if (adminUser) {
      sessionStorage.setItem('aura_admin_session', JSON.stringify(adminUser));
    } else {
      sessionStorage.removeItem('aura_admin_session');
    }
  }, [adminUser]);

  // Background refresh profile from backend on app load (strictly matching email to prevent identity mutation)
  useEffect(() => {
    if (user?.id) {
      api.getProfile(user.id)
        .then((fresh) => {
          if (fresh && fresh.email && user.email && fresh.email.trim().toLowerCase() === user.email.trim().toLowerCase()) {
            setUser((prev) => (prev ? { ...prev, ...fresh } : fresh));
          } else {
            console.warn('User profile collision detected. Discarding stale session to prevent identity mutation.');
            sessionStorage.removeItem('aura_customer_session');
            setUser(null);
          }
        })
        .catch(() => {});
    }

    if (adminUser?.id) {
      api.getProfile(adminUser.id)
        .then((fresh) => {
          if (fresh && fresh.role === 'ADMIN') {
            setAdminUser((prev) => (prev ? { ...prev, ...fresh } : fresh));
          }
        })
        .catch(() => {});
    }
  }, []);

  const refreshUser = async () => {
    if (!user?.id) return null;
    try {
      const fresh = await api.getProfile(user.id);
      if (fresh && fresh.email && user.email && fresh.email.trim().toLowerCase() === user.email.trim().toLowerCase()) {
        setUser((prev) => (prev ? { ...prev, ...fresh } : fresh));
        return fresh;
      }
      return user;
    } catch {
      return user;
    }
  };

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    let combined = res;
    try {
      const fullProfile = await api.getProfile(res.id);
      if (fullProfile.email?.trim().toLowerCase() === res.email?.trim().toLowerCase()) {
        combined = { ...res, ...fullProfile };
      }
    } catch {}

    setUser(combined);
    sessionStorage.setItem('aura_customer_session', JSON.stringify(combined));

    if (combined.role === 'ADMIN') {
      setAdminUser(combined);
      sessionStorage.setItem('aura_admin_session', JSON.stringify(combined));
    }
    return combined;
  };

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    const res = await api.register({ fullName, email, password, phone });
    let combined = res;
    try {
      const fullProfile = await api.getProfile(res.id);
      if (fullProfile.email?.trim().toLowerCase() === res.email?.trim().toLowerCase()) {
        combined = { ...res, ...fullProfile };
      }
    } catch {}
    setUser(combined);
    sessionStorage.setItem('aura_customer_session', JSON.stringify(combined));
    return combined;
  };

  const loginWithGoogle = async (googleData: { email: string; fullName?: string; googleSub?: string; profilePictureUrl?: string }) => {
    const res = await api.googleAuth(googleData);
    let combined = res;
    try {
      const fullProfile = await api.getProfile(res.id);
      if (fullProfile.email?.trim().toLowerCase() === res.email?.trim().toLowerCase()) {
        combined = { ...res, ...fullProfile };
      }
    } catch {}
    setUser(combined);
    sessionStorage.setItem('aura_customer_session', JSON.stringify(combined));
    return combined;
  };

  const logout = () => {
    try {
      sessionStorage.removeItem('aura_customer_session');
      sessionStorage.removeItem('aura_admin_session');
      sessionStorage.removeItem('daiva_user');
      localStorage.removeItem('daiva_user');
      localStorage.removeItem('daiva_cart');
      localStorage.removeItem('daiva_wishlist');
      localStorage.removeItem('daiva_browsing_history');
      localStorage.removeItem('daiva_cart_guest');
      localStorage.removeItem('daiva_wishlist_guest');
      localStorage.removeItem('daiva_browsing_history_guest');
    } catch {}

    // Dispatch global auth logout event for instantaneous in-memory state reset
    try {
      window.dispatchEvent(new Event('daiva_auth_logout'));
    } catch {}

    setUser(null);
    setAdminUser(null);
  };

  const updateUser = async (updated: Partial<User>) => {
    if (!user) throw new Error('Not logged in');
    const res = await api.updateProfile(user.id, updated);
    const merged = { ...user, ...res };
    setUser(merged);
    sessionStorage.setItem('aura_customer_session', JSON.stringify(merged));
    return merged;
  };

  const isAdmin = Boolean(adminUser && adminUser.role === 'ADMIN') || (user?.role === 'ADMIN');

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
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
