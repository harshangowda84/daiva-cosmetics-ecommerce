import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '../types';
import { useAuth } from './AuthContext';
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
  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('daiva_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('daiva_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync with backend when user is logged in
  useEffect(() => {
    if (!user) return;
    const fetchBackendWishlist = async () => {
      try {
        const backendItems = await api.getUserWishlist(user.id);
        if (backendItems && backendItems.length > 0) {
          // Merge with local wishlist without duplicates
          setWishlist((prev) => {
            const map = new Map<number, Product>();
            prev.forEach((p) => map.set(p.id, p));
            backendItems.forEach((p) => map.set(p.id, p));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Could not sync wishlist with backend:', err);
      }
    };
    fetchBackendWishlist();
  }, [user]);

  const isInWishlist = (productId: number): boolean => {
    return wishlist.some((item) => item.id === productId);
  };

  const toggleWishlist = async (product: Product): Promise<boolean> => {
    const exists = isInWishlist(product.id);
    if (exists) {
      setWishlist((prev) => prev.filter((item) => item.id !== product.id));
      if (user) {
        api.removeFromWishlist(user.id, product.id).catch(console.error);
      }
      return false; // Removed
    } else {
      setWishlist((prev) => [product, ...prev]);
      if (user) {
        api.toggleWishlist(user.id, product.id).catch(console.error);
      }
      return true; // Added
    }
  };

  const addToWishlist = async (product: Product): Promise<void> => {
    if (!isInWishlist(product.id)) {
      setWishlist((prev) => [product, ...prev]);
      if (user) {
        api.toggleWishlist(user.id, product.id).catch(console.error);
      }
    }
  };

  const removeFromWishlist = async (productId: number): Promise<void> => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId));
    if (user) {
      api.removeFromWishlist(user.id, productId).catch(console.error);
    }
  };

  const clearWishlist = async (): Promise<void> => {
    setWishlist([]);
    if (user) {
      api.clearUserWishlist(user.id).catch(console.error);
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
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
