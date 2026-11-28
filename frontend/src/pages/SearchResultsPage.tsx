import React, { useState, useEffect } from 'react';
import { Search, Sparkles, ArrowRight, X } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { VoiceSearchButton } from '../components/VoiceSearchButton';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface SearchResultsPageProps {
  query: string;
  onNavigate: (page: string, param?: string) => void;
}

export const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ query, onNavigate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(query);

  const {
    isListening,
    isSupported: isVoiceSupported,
    toggleListening,
  } = useVoiceRecognition({
    onTranscriptChange: (text) => {
      setSearchTerm(text);
    },
    onFinalTranscript: (finalText) => {
      setSearchTerm(finalText);
      fetchResults(finalText);
    },
  });

  const fetchResults = async (q: string) => {
    try {
      setLoading(true);
      const results = await api.searchProducts(q);
      setProducts(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm(query);
    fetchResults(query);
  }, [query]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      fetchResults(searchTerm.trim());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search Header */}
      <div className="bg-[#FAF5EF] rounded-3xl p-6 sm:p-10 border border-[#EAE1D3]">
        <div className="max-w-xl">
          <span className="text-xs uppercase tracking-widest text-rose-700 font-bold flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Global Cosmetics Search</span>
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900 font-medium">
            Search Results for <span className="italic font-normal text-rose-800">"{searchTerm}"</span>
          </h1>

          {/* Quick inline search bar with Voice Search */}
          <form onSubmit={handleSearchSubmit} className="relative mt-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isListening ? "Listening... Speak your cosmetics query..." : "Search cosmetics by name, brand, active ingredient..."}
              className={`w-full text-xs sm:text-sm bg-white dark:bg-[#1A1410] rounded-full pl-10 pr-32 py-3 border focus:outline-none focus:ring-2 shadow-sm transition ${
                isListening
                  ? 'border-rose-500 ring-2 ring-rose-500/50 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-neutral-300 dark:border-[#2C211A] focus:ring-rose-500'
              }`}
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3.5" />

            <div className="absolute right-20 top-2.5 flex items-center gap-1">
              {searchTerm && !isListening && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 transition"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <VoiceSearchButton
                isListening={isListening}
                isSupported={isVoiceSupported}
                onToggle={toggleListening}
                size="sm"
              />
            </div>

            <button
              type="submit"
              className="absolute right-2 top-2 px-4 py-1.5 rounded-full bg-[#1E1611] dark:bg-rose-950 text-white text-xs font-semibold hover:bg-rose-700 transition cursor-pointer"
            >
              Search
            </button>
          </form>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex justify-between items-center text-xs text-neutral-600">
        <p>Found <strong className="text-neutral-900">{products.length}</strong> matching cosmetic products</p>
        <button
          onClick={() => onNavigate('plp', 'All')}
          className="text-rose-700 hover:text-rose-800 font-semibold"
        >
          View All Cosmetics →
        </button>
      </div>

      {/* Product Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl h-80 animate-pulse border border-neutral-100" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 max-w-lg mx-auto space-y-4 shadow-sm">
          <Search className="w-12 h-12 text-neutral-300 mx-auto" />
          <h3 className="font-serif text-xl text-neutral-800">No matching cosmetics found</h3>
          <p className="text-xs text-neutral-500 leading-relaxed">
            We couldn't find any products matching "{searchTerm}". Try searching for popular terms like "Niacinamide", "Lipstick", "Ceramide", or "SPF".
          </p>
          <div className="flex justify-center gap-2 pt-2">
            {['Serum', 'Lipstick', 'Sunscreen', 'Moisturizer'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSearchTerm(tag);
                  fetchResults(tag);
                }}
                className="px-3 py-1 bg-[#FAF5EF] rounded-full text-xs font-medium text-neutral-700 hover:bg-rose-100 transition"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      )}
    </div>
  );
};
