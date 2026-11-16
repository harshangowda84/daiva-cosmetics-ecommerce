import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Star, Award, Droplets, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

interface HomePageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featured, all] = await Promise.all([
          api.getFeaturedProducts(),
          api.getProducts({ sortBy: 'rating' })
        ]);
        setFeaturedProducts(featured.slice(0, 4));
        setBestSellers(all.slice(0, 4));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const subCategories = [
    {
      title: 'Serums & Elixirs',
      subCat: 'Serums & Treatments',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80',
      desc: 'High-potency clinical actives & botanical extracts',
    },
    {
      title: 'Lipsticks & Lip Care',
      subCat: 'Lip Care & Makeup',
      image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=600&q=80',
      desc: 'Silken hydration & rich long-wearing pigments',
    },
    {
      title: 'Barrier Moisturisers',
      subCat: 'Moisturizers',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      desc: 'Multi-ceramide restoration for sensitive skin',
    },
    {
      title: 'Invisible Sun Care',
      subCat: 'Sun Care',
      image: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=600&q=80',
      desc: 'Zero-cast SPF 50+ broad-spectrum shields',
    },
  ];

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#201712] text-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-rose-300 text-xs tracking-wider uppercase font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Organic Clinical Beauty</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl leading-[1.18] sm:leading-[1.15] font-medium tracking-tight">
              Luminescence Born From <span className="italic font-normal text-rose-200">Pure Botanicals</span>
            </h1>

            <p className="text-neutral-300 text-sm sm:text-lg max-w-xl leading-relaxed font-light">
              Experience clinically proven organic formulations that restore your skin barrier, hydrate deeply, and provide an effortless, radiant glow for every skin type.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('plp', 'All')}
                className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-white text-[#1E1611] font-semibold text-sm hover:bg-rose-100 transition shadow-xl flex items-center justify-center gap-2 group"
              >
                <span>Shop Cosmetics Range</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </button>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-6 border-t border-white/15 text-[10px] sm:text-xs text-neutral-300">
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-white">100%</p>
                <p className="text-neutral-400">Vegan & Clean</p>
              </div>
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-white">4.9 ★</p>
                <p className="text-neutral-400">Customer Rating</p>
              </div>
              <div>
                <p className="font-serif text-xl sm:text-2xl font-bold text-white">Clinical</p>
                <p className="text-neutral-400">Approved Formulas</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-6 lg:mt-0">
            <div className="relative mx-auto max-w-sm lg:max-w-none">
              <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=85"
                  alt="Lumière Glow Serum"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating Highlight Card */}
              <div className="absolute -bottom-4 left-3 sm:-bottom-6 sm:-left-6 bg-white/95 dark:bg-[#1A1410]/95 backdrop-blur-md text-neutral-900 dark:text-white p-3 sm:p-4 rounded-2xl shadow-xl border border-white/60 dark:border-[#2C211A] max-w-[200px] sm:max-w-[220px]">
                <div className="flex items-center gap-1.5 text-amber-500 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white line-clamp-1">Lumière 10% Niacinamide</p>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">128 Verified Reviews</p>
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 mt-1">₹899 <span className="line-through text-neutral-400 font-normal">₹1,299</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Cosmetics Collections */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold">
              Targeted Formulations
            </span>
            <h2 className="font-serif text-3xl text-neutral-900 dark:text-[#EDE4DA] mt-1">
              Curated Cosmetics Categories
            </h2>
          </div>
          <button
            onClick={() => onNavigate('plp', 'All')}
            className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800 flex items-center gap-1 mt-3 md:mt-0"
          >
            <span>View All Cosmetics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subCategories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('plp', cat.subCat)}
              className="group relative rounded-2xl overflow-hidden bg-white dark:bg-[#1A1410] border border-[#eae3d9] dark:border-[#2C211A] hover:border-[#c5b7a3] dark:hover:border-[#4E392B] shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden bg-neutral-100 dark:bg-[#231A14]">
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA] group-hover:text-rose-700 dark:group-hover:text-rose-400 transition">
                    {cat.title}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{cat.desc}</p>
                </div>
                <div className="mt-4 pt-2 flex items-center text-xs font-semibold text-rose-700 dark:text-rose-400">
                  <span>Explore category</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Cosmetics Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold">
            Editor's Choice
          </span>
          <h2 className="font-serif text-3xl text-neutral-900 dark:text-[#EDE4DA] mt-1">
            Featured Cosmetics Essentials
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
            Top-rated botanical serums, nourishing lipsticks, and dermatologist-approved daily barrier protection.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white dark:bg-[#1A1410] rounded-2xl h-64 animate-pulse border border-neutral-100 dark:border-[#2C211A]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
            ))}
          </div>
        )}
      </section>

      {/* Clean Beauty Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FAF5EF] dark:bg-[#1A1410] rounded-3xl p-8 sm:p-12 border border-[#E8DEC8] dark:border-[#2C211A] grid grid-cols-1 lg:grid-cols-3 gap-8 items-center transition-colors">
          <div className="lg:col-span-2 space-y-4">
            <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>The Clean Beauty Standard</span>
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-neutral-900 dark:text-[#EDE4DA]">
              Formulated With Care for Sensitive Skin
            </h3>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-light">
              Every formula in our cosmetics collection is created with skin-barrier-first science. We source cold-pressed organic botanicals and bio-compatible ceramides that work with your skin, never against it.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-neutral-700 dark:text-neutral-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>100% Free of Parabens & Phthalates</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Non-Comedogenic & Low Sensitizing</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Sustainably Sourced Raw Ingredients</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Recyclable Luxury Glass Packaging</span>
              </div>
            </div>
          </div>
          <div className="text-center lg:text-right">
            <button
              onClick={() => onNavigate('plp', 'All')}
              className="px-8 py-3.5 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 transition shadow-lg"
            >
              Explore Full Range →
            </button>
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold">
              Most Loved
            </span>
            <h2 className="font-serif text-3xl text-neutral-900 dark:text-[#EDE4DA] mt-1">
              Best Selling Cosmetics
            </h2>
          </div>
          <button
            onClick={() => onNavigate('plp', 'All')}
            className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800 flex items-center gap-1 mt-3 md:mt-0"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-6">
          {bestSellers.map((product) => (
            <ProductCard key={product.id} product={product} onNavigate={onNavigate} />
          ))}
        </div>
      </section>
    </div>
  );
};
