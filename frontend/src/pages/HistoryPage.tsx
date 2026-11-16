import React, { useState } from 'react';
import { History, ShoppingBag, Trash2, ArrowLeft, Star, Heart, Check, Clock, Sparkles } from 'lucide-react';
import { useBrowsingHistory } from '../context/BrowsingHistoryContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Product } from '../types';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface HistoryPageProps {
  onNavigate: (page: string, param?: string) => void;
}

const formatRelativeTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return 'Yesterday';
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
};

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { history, removeFromHistory, clearHistory, totalHistoryCount } = useBrowsingHistory();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [toastMessage, setToastMessage] = useState<string>('');
  const [addedIds, setAddedIds] = useState<Record<number, boolean>>({});

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stockQuantity <= 0) return;
    addToCart(product, 1, false);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setToastMessage(`"${product.name}" added to bag!`);
    setTimeout(() => {
      setToastMessage('');
      setAddedIds((prev) => ({ ...prev, [product.id]: false }));
    }, 2500);
  };

  const handleToggleWishlist = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const added = await toggleWishlist(product);
    setToastMessage(added ? `"${product.name}" added to wishlist!` : `Removed from wishlist`);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleRemove = async (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFromHistory(productId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
          <div className="bg-[#1E1611] dark:bg-[#251D18] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold border border-neutral-700 dark:border-[#382B21]">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-[#FAF5EF] dark:bg-[#1E1612] rounded-3xl p-6 sm:p-10 border border-[#EAE1D3] dark:border-[#2C211A] relative overflow-hidden transition-colors">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <button
              onClick={() => onNavigate('plp', 'All')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-[#EDE4DA] transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </button>
            <div className="flex items-center gap-2.5 pt-1">
              <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 dark:text-[#EDE4DA] font-medium">
                Browsing History
              </h1>
              <span className="w-7 h-7 rounded-full bg-rose-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {totalHistoryCount}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-light">
              Recently viewed cosmetic formulas, serums, and luxury skincare tailored to your beauty routine.
            </p>
          </div>

          {/* Quick Clear Action */}
          {history.length > 0 && (
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={clearHistory}
                className="px-4 py-2.5 rounded-full border border-neutral-300 dark:border-[#382B21] text-neutral-600 dark:text-neutral-300 hover:text-rose-700 dark:hover:text-rose-400 hover:border-rose-300 text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All History</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      {history.length === 0 ? (
        <div className="py-20 text-center space-y-5 bg-white dark:bg-[#1A1410] rounded-3xl border border-neutral-200 dark:border-[#2C211A] p-8 max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-[#251D18] text-neutral-400 dark:text-neutral-500 flex items-center justify-center mx-auto shadow-inner">
            <History className="w-8 h-8 stroke-1" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-serif text-2xl text-neutral-800 dark:text-[#EDE4DA]">
              No viewed cosmetics yet
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              As you browse through our clean, botanical skincare and makeup collection, products you view will appear here for easy reference.
            </p>
          </div>
          <button
            onClick={() => onNavigate('plp', 'All')}
            className="px-6 py-3 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 dark:hover:bg-rose-800 transition-all shadow-md inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-rose-300" />
            <span>Discover Luxury Cosmetics</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {history.map(({ product, viewedAt }) => {
            const inWishlist = isInWishlist(product.id);
            const isAdded = addedIds[product.id];
            const isOutOfStock = product.stockQuantity <= 0;

            return (
              <div
                key={product.id}
                onClick={() => onNavigate('pdp', product.slug)}
                className="group relative bg-white dark:bg-[#1A1410] rounded-3xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden hover:shadow-xl dark:hover:border-rose-900/50 transition-all duration-300 flex flex-col cursor-pointer"
              >
                {/* Image and Badges */}
                <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-[#251D18]">
                  <img
                    src={getFullImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={handleImageError}
                  />

                  {/* Relative Timestamp Pill */}
                  <div className="absolute top-3 left-3 bg-black/60 dark:bg-black/75 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-300" />
                    <span>{formatRelativeTime(viewedAt)}</span>
                  </div>

                  {/* Actions overlay: Remove from History & Wishlist */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {/* Wishlist toggle */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleWishlist(product, e)}
                      title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      className="w-8 h-8 rounded-full bg-white/90 dark:bg-[#1A1410]/90 backdrop-blur-xs flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:text-rose-600 dark:hover:text-rose-400 hover:scale-110 transition shadow-xs"
                    >
                      <Heart
                        className={`w-4 h-4 ${inWishlist ? 'fill-rose-600 text-rose-600 dark:text-rose-400' : ''}`}
                      />
                    </button>

                    {/* Remove from history button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(product.id, e)}
                      title="Remove from history"
                      className="w-8 h-8 rounded-full bg-white/90 dark:bg-[#1A1410]/90 backdrop-blur-xs flex items-center justify-center text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:scale-110 transition shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Stock pill if out of stock */}
                  {isOutOfStock && (
                    <div className="absolute bottom-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      Sold Out
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wider">
                        {product.brand}
                      </span>
                      {product.rating > 0 && (
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="w-3 h-3 fill-current" />
                          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                            {product.rating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>

                    <h4 className="font-serif text-sm sm:text-base font-semibold text-neutral-900 dark:text-[#EDE4DA] line-clamp-1 group-hover:text-rose-700 dark:group-hover:text-rose-400 transition">
                      {product.name}
                    </h4>

                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Footer: Price & Add to Bag */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-[#2C211A]">
                    <div>
                      <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-[#EDE4DA]">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition shadow-xs ${
                        isOutOfStock
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1E1611] dark:bg-rose-900 hover:bg-rose-700 dark:hover:bg-rose-800 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Added</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
