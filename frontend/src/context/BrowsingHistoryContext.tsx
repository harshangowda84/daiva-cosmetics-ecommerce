import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product, UserBrowsingHistoryItem } from '../types';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

interface BrowsingHistoryContextType {
  history: UserBrowsingHistoryItem[];
  totalHistoryCount: number;
  recordView: (product: Product) => void;
  removeFromHistory: (productId: number) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const BrowsingHistoryContext = createContext<BrowsingHistoryContextType | undefined>(undefined);

const MAX_HISTORY_ITEMS = 30;

export const BrowsingHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const prevUserIdRef = useRef<number | null | undefined>(user?.id);

  const [history, setHistory] = useState<UserBrowsingHistoryItem[]>(() => {
    try {
      const savedUserStr = localStorage.getItem('daiva_user');
      const savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
      const key = savedUser?.id ? `daiva_browsing_history_${savedUser.id}` : 'daiva_browsing_history_guest';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Synchronous, zero-lag reset on auth logout event (no page refresh needed)
  useEffect(() => {
    const handleLogout = () => {
      setHistory([]);
      try {
        localStorage.removeItem('daiva_browsing_history_guest');
      } catch {}
    };
    window.addEventListener('daiva_auth_logout', handleLogout);
    return () => window.removeEventListener('daiva_auth_logout', handleLogout);
  }, []);

  // Save to user-scoped or guest localStorage ONLY when history changes
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`daiva_browsing_history_${user.id}`, JSON.stringify(history));
      } catch (e) {
        console.warn('Failed to save browsing history to localStorage:', e);
      }
    } else {
      try {
        localStorage.setItem('daiva_browsing_history_guest', JSON.stringify(history));
      } catch (e) {
        console.warn('Failed to save browsing history to localStorage:', e);
      }
    }
  }, [history]);

  // Clean legacy un-scoped key
  useEffect(() => {
    localStorage.removeItem('daiva_browsing_history');
  }, []);

  // Sync with backend on login, user change, or logout
  useEffect(() => {
    let isMounted = true;
    const prevUserId = prevUserIdRef.current;
    const currentUserId = user?.id;
    prevUserIdRef.current = currentUserId;

    if (!currentUserId) {
      // User is logged out / guest
      if (prevUserId) {
        // Transitioned from logged in to logged out: WIPE IMMEDIATELY
        setHistory([]);
        try {
          localStorage.removeItem('daiva_browsing_history_guest');
        } catch {}
      } else {
        // Initial guest load
        try {
          const guestSaved = localStorage.getItem('daiva_browsing_history_guest');
          setHistory(guestSaved ? JSON.parse(guestSaved) : []);
        } catch {
          setHistory([]);
        }
      }
      return;
    }

    // User is logged in: load user's history
    const userKey = `daiva_browsing_history_${currentUserId}`;
    let initialHistory: UserBrowsingHistoryItem[] = [];
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) initialHistory = JSON.parse(saved);
    } catch {}

    const syncBackendHistory = async () => {
      try {
        const backendItems = await api.getUserHistory(currentUserId);
        if (!isMounted) return;

        if (backendItems && backendItems.length > 0) {
          setHistory(backendItems.slice(0, MAX_HISTORY_ITEMS));
          localStorage.setItem(userKey, JSON.stringify(backendItems.slice(0, MAX_HISTORY_ITEMS)));
        } else if (initialHistory.length > 0) {
          for (const item of initialHistory) {
            if (item.product?.id) {
              await api.recordProductView(currentUserId, item.product.id).catch(() => {});
            }
          }
          const fresh = await api.getUserHistory(currentUserId);
          if (isMounted && fresh) setHistory(fresh.slice(0, MAX_HISTORY_ITEMS));
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.warn('Could not sync browsing history with backend:', err);
        if (isMounted && initialHistory.length > 0) {
          setHistory(initialHistory);
        }
      }
    };

    syncBackendHistory();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const recordView = useCallback(
    (product: Product) => {
      if (!product || !product.id) return;

      const now = new Date().toISOString();
      const newItem: UserBrowsingHistoryItem = {
        product,
        viewedAt: now,
      };

      setHistory((prev) => {
        const filtered = prev.filter((item) => item.product?.id !== product.id);
        const updated = [newItem, ...filtered];
        return updated.slice(0, MAX_HISTORY_ITEMS);
      });

      // Persist to backend if logged in
      if (user?.id) {
        api.recordProductView(user.id, product.id).catch((err) => {
          console.warn('Could not record product view to backend:', err);
        });
      }
    },
    [user?.id]
  );

  const removeFromHistory = useCallback(
    async (productId: number) => {
      setHistory((prev) => prev.filter((item) => item.product?.id !== productId));
      if (user?.id) {
        try {
          await api.removeFromHistory(user.id, productId);
        } catch (err) {
          console.warn('Could not remove browsing history item from backend:', err);
        }
      }
    },
    [user?.id]
  );

  const clearHistory = useCallback(async () => {
    setHistory([]);
    if (user?.id) {
      try {
        await api.clearUserHistory(user.id);
      } catch (err) {
        console.warn('Could not clear browsing history from backend:', err);
      }
    } else {
      localStorage.removeItem('daiva_browsing_history_guest');
    }
  }, [user?.id]);

  const totalHistoryCount = history.length;

  return (
    <BrowsingHistoryContext.Provider
      value={{
        history,
        totalHistoryCount,
        recordView,
        removeFromHistory,
        clearHistory,
      }}
    >
      {children}
    </BrowsingHistoryContext.Provider>
  );
};

export const useBrowsingHistory = () => {
  const context = useContext(BrowsingHistoryContext);
  if (!context) {
    throw new Error('useBrowsingHistory must be used within a BrowsingHistoryProvider');
  }
  return context;
};
