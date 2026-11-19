import React, { useState, useEffect, useMemo } from 'react';
import { X, Star, ShoppingBag, Check, Heart, ExternalLink, Sparkles, ShieldCheck, Truck } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, param?: string) => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [added, setAdded] = useState(false);

  // Parse volume / quantity variants (e.g. 10ml, 50ml, 100ml)
  const parsedVariants = useMemo<ProductVariant[]>(() => {
    if (!product) return [];
    if (product.variants && product.variants.length > 0) return product.variants;
    if (product.variantsJson) {
      try {
        const parsed = JSON.parse(product.variantsJson);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return [];
  }, [product]);

  // Synchronize initial state when modal opens or product changes
  useEffect(() => {
    if (product) {
      setSelectedImage(product.imageUrl);
      setQuantity(1);
      setAdded(false);
      if (parsedVariants.length > 0) {
        const match = parsedVariants.find((v) => v.stock > 0) || parsedVariants[0];
        setSelectedVariant(match);
      } else {
        setSelectedVariant(null);
      }
    }
  }, [product, parsedVariants]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const galleryList = product.galleryImages
    ? product.galleryImages.split(',').map((img) => img.trim()).filter(Boolean)
    : [product.imageUrl];

  // Price & Stock derived from active variant or base product
  const currentPrice = selectedVariant ? selectedVariant.price : product.price;
  const currentOriginalPrice = selectedVariant?.originalPrice ?? product.originalPrice;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stockQuantity;
  const currentDiscountPercent =
    currentOriginalPrice && currentOriginalPrice > currentPrice
      ? Math.round(((currentOriginalPrice - currentPrice) / currentOriginalPrice) * 100)
      : product.discountPercent;

  const isLowStock = currentStock > 0 && currentStock <= 5;
  const isOutOfStock = currentStock <= 0;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (currentStock <= 0) return;
    addToCart(
      product,
      quantity,
      true, // open cart drawer
      false,
      selectedVariant?.size,
      selectedVariant?.price
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleGoToPDP = () => {
    onClose();
    onNavigate('pdp', product.slug);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-[#FAF9F6] dark:bg-[#16100D] border border-[#EAE1D3] dark:border-[#2C211A] rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden max-h-[92vh] flex flex-col md:flex-row text-neutral-800 dark:text-[#EDE4DA]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/80 dark:bg-[#201813]/80 hover:bg-white dark:hover:bg-[#2C211A] text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-[#EDE4DA] flex items-center justify-center shadow-xs border border-neutral-200/60 dark:border-[#2C211A] transition"
          title="Close quick view"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Column: Image & Thumbnails */}
        <div className="md:w-1/2 p-5 sm:p-6 bg-white dark:bg-[#1A1410] border-b md:border-b-0 md:border-r border-[#EAE1D3] dark:border-[#2C211A] flex flex-col justify-between">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF9F6] dark:bg-[#201813] border border-neutral-200/80 dark:border-[#2C211A]">
            <img
              src={getFullImageUrl(selectedImage || product.imageUrl)}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
              onError={handleImageError}
            />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
              {currentDiscountPercent && currentDiscountPercent > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  {currentDiscountPercent}% OFF
                </span>
              )}
              {product.isBestSeller && (
                <span className="bg-[#1E1611] dark:bg-rose-950 text-white text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full shadow-xs border border-white/20">
                  Best Seller
                </span>
              )}
            </div>
          </div>

          {/* Gallery Thumbnails */}
          {galleryList.length > 1 && (
            <div className="flex gap-2 pt-3 overflow-x-auto pb-1 scrollbar-none">
              {galleryList.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    (selectedImage || product.imageUrl) === img
                      ? 'border-rose-600 dark:border-rose-500 scale-95 shadow-xs'
                      : 'border-neutral-200 dark:border-[#2C211A] opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getFullImageUrl(img)}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Assurance footer */}
          <div className="pt-3 hidden md:flex items-center justify-between text-[11px] text-neutral-500 dark:text-[#A89A90] border-t border-neutral-100 dark:border-[#2C211A] mt-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Authentic
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-rose-600" /> Free Shipping &gt; ₹999
            </span>
          </div>
        </div>

        {/* Right Column: Details & Fast Buy */}
        <div className="md:w-1/2 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto space-y-4">
          <div className="space-y-3">
            {/* Brand & Subcategory */}
            <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <span className="font-bold text-rose-700 dark:text-rose-400">{product.brand}</span>
              <span>{product.subCategory}</span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-lg sm:text-xl font-medium leading-snug text-neutral-900 dark:text-[#EDE4DA]">
              {product.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.floor(product.rating || 5) ? 'fill-current' : 'text-neutral-300 dark:text-neutral-700'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold">{product.rating || 4.9}</span>
              <span className="text-xs text-neutral-400">({product.reviewCount || 1} reviews)</span>
            </div>

            {/* Price Box */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#1A1410] border border-[#EAE1D3] dark:border-[#2C211A] flex items-baseline justify-between">
              <div className="flex items-baseline gap-2.5">
                <span className="font-serif text-2xl font-bold text-neutral-900 dark:text-[#EDE4DA]">
                  ₹{currentPrice.toLocaleString()}
                </span>
                {currentOriginalPrice && currentOriginalPrice > currentPrice && (
                  <span className="text-xs text-neutral-400 line-through">
                    ₹{currentOriginalPrice.toLocaleString()}
                  </span>
                )}
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">Taxes incl.</span>
              </div>

              {/* Stock Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="text-[11px]">
                  {isOutOfStock ? 'Out of Stock' : isLowStock ? `${currentStock} left` : 'In Stock'}
                </span>
              </div>
            </div>

            {/* Size / Volume Variants (if configured) */}
            {parsedVariants.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold flex items-center gap-1 text-[11px] text-neutral-700 dark:text-neutral-300">
                    <Sparkles className="w-3 h-3 text-rose-600" />
                    <span>Select Size / Volume:</span>
                  </span>
                  {selectedVariant && (
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                      {selectedVariant.label || selectedVariant.size}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {parsedVariants.map((v) => {
                    const isSelected = selectedVariant?.size === v.size;
                    const isSoldOut = v.stock <= 0;
                    return (
                      <button
                        key={v.size}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => setSelectedVariant(v)}
                        className={`p-2 rounded-xl text-center border transition select-none cursor-pointer ${
                          isSelected
                            ? 'bg-[#1E1611] dark:bg-rose-950 text-white border-[#1E1611] dark:border-rose-600 shadow-sm'
                            : isSoldOut
                            ? 'bg-neutral-100 dark:bg-[#201813] text-neutral-400 border-neutral-200 dark:border-[#2C211A] cursor-not-allowed opacity-50 line-through'
                            : 'bg-white dark:bg-[#201813] text-neutral-800 dark:text-[#EDE4DA] border-neutral-200 dark:border-[#2C211A] hover:border-rose-400'
                        }`}
                      >
                        <div className="font-bold text-xs">{v.size}</div>
                        <div className={`text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-amber-300' : 'text-rose-700 dark:text-rose-400'}`}>
                          ₹{v.price.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description / Key Actives Preview */}
            <div className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
              {product.description || (product.keyIngredients ? `Key Actives: ${product.keyIngredients}` : 'Luxury clean botanical cosmetic formula.')}
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-2.5 pt-2 border-t border-neutral-200/80 dark:border-[#2C211A]">
            <div className="flex items-center gap-2">
              {/* Quantity stepper */}
              <div className="flex items-center border border-neutral-300 dark:border-[#382B21] rounded-full bg-white dark:bg-[#201813] shrink-0">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2C211A] text-xs font-bold rounded-l-full"
                >
                  -
                </button>
                <span className="px-2.5 text-xs font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="px-2.5 py-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#2C211A] text-xs font-bold rounded-r-full"
                >
                  +
                </button>
              </div>

              {/* Add to Bag Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-2.5 px-4 rounded-full font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs ${
                  isOutOfStock
                    ? 'bg-neutral-200 dark:bg-[#231A14] text-neutral-400 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#1E1611] dark:bg-rose-900 text-white hover:bg-rose-800 active:scale-95'
                }`}
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{added ? 'Added to Bag ✓' : 'Add to Bag'}</span>
              </button>

              {/* Wishlist toggle button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                className={`p-2.5 rounded-full border transition flex items-center justify-center shrink-0 ${
                  isWishlisted
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                    : 'border-neutral-300 dark:border-[#2C211A] text-neutral-600 dark:text-neutral-300 hover:border-rose-300 hover:text-rose-600 bg-white dark:bg-[#201813]'
                }`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>
            </div>

            {/* View Full Product Details Link */}
            <button
              type="button"
              onClick={handleGoToPDP}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-[#201813] transition flex items-center justify-center gap-1.5"
            >
              <span>View full product details & reviews</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
