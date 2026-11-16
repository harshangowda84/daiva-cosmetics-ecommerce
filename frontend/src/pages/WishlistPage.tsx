import React, { useState } from 'react';
import { Heart, ShoppingBag, Trash2, ArrowRight, Sparkles, Check, ArrowLeft, Star } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface WishlistPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigate }) => {
  const { wishlist, removeFromWishlist, clearWishlist, totalWishlistCount } = useWishlist();
  const { addToCart } = useCart();
  const [movingId, setMovingId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const handleMoveToBag = async (product: Product) => {
    if (product.stockQuantity <= 0) return;
    setMovingId(product.id);
    addToCart(product, 1, false, true);
    setToastMessage(`"${product.name}" moved to your bag!`);

    setTimeout(async () => {
      await removeFromWishlist(product.id);
      setMovingId(null);
      setTimeout(() => setToastMessage(''), 2500);
    }, 600);
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlist.map((product) => {
            const isOutOfStock = product.stockQuantity <= 0;
            const isMoving = movingId === product.id;

            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#ede7df] hover:border-[#c5b7a3] hover:shadow-xl transition-all duration-300 flex flex-col group"
              >
                {/* Image Container */}
                <div
                  onClick={() => onNavigate('pdp', product.slug)}
                  className="relative aspect-[4/5] overflow-hidden bg-neutral-100 cursor-pointer"
                >
                  <img
                    src={getFullImageUrl(product.imageUrl)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={handleImageError}
                  />

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(product.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 text-neutral-400 hover:text-rose-600 hover:bg-white flex items-center justify-center transition shadow-sm backdrop-blur-xs"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Discount / Best Seller Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 items-start pointer-events-none">
                    {product.isBestSeller && (
                      <span className="bg-[#1E1611] text-white text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-xs">
                        Best Seller
                      </span>
                    )}
                    {product.discountPercent && product.discountPercent > 0 && (
                      <span className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        {product.discountPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-400 uppercase tracking-wider mb-1">
                      <span>{product.brand}</span>
                      <span>{product.subCategory}</span>
                    </div>

                    <h3
                      onClick={() => onNavigate('pdp', product.slug)}
                      className="font-serif text-sm font-semibold text-neutral-900 hover:text-rose-700 cursor-pointer transition line-clamp-2 leading-snug"
                    >
                      {product.name}
                    </h3>

                    <div className="flex items-center gap-1.5 mt-1.5 text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-neutral-800">{product.rating}</span>
                      <span className="text-[11px] text-neutral-400">({product.reviewCount})</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-100 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-neutral-900">
                          ₹{product.price.toLocaleString()}
                        </span>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-xs text-neutral-400 line-through">
                            ₹{product.originalPrice.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {isOutOfStock ? (
                        <span className="text-[10px] font-semibold text-red-600">Out of Stock</span>
                      ) : (
                        <span className="text-[10px] font-semibold text-emerald-600">In Stock</span>
                      )}
                    </div>

                    {/* Move to Bag Action Button */}
                    <button
                      type="button"
                      disabled={isOutOfStock || isMoving}
                      onClick={() => handleMoveToBag(product)}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition shadow-xs ${
                        isOutOfStock
                          ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
                          : isMoving
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#1E1611] text-white hover:bg-rose-700 active:scale-98'
                      }`}
                    >
                      {isMoving ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Moved to Bag</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Move to Bag</span>
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
