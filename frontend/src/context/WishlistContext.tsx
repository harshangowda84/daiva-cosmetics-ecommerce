import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Product } from '../types';
import { useAuth, getActiveSessionUser } from './AuthContext';
import { api } from '../services/api';

interface WishlistContextType {
  wishlist: Product[];
  totalWishlistCount: number;
  isInWishlist: (productId: number) => boolean;
  toggleWishlist: (product: Product) => Promise<boolean>;
  addToWishlist: (product: Product) => Promise<void>;
  removeFromWishlist: (productId: number) => Promise<void>;
  clearWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const prevUserIdRef = useRef<number | null | undefined>(user?.id);

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const savedUser = getActiveSessionUser();
      const key = savedUser?.id ? `daiva_wishlist_${savedUser.id}` : 'daiva_wishlist_guest';
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Synchronous, zero-lag reset on auth logout event (no page refresh needed)
  useEffect(() => {
    const handleLogout = () => {
      setWishlist([]);
      try {
        localStorage.removeItem('daiva_wishlist_guest');
      } catch {}
    };
    window.addEventListener('daiva_auth_logout', handleLogout);
    return () => window.removeEventListener('daiva_auth_logout', handleLogout);
  }, []);

  // Save to user-scoped or guest localStorage ONLY when wishlist array changes
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`daiva_wishlist_${user.id}`, JSON.stringify(wishlist));
      } catch {}
    } else {
      try {
        localStorage.setItem('daiva_wishlist_guest', JSON.stringify(wishlist));
      } catch {}
    }
  }, [wishlist]);

  // Clean legacy un-scoped key
  useEffect(() => {
    localStorage.removeItem('daiva_wishlist');
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
        setWishlist([]);
        try {
          localStorage.removeItem('daiva_wishlist_guest');
        } catch {}
      } else {
        // Initial guest load
        try {
          const guestSaved = localStorage.getItem('daiva_wishlist_guest');
          setWishlist(guestSaved ? JSON.parse(guestSaved) : []);
        } catch {
          setWishlist([]);
        }
      }
      return;
    }

    // User is logged in: load user's wishlist
    const userKey = `daiva_wishlist_${currentUserId}`;
    let initialWishlist: Product[] = [];
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) initialWishlist = JSON.parse(saved);
    } catch {}

    // Check if guest wishlist had items to merge
    const guestSaved = localStorage.getItem('daiva_wishlist_guest');
    let guestItems: Product[] = [];
    if (guestSaved) {
      try {
        guestItems = JSON.parse(guestSaved);
      } catch {}
    }

    const syncWishlist = async () => {
      try {
        // If guest items exist, sync each to user's backend wishlist
        if (guestItems.length > 0) {
          for (const item of guestItems) {
            await api.toggleWishlist(currentUserId, item.id).catch(() => {});
          }
          localStorage.removeItem('daiva_wishlist_guest');
        }

        const backendItems = await api.getUserWishlist(currentUserId);
        if (!isMounted) return;

        if (backendItems && backendItems.length > 0) {
          setWishlist(backendItems);
          localStorage.setItem(userKey, JSON.stringify(backendItems));
        } else if (initialWishlist.length > 0) {
          for (const item of initialWishlist) {
            await api.toggleWishlist(currentUserId, item.id).catch(() => {});
          }
          const fresh = await api.getUserWishlist(currentUserId);
          if (isMounted && fresh) setWishlist(fresh);
        } else {
          setWishlist([]);
        }
      } catch (err) {
        console.warn('Could not sync wishlist with backend:', err);
        if (isMounted && initialWishlist.length > 0) {
          setWishlist(initialWishlist);
        }
      }
    };

    syncWishlist();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const isInWishlist = (productId: number): boolean => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    const exists = isInWishlist(product.id);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      if (user?.id) {
        api.removeFromWishlist(user.id, product.id).catch(console.error);
      }
      return false; // Removed
    } else {
      setWishlist((prev) => [product, ...prev]);
      if (user?.id) {
        api.toggleWishlist(user.id, product.id).catch(console.error);
      }
      return true; // Added
    }
  };

  const addToWishlist = async (product: Product): Promise<void> => {
    if (!isInWishlist(product.id)) {
      setWishlist((prev) => [product, ...prev]);
      if (user?.id) {
        api.toggleWishlist(user.id, product.id).catch(console.error);
      }
    }
  };

  const removeFromWishlist = async (productId: number): Promise<void> => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    if (user?.id) {
      api.removeFromWishlist(user.id, productId).catch(console.error);
    }
  };

  const clearWishlist = async (): Promise<void> => {
    setWishlist([]);
    if (user?.id) {
      api.clearUserWishlist(user.id).catch(console.error);
    } else {
      localStorage.removeItem('daiva_wishlist_guest');
    }
  };

  const totalWishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        totalWishlistCount,
        isInWishlist,
        toggleWishlist,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};
