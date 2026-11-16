import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { useWishlist } from './WishlistContext';

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
  const { addToWishlist } = useWishlist();

  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('daiva_cart');
      if (saved) {
        const parsed: CartItem[] = JSON.parse(saved);
        return parsed.map((item) => ({
          ...item,
          selected: item.selected !== false, // default to true if undefined
        }));
      }
      return [];
    } catch {
      return [];
    }
  });

  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('daiva_cart', JSON.stringify(items));
  }, [items]);

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
    if (openDrawer) {
      setIsCartDrawerOpen(true);
    }
  };

  const removeFromCart = (productId: number) => {
    const itemToRemove = items.find((item) => item.product.id === productId);
    if (itemToRemove && itemToRemove.fromWishlist) {
      // Return back to wishlist
      addToWishlist(itemToRemove.product);
    }
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
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
  };

  const toggleSelectItem = (productId: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, selected: item.selected === false ? true : false }
          : item
      )
    );
  };

  const selectAllItems = (select: boolean) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        selected: select,
      }))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const clearSelectedItems = () => {
    setItems((prev) => prev.filter((item) => item.selected === false));
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
