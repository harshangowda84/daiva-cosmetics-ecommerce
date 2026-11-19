import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CartItem, Product } from '../types';
import { useWishlist } from './WishlistContext';
import { useAuth, getActiveSessionUser } from './AuthContext';
import { api } from '../services/api';

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, openDrawer?: boolean, fromWishlist?: boolean) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  toggleSelectItem: (productId: number) => void;
  selectAllItems: (select: boolean) => void;
  clearCart: () => void;
  clearSelectedItems: () => void;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  totalItemsCount: number;
  selectedItems: CartItem[];
  selectedSubtotal: number;
  selectedShippingFee: number;
  selectedTotalAmount: number;
  selectedItemsCount: number;
  allSelected: boolean;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToWishlist } = useWishlist();
  const prevUserIdRef = useRef<number | null | undefined>(user?.id);

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedUser = getActiveSessionUser();
      const key = savedUser?.id ? `daiva_cart_${savedUser.id}` : 'daiva_cart_guest';
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        return parsed.map((item) => ({
          ...item,
          selected: item.selected !== false,
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  // Synchronous, zero-lag reset on auth logout event (no page refresh needed)
  useEffect(() => {
    const handleLogout = () => {
      setItems([]);
      setIsCartDrawerOpen(false);
      try {
        localStorage.removeItem('daiva_cart_guest');
      } catch {}
    };
    window.addEventListener('daiva_auth_logout', handleLogout);
    return () => window.removeEventListener('daiva_auth_logout', handleLogout);
  }, []);

  // Save to localStorage ONLY when items array actually changes
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`daiva_cart_${user.id}`, JSON.stringify(items));
      } catch {}
    } else {
      try {
        localStorage.setItem('daiva_cart_guest', JSON.stringify(items));
      } catch {}
    }
  }, [items]);

  // Clean legacy un-scoped key
  useEffect(() => {
    localStorage.removeItem('daiva_cart');
  }, []);

  // Sync with backend whenever user logs in, changes, or logs out
  useEffect(() => {
    let isMounted = true;
    const prevUserId = prevUserIdRef.current;
    const currentUserId = user?.id;
    prevUserIdRef.current = currentUserId;

    if (!currentUserId) {
      // User is logged out / guest
      if (prevUserId) {
        // Transitioned from logged in to logged out: WIPE IMMEDIATELY
        setItems([]);
        setIsCartDrawerOpen(false);
        try {
          localStorage.removeItem('daiva_cart_guest');
        } catch {}
      } else {
        // Initial guest load
        try {
          const guestSaved = localStorage.getItem('daiva_cart_guest');
          setItems(guestSaved ? JSON.parse(guestSaved) : []);
        } catch {
          setItems([]);
        }
      }
      return;
    }

    // User is logged in: load user's cart
    const userKey = `daiva_cart_${currentUserId}`;
    let initialUserCart: CartItem[] = [];
    try {
      const saved = localStorage.getItem(userKey);
      if (saved) initialUserCart = JSON.parse(saved);
    } catch {}

    // Check if guest cart had items before logging in
    const guestSaved = localStorage.getItem('daiva_cart_guest');
    let guestItems: CartItem[] = [];
    if (guestSaved) {
      try {
        guestItems = JSON.parse(guestSaved);
      } catch {}
    }

    const syncCart = async () => {
      try {
        if (guestItems.length > 0) {
          // Merge guest cart items into user's DB cart
          const formattedGuest = guestItems.map((g) => ({
            productId: g.product.id,
            quantity: g.quantity,
            selected: g.selected !== false,
            fromWishlist: !!g.fromWishlist,
          }));
          const merged = await api.mergeGuestCart(currentUserId, formattedGuest);
          localStorage.removeItem('daiva_cart_guest');
          if (isMounted) {
            setItems(merged);
            localStorage.setItem(userKey, JSON.stringify(merged));
          }
        } else {
          // Fetch user's cart from backend DB
          const backendCart = await api.getUserCart(currentUserId);
          if (isMounted) {
            if (backendCart && backendCart.length > 0) {
              setItems(backendCart);
              localStorage.setItem(userKey, JSON.stringify(backendCart));
            } else if (initialUserCart.length > 0) {
              // Persist local cart to DB
              for (const it of initialUserCart) {
                await api.addToCart(
                  currentUserId,
                  it.product.id,
                  it.quantity,
                  it.selected !== false,
                  it.fromWishlist || false
                ).catch(() => {});
              }
              const fresh = await api.getUserCart(currentUserId);
              if (isMounted && fresh) setItems(fresh);
            } else {
              setItems([]);
            }
          }
        }
      } catch (err) {
        console.warn('Could not sync cart with backend:', err);
        if (isMounted && initialUserCart.length > 0) {
          setItems(initialUserCart);
        }
      }
    };

    syncCart();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    openDrawer: boolean = false,
    fromWishlist: boolean = false
  ) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                selected: true,
                fromWishlist: item.fromWishlist || fromWishlist,
              }
            : item
        );
      }
      return [...prev, { product, quantity, selected: true, fromWishlist }];
    });

    if (user?.id) {
      api.addToCart(user.id, product.id, quantity, true, fromWishlist).catch((err) => {
        console.warn('Failed to sync addToCart to backend:', err);
      });
    }

    if (openDrawer) {
      setIsCartDrawerOpen(true);
    }
  };

  const removeFromCart = (productId: number) => {
    const itemToRemove = items.find((item) => item.product.id === productId);
    if (itemToRemove && itemToRemove.fromWishlist) {
      addToWishlist(itemToRemove.product);
    }
    setItems((prev) => prev.filter((item) => item.product.id !== productId));

    if (user?.id) {
      api.removeFromCart(user.id, productId).catch((err) => {
        console.warn('Failed to sync removeFromCart to backend:', err);
      });
    }
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );

    if (user?.id) {
      api.updateCartItem(user.id, productId, { quantity }).catch((err) => {
        console.warn('Failed to sync updateQuantity to backend:', err);
      });
    }
  };

  const toggleSelectItem = (productId: number) => {
    let updatedSelected = true;
    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          updatedSelected = item.selected === false ? true : false;
          return { ...item, selected: updatedSelected };
        }
        return item;
      })
    );

    if (user?.id) {
      api.updateCartItem(user.id, productId, { selected: updatedSelected }).catch((err) => {
        console.warn('Failed to sync toggleSelectItem to backend:', err);
      });
    }
  };

  const selectAllItems = (select: boolean) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: select,
      }))
    );

    if (user?.id) {
      api.selectAllCartItems(user.id, select).catch((err) => {
        console.warn('Failed to sync selectAllItems to backend:', err);
      });
    }
  };

  const clearCart = () => {
    setItems([]);
    if (user?.id) {
      api.clearUserCart(user.id).catch((err) => {
        console.warn('Failed to sync clearCart to backend:', err);
      });
    } else {
      localStorage.removeItem('daiva_cart_guest');
    }
  };

  const clearSelectedItems = () => {
    setItems((prev) => prev.filter((item) => item.selected === false));
    if (user?.id) {
      api.clearSelectedCartItems(user.id).catch((err) => {
        console.warn('Failed to sync clearSelectedItems to backend:', err);
      });
    }
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = subtotal >= 999 || subtotal === 0 ? 0 : 99;
  const totalAmount = subtotal + shippingFee;
  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const selectedItems = items.filter((item) => item.selected !== false);
  const selectedSubtotal = selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const selectedShippingFee = selectedSubtotal >= 999 || selectedSubtotal === 0 ? 0 : 99;
  const selectedTotalAmount = selectedSubtotal + selectedShippingFee;
  const selectedItemsCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const allSelected = items.length > 0 && items.every((item) => item.selected !== false);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleSelectItem,
        selectAllItems,
        clearCart,
        clearSelectedItems,
        subtotal,
        shippingFee,
        totalAmount,
        totalItemsCount,
        selectedItems,
        selectedSubtotal,
        selectedShippingFee,
        selectedTotalAmount,
        selectedItemsCount,
        allSelected,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
