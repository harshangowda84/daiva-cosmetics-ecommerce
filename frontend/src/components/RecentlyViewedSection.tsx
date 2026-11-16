import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import { useBrowsingHistory } from '../context/BrowsingHistoryContext';
import { ProductCard } from './ProductCard';

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
  maxItems = 4,
  title = 'Recently Viewed Cosmetics',
  subtitle = 'Pick up right where you left off in your beauty journey',
}) => {
  const { history } = useBrowsingHistory();

  // Filter out the current product if on PDP
  const filtered = history
    .filter((item) => item.product && item.product.id !== currentProductId)
    .slice(0, maxItems);

  if (filtered.length === 0) return null;

  return (
    <section className="pt-10 border-t border-neutral-200 dark:border-[#2C211A]">
      <div className="flex justify-between items-end mb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>Browsing History</span>
          </span>
          <h3 className="font-serif text-2xl text-neutral-900 dark:text-[#EDE4DA] mt-1">
            {title}
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {subtitle}
          </p>
        </div>

        <button
          onClick={() => onNavigate('history')}
          className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1 transition"
        >
          <span>View All History</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-6">
        {filtered.map(({ product }) => (
          <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  );
};
