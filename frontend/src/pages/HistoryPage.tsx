import React from 'react';
import { History, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { useBrowsingHistory } from '../context/BrowsingHistoryContext';
import { ProductCard } from '../components/ProductCard';

interface HistoryPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onNavigate }) => {
  const { history, removeFromHistory, clearHistory, totalHistoryCount } = useBrowsingHistory();

  const handleRemove = async (productId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await removeFromHistory(productId);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 items-stretch">
          {history.map(({ product }) => (
            <div key={product.id} className="relative group/history h-full flex flex-col">
              {/* Native PLP Product Card */}
              <ProductCard product={product} onNavigate={onNavigate} />

              {/* Quick Remove from History Button (hover overlay) */}
              <button
                type="button"
                onClick={(e) => handleRemove(product.id, e)}
                title="Remove from history"
                className="absolute top-2.5 right-11 z-20 w-8 h-8 rounded-full bg-white/95 dark:bg-[#1A1410]/95 backdrop-blur-xs flex items-center justify-center text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition shadow-xs opacity-0 group-hover/history:opacity-100 border border-neutral-200 dark:border-neutral-700"
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
