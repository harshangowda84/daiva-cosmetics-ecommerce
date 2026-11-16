import React from 'react';
import { History, ArrowRight, Star, ShoppingBag, Eye } from 'lucide-react';
import { useBrowsingHistory } from '../context/BrowsingHistoryContext';
import { useCart } from '../context/CartContext';
import { Product } from '../types';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface RecentlyViewedSectionProps {
  currentProductId?: number;
  onNavigate: (page: string, param?: string) => void;
  maxItems?: number;
  title?: string;
  subtitle?: string;
}

export const RecentlyViewedSection: React.FC<RecentlyViewedSectionProps> = ({
  currentProductId,
  onNavigate,
  maxItems = 6,
  title = 'Recently Viewed Cosmetics',
  subtitle = 'Pick up right where you left off in your beauty routine',
}) => {
  const { history } = useBrowsingHistory();
  const { addToCart } = useCart();

  // Filter out the current product if on PDP
  const filtered = history
    .filter((item) => item.product && item.product.id !== currentProductId)
    .slice(0, maxItems);

  if (filtered.length === 0) return null;

  return (
    <section className="pt-8 pb-4 border-t border-neutral-200/80 dark:border-[#2C211A]">
      <div className="flex justify-between items-end mb-4">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
            <History className="w-3 h-3" />
            <span>Browsing History</span>
          </span>
          <h3 className="font-serif text-lg sm:text-xl text-neutral-900 dark:text-[#EDE4DA] mt-0.5">
            {title}
          </h3>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            {subtitle}
          </p>
        </div>

        {/* View All History Button */}
        <button
          onClick={() => onNavigate('history')}
          className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1 py-1 px-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
        >
          <span>View All History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Ultra-Compact Cards Grid - Scaled down for sleek PLP/PDP footer display */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-2.5">
        {filtered.map(({ product }) => {
          const isOutOfStock = product.stockQuantity <= 0;

          return (
            <div
              key={product.id}
              onClick={() => onNavigate('pdp', product.slug)}
              className="group bg-white dark:bg-[#1A1410] rounded-xl overflow-hidden border border-[#ede7df] dark:border-[#2C211A] hover:border-rose-400 dark:hover:border-rose-800 hover:shadow-sm transition-all duration-200 flex flex-col cursor-pointer"
            >
              {/* Ultra-Compact Image Container */}
              <div className="relative aspect-square overflow-hidden bg-neutral-100 dark:bg-[#231A14]">
                <img
                  src={getFullImageUrl(product.imageUrl)}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={handleImageError}
                />

                {/* Micro Discount Badge */}
                {product.discountPercent && product.discountPercent > 0 && (
                  <span className="absolute top-1 left-1 bg-rose-600 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full shadow-xs">
                    {product.discountPercent}% OFF
                  </span>
                )}

                {/* Micro Rating */}
                {product.rating && (
                  <div className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-white text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <span>{product.rating.toFixed(1)}</span>
                    <Star className="w-1.5 h-1.5 fill-amber-400 text-amber-400" />
                  </div>
                )}
              </div>

              {/* Compact Information */}
              <div className="p-1.5 sm:p-2 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[8px] text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block font-semibold truncate">
                    {product.brand}
                  </span>
                  <h4 className="text-[10px] sm:text-[11px] font-medium text-neutral-900 dark:text-[#EDE4DA] group-hover:text-rose-700 dark:group-hover:text-rose-400 transition truncate mt-0.5">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-1.5 pt-1 border-t border-neutral-100 dark:border-[#2C211A] flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <span className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-[#EDE4DA]">
                      ₹{product.price.toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOutOfStock) {
                        addToCart(product, 1, false);
                      }
                    }}
                    disabled={isOutOfStock}
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition ${
                      isOutOfStock
                        ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-700 hover:text-white'
                    }`}
                    title={isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
                  >
                    <ShoppingBag className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
