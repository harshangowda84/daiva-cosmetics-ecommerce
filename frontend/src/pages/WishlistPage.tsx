import React, { useState } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { ProductCard } from '../components/ProductCard';

interface WishlistPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { wishlist, removeFromWishlist, clearWishlist, totalWishlistCount } = useWishlist();
  const { addToCart } = useCart();
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleMoveAllToBag = () => {
    const available = wishlist.filter((p) => p.stockQuantity > 0);
    if (available.length === 0) return;

    available.forEach((p) => addToCart(p, 1, false, true));
    clearWishlist();
    setToastMessage(`${available.length} items moved to your bag!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1E1611] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-neutral-700">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#FAF5EF] rounded-3xl p-6 sm:p-10 border border-[#EAE1D3] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <button
              onClick={() => onNavigate('plp', 'All')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </button>
            <div className="flex items-center gap-2.5 pt-1">
              <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 font-medium">
                My Saved Wishlist
              </h1>
              <span className="w-7 h-7 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {totalWishlistCount}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 font-light">
              Your personal sanctuary of coveted skincare, clean serums, and luxury botanical cosmetics.
            </p>
          </div>

          {/* Quick Batch Actions */}
          {wishlist.length > 0 && (
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={clearWishlist}
                className="px-4 py-2.5 rounded-full border border-neutral-300 text-neutral-600 hover:text-rose-700 hover:border-rose-300 text-xs font-semibold transition"
              >
                Clear All
              </button>
              <button
                type="button"
                onClick={handleMoveAllToBag}
                className="px-5 py-2.5 rounded-full bg-[#1E1611] text-white hover:bg-rose-700 text-xs font-semibold flex items-center gap-2 transition shadow-md group"
              >
                <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>Move All to Bag</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {wishlist.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 sm:p-16 text-center border border-neutral-200/80 shadow-xs max-w-2xl mx-auto space-y-4 my-8">
          <div className="w-16 h-16 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500 shadow-2xs">
            <Heart className="w-8 h-8 fill-rose-500/20 text-rose-500" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-neutral-900">Your Wishlist is Empty</h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
            Explore our curated catalog and tap the heart icon on any product to save items you love for later.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('plp', 'All')}
              className="px-7 py-3 rounded-full bg-[#1E1611] text-white hover:bg-rose-700 text-xs font-semibold inline-flex items-center gap-2 transition shadow-md"
            >
              <span>Explore Cosmetics Catalog</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 items-stretch">
          {wishlist.map((product) => (
            <div key={product.id} className="relative group/wishlist h-full flex flex-col">
              <ProductCard product={product} onNavigate={onNavigate} />

              {/* Quick Remove Button on Hover */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeFromWishlist(product.id);
                }}
                className="absolute top-2.5 right-11 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-[#1A1410]/95 backdrop-blur-xs flex items-center justify-center text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition shadow-xs opacity-0 group-hover/wishlist:opacity-100 border border-neutral-200 dark:border-neutral-700"
                title="Remove from wishlist"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
