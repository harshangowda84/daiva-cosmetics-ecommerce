import React, { useState } from 'react';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Sparkles, ShieldCheck, Tag, CheckSquare, Square, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface CartPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onNavigate }) => {
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    toggleSelectItem,
    selectAllItems,
    selectedItems,
    selectedSubtotal,
    selectedShippingFee,
    selectedTotalAmount,
    selectedItemsCount,
    allSelected,
    totalItemsCount,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');

  const freeShippingThreshold = 999;
  const amountNeeded = Math.max(0, freeShippingThreshold - selectedSubtotal);
  const progressPercent = Math.min(100, (selectedSubtotal / freeShippingThreshold) * 100);

  const applyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSubtotal === 0) {
      setCouponMessage('Select items first to apply promo code.');
      return;
    }
    if (couponCode.toUpperCase() === 'GLOW10' || couponCode.toUpperCase() === 'ZOHO') {
      const discount = Math.round(selectedSubtotal * 0.1);
      setDiscountAmount(discount);
      setCouponMessage('Promo code applied: 10% Off your selected cosmetics!');
    } else {
      setCouponMessage('Invalid promo code. Try "GLOW10" for 10% off.');
    }
  };

  const finalTotal = Math.max(0, selectedTotalAmount - discountAmount);

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-3xl text-neutral-800 dark:text-[#EDE4DA]">Your Beauty Bag is Empty</h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
          Explore our collection of clinical botanical serums, nourishing lipsticks, and SPF essentials.
        </p>
        <button
          onClick={() => onNavigate('plp', 'All')}
          className="mt-4 px-8 py-3.5 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-lg"
        >
          Explore Cosmetics Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 pb-6 border-b border-neutral-200 dark:border-[#2C211A]">
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold">Shopping Bag</span>
          <h1 className="font-serif text-3xl text-neutral-900 dark:text-[#EDE4DA] mt-1">Review Your Items ({totalItemsCount})</h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition"
        >
          Clear entire bag
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Items List (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Shipping Progress */}
          <div className="bg-[#FAF5EF] dark:bg-[#1A1410] rounded-2xl p-4 border border-[#EAE1D3] dark:border-[#2C211A]">
            {selectedSubtotal === 0 ? (
              <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                Select products with the checkbox to compute shipping and proceed to checkout.
              </p>
            ) : amountNeeded > 0 ? (
              <p className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">
                Add <span className="font-bold text-rose-800 dark:text-rose-400">₹{amountNeeded.toLocaleString()}</span> more of selected items for <span className="font-bold">Complimentary Free Delivery</span>!
              </p>
            ) : (
              <p className="text-xs text-emerald-800 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Unlocked: Free Complimentary Delivery on selected items!
              </p>
            )}
            <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 mt-2 overflow-hidden">
              <div
                className="bg-rose-700 dark:bg-rose-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Select All Toggle Header */}
          <div className="bg-white dark:bg-[#1A1410] rounded-2xl border border-neutral-200 dark:border-[#2C211A] px-5 py-3.5 flex items-center justify-between shadow-xs">
            <button
              type="button"
              onClick={() => selectAllItems(!allSelected)}
              className="flex items-center gap-2.5 text-xs font-semibold text-neutral-800 dark:text-[#EDE4DA] hover:text-rose-700 dark:hover:text-rose-400 transition"
            >
              {allSelected ? (
                <CheckSquare className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              ) : (
                <Square className="w-4 h-4 text-neutral-400" />
              )}
              <span>Select All Items ({selectedItemsCount} of {totalItemsCount} selected for checkout)</span>
            </button>

            {items.some(i => i.fromWishlist) && (
              <span className="text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-medium">
                <Heart className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                <span>Wishlist synced</span>
              </span>
            )}
          </div>

          {/* Items List with Standardized Proportions */}
          <div className="bg-white dark:bg-[#1A1410] rounded-2xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden shadow-sm divide-y divide-neutral-100 dark:divide-[#2C211A]">
            {items.map((item) => {
              const isSelected = item.selected !== false;
              return (
                <div
                  key={item.product.id}
                  className={`p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-colors rounded-2xl ${
                    isSelected
                      ? 'bg-white dark:bg-[#1A1410]'
                      : 'bg-neutral-50/50 dark:bg-[#140F0C] opacity-75'
                  }`}
                >
                  {/* Checkbox */}
                  <div className="pt-2 shrink-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.product.id)}
                      className="w-4 h-4 rounded text-rose-700 focus:ring-rose-500 accent-rose-700 cursor-pointer"
                      title={isSelected ? 'Deselect to keep in cart for later' : 'Select for checkout'}
                    />
                  </div>

                  {/* Fixed Size Image Container */}
                  <div
                    onClick={() => onNavigate('pdp', item.product.slug)}
                    className="w-20 h-20 sm:w-24 sm:h-24 min-w-[5rem] sm:min-w-[6rem] aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-[#251D18] flex-shrink-0 flex items-center justify-center p-1 border border-neutral-100 dark:border-[#2C211A] cursor-pointer hover:opacity-90 transition"
                  >
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-xl"
                      loading="lazy"
                    />
                  </div>

                  {/* Details Column matching Image 1: Title & Trash on top, Subtitle in middle, Stepper & Price at bottom */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch min-h-[5rem] sm:min-h-[6rem]">
                    {/* Top Row: Product Title & Trash */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3
                            onClick={() => onNavigate('pdp', item.product.slug)}
                            className="font-serif text-sm sm:text-base font-medium text-neutral-900 dark:text-[#EDE4DA] hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer line-clamp-1"
                            title={item.product.name}
                          >
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {item.product.volume || 'Standard'} | {item.product.brand}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition rounded-lg hover:bg-neutral-100 dark:hover:bg-[#251D18] shrink-0 -mr-1 -mt-1"
                          title={item.fromWishlist ? 'Remove from bag and return to wishlist' : 'Remove item'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {item.fromWishlist && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full mt-1">
                          <Heart className="w-2.5 h-2.5 fill-rose-600 text-rose-600" />
                          <span>Returns to Wishlist if removed</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Stepper on Left, Price on Right */}
                    <div className="flex items-center justify-between gap-3 mt-3 pt-1">
                      {/* Stepper Buttons */}
                      <div className="flex items-center border border-neutral-200 dark:border-[#382B21] rounded-xl bg-[#FAF9F6] dark:bg-[#251D18] shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2.5 py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2C211A] transition rounded-l-xl"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-bold text-neutral-900 dark:text-[#EDE4DA] min-w-[1.75rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2.5 py-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2C211A] transition rounded-r-xl"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="text-base sm:text-lg font-bold text-neutral-900 dark:text-[#EDE4DA]">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              onClick={() => onNavigate('plp', 'All')}
              className="text-neutral-600 dark:text-neutral-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium"
            >
              ← Continue Shopping Cosmetics
            </button>
          </div>
        </div>

        {/* Right: Order Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1A1410] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-semibold text-neutral-900 dark:text-[#EDE4DA]">
              Order Summary
            </h3>

            {/* Coupon Code */}
            <form onSubmit={applyCoupon} className="space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                <span>Apply Promo Code</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. GLOW10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] uppercase font-mono tracking-wider focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className={`text-[11px] ${discountAmount > 0 ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : 'text-rose-700 dark:text-rose-400'}`}>
                  {couponMessage}
                </p>
              )}
            </form>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400 pt-4 border-t border-neutral-100 dark:border-[#2C211A]">
              <div className="flex justify-between">
                <span>Selected Items Subtotal ({selectedItemsCount} items)</span>
                <span className="font-semibold text-neutral-900 dark:text-[#EDE4DA]">₹{selectedSubtotal.toLocaleString()}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-semibold">
                  <span>Promo Discount (10%)</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span>
                  {selectedSubtotal === 0 ? (
                    '₹0'
                  ) : selectedShippingFee === 0 ? (
                    <strong className="text-emerald-700 dark:text-emerald-400 font-semibold">FREE</strong>
                  ) : (
                    `₹${selectedShippingFee}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-neutral-900 dark:text-[#EDE4DA] pt-3 border-t border-neutral-200 dark:border-[#2C211A]">
                <span>Total Amount</span>
                <span className="text-rose-800 dark:text-rose-400">₹{finalTotal.toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-neutral-400 text-right">Includes all applicable GST</p>
            </div>

            {/* Notification if some items are left unselected */}
            {selectedItemsCount < totalItemsCount && selectedItemsCount > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs">
                <span>{totalItemsCount - selectedItemsCount} unselected item(s) will stay in your cart for later.</span>
              </div>
            )}

            <button
              disabled={selectedItemsCount === 0}
              onClick={() => onNavigate('checkout')}
              className={`w-full py-4 rounded-full font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xl ${
                selectedItemsCount === 0
                  ? 'bg-neutral-300 dark:bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#1E1611] dark:bg-rose-900 text-white hover:bg-rose-700 dark:hover:bg-rose-800'
              }`}
            >
              <span>{selectedItemsCount === 0 ? 'Select Items to Checkout' : `Proceed to Checkout (${selectedItemsCount})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Safe & Secure Checkout • Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
