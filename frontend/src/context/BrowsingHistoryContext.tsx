import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEY = 'daiva_browsing_history';
const MAX_HISTORY_ITEMS = 30;

export const BrowsingHistoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<UserBrowsingHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save browsing history to localStorage:', e);
    }
  }, [history]);

  // Sync with backend on login / user change
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    const syncBackendHistory = async () => {
      try {
        const backendItems = await api.getUserHistory(user.id);
        if (!isMounted) return;

        if (backendItems && backendItems.length > 0) {
          setHistory((prev) => {
            const map = new Map<number, UserBrowsingHistoryItem>();
            // Add local first
            prev.forEach((item) => {
              if (item.product?.id) map.set(item.product.id, item);
            });
            // Overwrite / merge with backend
            backendItems.forEach((item) => {
              if (item.product?.id) {
                const existing = map.get(item.product.id);
                if (!existing || new Date(item.viewedAt) > new Date(existing.viewedAt)) {
                  map.set(item.product.id, item);
                }
              }
            });
            // Sort by viewedAt DESC
            const sorted = Array.from(map.values()).sort(
              (a, b) => new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
            );
            return sorted.slice(0, MAX_HISTORY_ITEMS);
          });
        }
      } catch (err) {
        console.warn('Could not sync browsing history with backend:', err);
      }
    };

    syncBackendHistory();
    return () => {
      isMounted = false;
    };
  }, [user]);

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
          console.warn('Failed to record product view to backend:', err);
        });
      }
    },
    [user]
  );

  const removeFromHistory = async (productId: number): Promise<void> => {
    setHistory((prev) => prev.filter((item) => item.product?.id !== productId));
    if (user?.id) {
      try {
        await api.removeFromHistory(user.id, productId);
      } catch (err) {
        console.warn('Failed to remove history item from backend:', err);
      }
    }
  };

  const clearHistory = async (): Promise<void> => {
    setHistory([]);
    if (user?.id) {
      try {
        await api.clearUserHistory(user.id);
      } catch (err) {
        console.warn('Failed to clear history on backend:', err);
      }
    }
  };

  return (
    <BrowsingHistoryContext.Provider
      value={{
        history,
        totalHistoryCount: history.length,
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
