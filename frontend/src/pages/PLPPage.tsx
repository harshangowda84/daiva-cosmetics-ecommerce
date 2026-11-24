import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, Sparkles, RefreshCw, X } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { ProductCard } from '../components/ProductCard';
import { RecentlyViewedSection } from '../components/RecentlyViewedSection';

interface PLPPageProps {
  initialSubCategory?: string;
  onNavigate: (page: string, param?: string) => void;
}

export const PLPPage: React.FC<PLPPageProps> = ({ initialSubCategory = 'All', onNavigate }) => {
  const { settings, navbarCategories } = useSettings();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const showCategoryPills = settings.plp_show_category_pills !== 'false';
  const showRecentlyViewed = settings.plp_show_recently_viewed !== 'false';

  const subCategories = React.useMemo(() => {
    const activeItems = (navbarCategories || []).filter((c) => c.active !== false);
    return ['All', ...activeItems.map((c) => c.slug || c.name)];
  }, [navbarCategories]);

  const getCleanSubCategory = (sub?: string) => {
    if (!sub || sub === 'All') return 'All';
    try {
      return decodeURIComponent(sub);
    } catch {
      return sub;
    }
  };

  // Filters
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(() => getCleanSubCategory(initialSubCategory));
  const [selectedSkinType, setSelectedSkinType] = useState<string>('All Skin Types');
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [isDesktopFiltersOpen, setIsDesktopFiltersOpen] = useState(true);

  const activeFilterCount =
    (selectedSubCategory !== 'All' ? 1 : 0) +
    (selectedSkinType !== 'All Skin Types' ? 1 : 0) +
    (minPrice !== undefined || maxPrice !== undefined ? 1 : 0);

  useEffect(() => {
    if (initialSubCategory) {
      setSelectedSubCategory(getCleanSubCategory(initialSubCategory));
    }
  }, [initialSubCategory]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await api.getProducts({
          subCategory: selectedSubCategory,
          skinType: selectedSkinType,
          minPrice,
          maxPrice,
          sortBy,
        });
        setProducts(data);
      } catch (err) {
        console.error('Failed to fetch PLP products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedSubCategory, selectedSkinType, minPrice, maxPrice, sortBy]);

  const skinTypes = [
    'All Skin Types',
    'Dry & Sensitive',
    'Oily / Acne-Prone',
    'Mature & Normal',
  ];

  const handleResetFilters = () => {
    setSelectedSubCategory('All');
    onNavigate('plp', 'All');
    setSelectedSkinType('All Skin Types');
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setSortBy('newest');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="bg-[#FAF5EF] dark:bg-[#1A1410] rounded-3xl p-6 sm:p-10 border border-[#EAE1D3] dark:border-[#2C211A] relative overflow-hidden transition-colors">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white dark:bg-[#251D18] text-rose-700 dark:text-rose-400 text-xs font-semibold mb-3 border border-rose-100 dark:border-rose-900/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Organic Beauty Collection</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900 dark:text-[#EDE4DA] font-medium">
            {selectedSubCategory === 'All' ? 'Complete Cosmetics Collection' : selectedSubCategory}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 font-light">
            Crafted with clean bio-actives, cold-pressed botanical oils, and clinical skin-loving nutrients.
          </p>
        </div>
      </div>

      {/* Main Grid with Sidebar Filter */}
      <div className={`grid grid-cols-1 ${isDesktopFiltersOpen ? 'lg:grid-cols-4' : 'lg:grid-cols-1'} gap-8 items-start transition-all duration-300`}>
        {/* Desktop Filter Sidebar (Sticky) */}
        {isDesktopFiltersOpen && (
          <aside
            role="complementary"
            aria-label="Product filters"
            className="hidden lg:block space-y-6 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto pr-1 z-10"
          >
            <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-6 border border-[#ede7df] dark:border-[#2C211A] shadow-sm space-y-6 transition-colors">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100 dark:border-[#2C211A]">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900 dark:text-[#EDE4DA]">
                  <Filter className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                  <span>Filters</span>
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs text-rose-700 dark:text-rose-400 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Subcategories */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3">
                  Cosmetics Subcategory
                </h4>
                <div className="space-y-1.5">
                  {subCategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubCategory(sub);
                        onNavigate('plp', sub);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                        selectedSubCategory === sub
                          ? 'bg-[#1E1611] dark:bg-rose-950 text-white dark:border dark:border-rose-800/40'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#FAF9F6] dark:hover:bg-[#251D18] dark:hover:text-white'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin Type */}
              <div className="pt-4 border-t border-neutral-100 dark:border-[#2C211A]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3">
                  Skin Type
                </h4>
                <div className="space-y-1.5">
                  {skinTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedSkinType(type)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                        selectedSkinType === type
                          ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60'
                          : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#FAF9F6] dark:hover:bg-[#251D18] dark:hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="pt-4 border-t border-neutral-100 dark:border-[#2C211A]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-3">
                  Price (₹)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice !== undefined ? minPrice : ''}
                    onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice !== undefined ? maxPrice : ''}
                    onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Product Grid Area */}
        <div className={`${isDesktopFiltersOpen ? 'lg:col-span-3' : 'lg:col-span-1'} space-y-6 transition-all duration-300`}>
          {/* Top Sort & Count Bar */}
          <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-4 border border-[#ede7df] dark:border-[#2C211A] flex flex-wrap justify-between items-center gap-4 transition-colors">
            <div className="flex items-center gap-4">
              {/* Desktop Filter Toggle Button */}
              <button
                onClick={() => setIsDesktopFiltersOpen((prev) => !prev)}
                className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-[#382B21] text-xs font-semibold text-neutral-800 dark:text-[#EDE4DA] bg-[#FAF9F6] dark:bg-[#251D18] hover:border-neutral-400 dark:hover:border-neutral-500 transition-all shadow-2xs"
                title={isDesktopFiltersOpen ? "Hide filters for wider product view" : "Show sidebar filters"}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-700 dark:text-rose-400" />
                <span>{isDesktopFiltersOpen ? 'Hide Filters' : 'Show Filters'}</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                Showing <span className="font-bold text-neutral-900 dark:text-[#EDE4DA]">{products.length}</span> cosmetic items
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mobile Filter Trigger */}
              <button
                onClick={() => setIsMobileFiltersOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-300 dark:border-[#382B21] text-xs font-semibold text-neutral-800 dark:text-[#EDE4DA] bg-white dark:bg-[#251D18]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-medium bg-[#FAF9F6] dark:bg-[#251D18] border border-neutral-200 dark:border-[#382B21] rounded-xl px-3 py-2 text-neutral-800 dark:text-[#EDE4DA] focus:outline-none"
                >
                  <option value="newest">Sort by: Newest Arrivals</option>
                  <option value="rating">Sort by: Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${isDesktopFiltersOpen ? 'xl:grid-cols-4' : 'xl:grid-cols-5'} gap-3 sm:gap-4 lg:gap-5 items-stretch`}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div key={n} className="bg-white dark:bg-[#1A1410] rounded-2xl h-64 animate-pulse border border-neutral-100 dark:border-[#2C211A]" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-12 text-center border border-neutral-200 dark:border-[#2C211A] space-y-3">
              <p className="font-serif text-lg text-neutral-700 dark:text-neutral-300">No cosmetics match your selected filters</p>
              <p className="text-xs text-neutral-400">Try adjusting your price range or skin type.</p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-5 py-2 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 transition"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 ${isDesktopFiltersOpen ? 'xl:grid-cols-4' : 'xl:grid-cols-5'} gap-3 sm:gap-4 lg:gap-5 items-stretch`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recently Viewed Cosmetics (Browsing History) */}
      {showRecentlyViewed && (
        <div className="mt-14 pt-4">
          <RecentlyViewedSection onNavigate={onNavigate} maxItems={6} />
        </div>
      )}

      {/* Mobile Filters Drawer */}
      {isMobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFiltersOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-4 border-b border-neutral-100">
                <div className="flex items-center gap-2 text-sm font-bold text-neutral-900">
                  <Filter className="w-4 h-4 text-rose-700" />
                  <span>Filters</span>
                </div>
                <button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Subcategories */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                  Cosmetics Subcategory
                </h4>
                <div className="space-y-1.5">
                  {subCategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubCategory(sub);
                        onNavigate('plp', sub);
                        setIsMobileFiltersOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                        selectedSubCategory === sub
                          ? 'bg-[#1E1611] text-white'
                          : 'text-neutral-600 hover:bg-[#FAF9F6]'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin Type */}
              <div className="pt-4 border-t border-neutral-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                  Skin Type
                </h4>
                <div className="space-y-1.5">
                  {skinTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedSkinType(type);
                        setIsMobileFiltersOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition ${
                        selectedSkinType === type
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'text-neutral-600 hover:bg-[#FAF9F6]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-100 flex gap-2">
              <button
                onClick={() => {
                  handleResetFilters();
                  setIsMobileFiltersOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-700"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFiltersOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-rose-700 text-xs font-semibold text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
