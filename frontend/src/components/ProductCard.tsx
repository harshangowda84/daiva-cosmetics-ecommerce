import React, { useState } from 'react';
import { Star, ShoppingBag, Check, Plus, Minus, Heart } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface ProductCardProps {
  product: Product;
  onNavigate: (page: string, param?: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onNavigate }) => {
  const { items, addToCart, updateQuantity, removeFromCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [justAdded, setJustAdded] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [heartPop, setHeartPop] = useState(false);

  const cartItem = items.find((item) => item.product.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const isWishlisted = isInWishlist(product.id);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setHeartPop(true);
    await toggleWishlist(product);
    setTimeout(() => setHeartPop(false), 250);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stockQuantity <= 0) return;
    addToCart(product, 1, false);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantityInCart < product.stockQuantity) {
      updateQuantity(product.id, quantityInCart + 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 250);
    }
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantityInCart > 1) {
      updateQuantity(product.id, quantityInCart - 1);
      setPulse(true);
      setTimeout(() => setPulse(false), 250);
    } else {
      removeFromCart(product.id);
    }
  };

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div
      onClick={() => onNavigate('pdp', product.slug)}
      className="group bg-white dark:bg-[#1A1410] rounded-2xl overflow-hidden border border-[#ede7df] dark:border-[#2C211A] hover:border-[#c5b7a3] dark:hover:border-[#4E392B] hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
    >
      {/* Image Container - Square Aspect Ratio for Compact Luxury Presentation */}
      <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-[#231A14]">
        <img
          src={getFullImageUrl(product.imageUrl)}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={handleImageError}
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.isBestSeller && (
            <span className="bg-[#1E1611] dark:bg-rose-950 text-white text-[9px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full shadow-xs border border-transparent dark:border-rose-800/40">
              Best Seller
            </span>
          )}
          {product.discountPercent && product.discountPercent > 0 && (
            <span className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {product.discountPercent}% OFF
            </span>
          )}
        </div>

        {/* Volume badge */}
        {product.volume && (
          <span className="absolute bottom-2 left-2 bg-white/80 dark:bg-[#1A1410]/90 backdrop-blur-xs text-neutral-800 dark:text-[#EDE4DA] text-[9px] font-medium px-1.5 py-0.5 rounded border border-white/50 dark:border-[#2C211A]">
            {product.volume}
          </span>
        )}

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleToggleWishlist}
          className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm backdrop-blur-xs select-none z-10 ${
            isWishlisted
              ? 'bg-white dark:bg-[#1A1410] text-rose-600 dark:text-rose-400 scale-105 shadow-rose-200 dark:shadow-none border border-rose-100 dark:border-rose-900/50'
              : 'bg-white/80 dark:bg-[#1A1410]/80 text-neutral-400 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-[#251D18] border border-white/60 dark:border-[#2C211A]'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart
            className={`w-3.5 h-3.5 transition-all duration-200 ${
              isWishlisted ? 'fill-rose-600 dark:fill-rose-500 text-rose-600 dark:text-rose-500' : 'stroke-[1.75]'
            } ${heartPop ? 'scale-125' : 'scale-100'}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Brand & Subcategory */}
          <div className="flex justify-between items-center text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5">
            <span className="font-semibold text-neutral-500 dark:text-neutral-400 truncate max-w-[50%]">{product.brand}</span>
            <span className="truncate max-w-[45%] text-right">{product.subCategory}</span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] group-hover:text-rose-700 dark:group-hover:text-rose-400 transition line-clamp-2 leading-snug">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1 text-xs">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-neutral-800 dark:text-[#EDE4DA]">{product.rating}</span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">({product.reviewCount})</span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-neutral-100 dark:border-[#2C211A] flex items-center justify-between gap-1.5">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-neutral-900 dark:text-[#EDE4DA]">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-[11px] text-neutral-400 dark:text-neutral-500 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            {/* Stock indicator */}
            <div className="mt-0.5">
              {isOutOfStock ? (
                <span className="text-[10px] text-red-600 dark:text-red-400 font-medium">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Only {product.stockQuantity} left</span>
              ) : (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">In Stock</span>
              )}
            </div>
          </div>

          {/* Easy Cart Interactive Button */}
          <div className="relative shrink-0">
            {/* Animated Floating Badge when newly added */}
            {justAdded && (
              <div className="absolute -top-6 right-0 z-20 pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-200">
                <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 whitespace-nowrap">
                  <Check className="w-2.5 h-2.5" />
                  <span>Added</span>
                </span>
              </div>
            )}

            {quantityInCart === 0 ? (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`h-8 px-2.5 sm:px-3 rounded-full transition-all duration-200 flex items-center gap-1 text-[11px] font-semibold shadow-2xs select-none ${
                  isOutOfStock
                    ? 'bg-neutral-100 dark:bg-[#231A14] text-neutral-400 dark:text-neutral-600 border border-neutral-200 dark:border-[#2C211A] cursor-not-allowed'
                    : 'bg-[#1E1611] dark:bg-rose-900 text-white hover:bg-rose-700 dark:hover:bg-rose-800 active:scale-95'
                }`}
                title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Add</span>
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="h-8 px-1 rounded-full bg-[#1E1611] dark:bg-[#251A14] text-white flex items-center gap-0.5 shadow-md border border-neutral-800 dark:border-[#3D2D23] transition-all duration-300 animate-in zoom-in-95 select-none"
              >
                <button
                  type="button"
                  onClick={handleDecrease}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition"
                  title={quantityInCart === 1 ? 'Remove from cart' : 'Decrease quantity'}
                >
                  <Minus className="w-3 h-3" />
                </button>

                <span
                  className={`font-mono text-xs font-bold text-amber-300 px-1 min-w-[18px] text-center transition-transform duration-200 ${
                    pulse ? 'scale-125 text-white' : 'scale-100'
                  }`}
                >
                  {quantityInCart}
                </span>

                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={quantityInCart >= product.stockQuantity}
                  className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                  title={
                    quantityInCart >= product.stockQuantity
                      ? 'Maximum available stock reached'
                      : 'Add another unit'
                  }
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
