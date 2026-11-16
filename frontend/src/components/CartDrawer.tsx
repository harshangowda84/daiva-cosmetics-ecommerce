import React, { useEffect } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles, CheckSquare, Square, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartDrawerProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onNavigate }) => {
  const {
    items,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    toggleSelectItem,
    selectAllItems,
    selectedItemsCount,
    selectedSubtotal,
    selectedShippingFee,
    selectedTotalAmount,
    allSelected,
    totalItemsCount,
  } = useCart();

  // Prevent background web page scrolling when cart drawer is open
  useEffect(() => {
    if (!isCartDrawerOpen) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [isCartDrawerOpen]);

  if (!isCartDrawerOpen) return null;

  const freeShippingThreshold = 999;
  const amountNeeded = Math.max(0, freeShippingThreshold - selectedSubtotal);
  const progressPercent = Math.min(100, (selectedSubtotal / freeShippingThreshold) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden overscroll-none">
      {/* Backdrop with wheel/touch containment */}
      <div
        onClick={() => setIsCartDrawerOpen(false)}
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 overscroll-contain">
        <div className="w-screen max-w-md bg-white dark:bg-[#1A1410] shadow-2xl flex flex-col overscroll-contain border-l border-neutral-200 dark:border-[#2C211A] text-neutral-800 dark:text-[#EDE4DA]">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-neutral-100 dark:border-[#2C211A] flex items-center justify-between bg-[#FAF9F6] dark:bg-[#120E0C]">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-neutral-800 dark:text-neutral-200" />
              <h2 className="font-serif text-lg font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                Your Beauty Bag ({totalItemsCount})
              </h2>
            </div>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-full hover:bg-neutral-100 dark:hover:bg-[#251D18] transition"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selection Toggle Bar */}
          {items.length > 0 && (
            <div className="px-5 py-2.5 bg-neutral-50 dark:bg-[#251D18] border-b border-neutral-100 dark:border-[#2C211A] flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => selectAllItems(!allSelected)}
                className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300 font-medium hover:text-rose-700 dark:hover:text-rose-400 transition"
              >
                {allSelected ? (
                  <CheckSquare className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                ) : (
                  <Square className="w-4 h-4 text-neutral-400" />
                )}
                <span>Select All ({selectedItemsCount}/{items.length} items)</span>
              </button>

              {items.some(i => i.fromWishlist) && (
                <span className="text-[10px] text-rose-700 dark:text-rose-400 flex items-center gap-1 font-medium">
                  <Heart className="w-3 h-3 fill-rose-600 text-rose-600" />
                  Wishlist synced
                </span>
              )}
            </div>
          )}

          {/* Free Shipping Meter based on selected items */}
          <div className="bg-rose-50/70 dark:bg-rose-950/20 px-5 py-3 border-b border-rose-100 dark:border-rose-900/30">
            {selectedSubtotal === 0 ? (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                Check items below to proceed with delivery.
              </p>
            ) : amountNeeded > 0 ? (
              <p className="text-xs text-rose-900 dark:text-rose-300 font-medium">
                Add <span className="font-bold">₹{amountNeeded.toLocaleString()}</span> more of selected items for <span className="font-bold">Free Complimentary Delivery</span>!
              </p>
            ) : (
              <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Unlocked: Free Complimentary Delivery on selected items!</span>
              </p>
            )}
            <div className="w-full bg-rose-200/60 dark:bg-rose-900/40 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-rose-600 dark:bg-rose-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 overscroll-contain">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto" />
                <p className="font-serif text-lg text-neutral-700 dark:text-neutral-300">Your bag is empty</p>
                <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-xs mx-auto">
                  Explore our luxury clean skincare and botanical makeup collection.
                </p>
                <button
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onNavigate('plp', 'All');
                  }}
                  className="mt-4 px-6 py-2.5 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 transition"
                >
                  Shop Best Sellers
                </button>
              </div>
            ) : (
              items.map((item) => {
                const isSelected = item.selected !== false;
                return (
                  <div
                    key={item.product.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6]/60 dark:bg-[#16110E]'
                        : 'border-neutral-100 dark:border-[#231A14] bg-neutral-50/50 dark:bg-[#120E0C] opacity-70'
                    }`}
                  >
                    {/* Item Selection Checkbox */}
                    <div className="pt-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectItem(item.product.id)}
                        className="w-4 h-4 rounded text-rose-700 focus:ring-rose-500 accent-rose-700 cursor-pointer"
                        title={isSelected ? 'Deselect to save in bag for later' : 'Select for checkout'}
                      />
                    </div>

                    {/* Fixed Proportional Image Container */}
                    <div
                      onClick={() => {
                        setIsCartDrawerOpen(false);
                        onNavigate('pdp', item.product.slug);
                      }}
                      className="w-20 h-20 min-w-[5rem] rounded-xl overflow-hidden bg-neutral-100 dark:bg-[#251D18] flex-shrink-0 flex items-center justify-center p-1 border border-neutral-100 dark:border-[#2C211A] cursor-pointer hover:opacity-90 transition"
                    >
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>

                    {/* Details Column with Guaranteed Vertical Alignment */}
                    <div className="flex-1 flex flex-col justify-between min-h-[5.25rem] min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4
                            onClick={() => {
                              setIsCartDrawerOpen(false);
                              onNavigate('pdp', item.product.slug);
                            }}
                            className="text-xs font-semibold text-neutral-800 dark:text-[#EDE4DA] line-clamp-1 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer transition"
                            title={item.product.name}
                          >
                            {item.product.name}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition p-1 shrink-0 -mr-1 -mt-1"
                            title={item.fromWishlist ? 'Remove from bag & return to wishlist' : 'Remove item'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 line-clamp-1">
                          {item.product.volume} | {item.product.brand}
                          {item.fromWishlist && (
                            <span className="ml-1 text-rose-700 dark:text-rose-400 font-medium">
                              (From Wishlist)
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Bottom Row: Stepper & Price Always Aligned */}
                      <div className="flex justify-between items-center mt-auto pt-2">
                        <div className="flex items-center border border-neutral-200 dark:border-[#382B21] rounded-lg bg-white dark:bg-[#251D18] shadow-xs">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 px-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2C211A] transition rounded-l-lg"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-neutral-800 dark:text-[#EDE4DA] min-w-[1.25rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="p-1 px-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2C211A] transition rounded-r-lg"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-[#EDE4DA]">
                            ₹{(item.product.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-neutral-100 dark:border-[#2C211A] bg-[#FAF9F6] dark:bg-[#120E0C] space-y-3">
              <div className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                <div className="flex justify-between">
                  <span>Selected Subtotal ({selectedItemsCount} items)</span>
                  <span className="font-semibold text-neutral-900 dark:text-[#EDE4DA]">₹{selectedSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>
                    {selectedSubtotal === 0 ? (
                      '₹0'
                    ) : selectedShippingFee === 0 ? (
                      <strong className="text-emerald-700 dark:text-emerald-400">FREE</strong>
                    ) : (
                      `₹${selectedShippingFee}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-[#EDE4DA] pt-2 border-t border-neutral-200 dark:border-[#2C211A]">
                  <span>Total Payable</span>
                  <span className="text-base text-rose-800 dark:text-rose-400">₹{selectedTotalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onNavigate('cart');
                  }}
                  className="w-full py-2.5 rounded-xl border border-neutral-300 dark:border-[#382B21] text-xs font-semibold text-neutral-800 dark:text-[#EDE4DA] hover:bg-neutral-100 dark:hover:bg-[#251D18] transition"
                >
                  View Cart ({items.length})
                </button>
                <button
                  type="button"
                  disabled={selectedItemsCount === 0}
                  onClick={() => {
                    setIsCartDrawerOpen(false);
                    onNavigate('checkout');
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-lg ${
                    selectedItemsCount === 0
                      ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-[#1E1611] dark:bg-rose-900 text-white hover:bg-rose-700 dark:hover:bg-rose-800'
                  }`}
                >
                  <span>{selectedItemsCount === 0 ? 'Select Items' : `Checkout (${selectedItemsCount})`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
