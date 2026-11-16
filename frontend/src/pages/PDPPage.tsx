import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  ShieldCheck,
  Truck,
  RefreshCw,
  ShoppingBag,
  Zap,
  Check,
  ArrowLeft,
  Database,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Camera,
  X,
  AlertCircle,
  Loader2,
  Heart,
  Share2
} from 'lucide-react';
import { Product, ProductReview, ReviewSummaryResponse } from '../types';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useBrowsingHistory } from '../context/BrowsingHistoryContext';
import { ProductCard } from '../components/ProductCard';
import { RecentlyViewedSection } from '../components/RecentlyViewedSection';
import { ShareProductModal } from '../components/ShareProductModal';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface PDPPageProps {
  slug: string;
  onNavigate: (page: string, param?: string) => void;
}

export const PDPPage: React.FC<PDPPageProps> = ({ slug, onNavigate }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { recordView } = useBrowsingHistory();
  const reviewsRef = useRef<HTMLDivElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'ingredients' | 'howToUse'>('details');
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // Customer Reviews Read-Only Display States
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummaryResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Sorted reviews (5-star reviews on top, then 4, 3, etc.) and 5-star customer images first
  const sortedReviews = React.useMemo(() => {
    if (!reviewSummary?.reviews) return [];
    return [...reviewSummary.reviews].sort((a, b) => {
      const diff = (b.rating || 0) - (a.rating || 0);
      if (diff !== 0) return diff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reviewSummary?.reviews]);

  const sortedCustomerPhotos = React.useMemo(() => {
    const photos: string[] = [];
    // 1. Collect photos from 5-star reviews first, then descending
    sortedReviews.forEach((rev) => {
      if (rev.imagesJson) {
        try {
          const parsed = JSON.parse(rev.imagesJson);
          if (Array.isArray(parsed)) {
            parsed.forEach((img: string) => {
              if (img && !photos.includes(img)) photos.push(img);
            });
          }
        } catch (_) {}
      }
    });
    // 2. Append any remaining photos from summary
    if (reviewSummary?.customerPhotos) {
      reviewSummary.customerPhotos.forEach((img) => {
        if (img && !photos.includes(img)) photos.push(img);
      });
    }
    return photos;
  }, [sortedReviews, reviewSummary?.customerPhotos]);

  const loadProductReviews = async (productId: number) => {
    try {
      setLoadingReviews(true);
      const summary = await api.getProductReviews(productId);
      setReviewSummary(summary);
    } catch (e) {
      console.error('Failed to load reviews:', e);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const data = await api.getProductBySlug(slug);
        setProduct(data);
        setSelectedImage(data.imageUrl);
        recordView(data);

        // Fetch related products
        const subProducts = await api.getProducts({ subCategory: data.subCategory });
        let related = subProducts.filter((p) => p.id !== data.id);
        if (related.length < 5) {
          const allProducts = await api.getProducts();
          const additional = allProducts.filter(
            (p) => p.id !== data.id && p.category === data.category && !related.some((r) => r.id === p.id)
          );
          related = [...related, ...additional];
        }
        setRelatedProducts(related.slice(0, 5));

        // Load reviews and eligibility
        loadProductReviews(data.id);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4 max-w-md mx-auto">
          <div className="h-64 bg-neutral-200 rounded-2xl" />
          <div className="h-6 bg-neutral-200 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="font-serif text-2xl text-neutral-800">Cosmetic product not found</h2>
        <button
          onClick={() => onNavigate('plp', 'All')}
          className="px-6 py-2.5 rounded-full bg-[#1E1611] text-white text-xs font-semibold"
        >
          Return to Cosmetics Catalog
        </button>
      </div>
    );
  }

  const galleryList = product.galleryImages
    ? product.galleryImages.split(',').filter(Boolean)
    : [product.imageUrl];

  const handleAddToCart = () => {
    if (product.stockQuantity <= 0) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const handleBuyNow = () => {
    if (product.stockQuantity <= 0) return;
    addToCart(product, quantity);
    onNavigate('checkout');
  };

  const isWishlisted = product ? isInWishlist(product.id) : false;

  const handleToggleWishlist = async () => {
    if (!product) return;
    await toggleWishlist(product);
  };

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
  const isOutOfStock = product.stockQuantity <= 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-neutral-400">
        <button onClick={() => onNavigate('home')} className="hover:text-neutral-700">Home</button>
        <span>/</span>
        <button onClick={() => onNavigate('plp', 'All')} className="hover:text-neutral-700">Cosmetics</button>
        <span>/</span>
        <button onClick={() => onNavigate('plp', product.subCategory)} className="hover:text-neutral-700">{product.subCategory}</button>
        <span>/</span>
        <span className="text-neutral-800 font-medium truncate max-w-[200px]">{product.name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        {/* Left: Gallery Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/4] sm:aspect-[4/3] rounded-3xl overflow-hidden bg-white border border-[#EAE1D3] shadow-sm relative">
            <img
              src={getFullImageUrl(selectedImage || product.imageUrl)}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300"
              onError={handleImageError}
            />
            {product.discountPercent && product.discountPercent > 0 && (
              <span className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                {product.discountPercent}% OFF
              </span>
            )}
            {product.isBestSeller && (
              <span className="absolute top-4 right-4 bg-[#1E1611] text-white text-xs font-bold tracking-wider uppercase px-3 py-1 rounded-full shadow-md">
                Best Seller
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {galleryList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {galleryList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition ${
                    selectedImage === img ? 'border-rose-700 shadow-md scale-95' : 'border-neutral-200 hover:border-neutral-400'
                  }`}
                >
                  <img
                    src={getFullImageUrl(img)}
                    alt={`view-${idx}`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info Column (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs text-neutral-500 uppercase tracking-widest">
              <span className="font-semibold text-rose-800">{product.brand}</span>
              <span>SKU: {product.sku}</span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl text-neutral-900 dark:text-[#EDE4DA] font-medium mt-2 leading-tight">
              {product.name}
            </h1>

            {/* Rating Trigger */}
            <button
              type="button"
              onClick={() => {
                setReviewsOpen(true);
                reviewsRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 mt-3 cursor-pointer group text-left transition"
            >
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="text-sm font-semibold text-neutral-800 dark:text-[#EDE4DA]">
                {reviewSummary?.averageRating || product.rating}
              </span>
              <span className="text-xs text-neutral-400 group-hover:text-rose-700 dark:group-hover:text-rose-400 group-hover:underline transition">
                ({reviewSummary?.totalReviews || product.reviewCount} verified reviews)
              </span>
            </button>
          </div>

          {/* Pricing & Stock Status */}
          <div className="p-4 rounded-2xl bg-[#FAF5EF] dark:bg-[#1A1410] border border-[#EAE1D3] dark:border-[#2C211A] space-y-2 transition-colors">
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-3xl font-bold text-neutral-900 dark:text-[#EDE4DA]">
                ₹{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-neutral-400 line-through">
                  ₹{product.originalPrice.toLocaleString()}
                </span>
              )}
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Taxes included</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#EAE1D3] dark:border-[#2C211A] text-xs">
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span className="font-semibold text-neutral-800 dark:text-[#EDE4DA]">
                  {isOutOfStock ? 'Currently Out of Stock' : isLowStock ? `Hurry! Only ${product.stockQuantity} items left in stock` : `In Stock (${product.stockQuantity} available)`}
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">100% Authentic</span>
            </div>
          </div>

          {/* Specs pills */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-[#1A1410] rounded-xl border border-neutral-200 dark:border-[#2C211A]">
              <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider">Volume / Size</span>
              <span className="font-semibold text-neutral-800 dark:text-[#EDE4DA]">{product.volume || 'Standard'}</span>
            </div>
            <div className="p-3 bg-white dark:bg-[#1A1410] rounded-xl border border-neutral-200 dark:border-[#2C211A]">
              <span className="text-neutral-400 dark:text-neutral-500 block text-[10px] uppercase tracking-wider">Skin Type</span>
              <span className="font-semibold text-neutral-800 dark:text-[#EDE4DA] truncate block">{product.skinType}</span>
            </div>
          </div>

          {/* Quantity Selector & Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <div className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Quantity:</div>
              <div className="flex items-center border border-neutral-300 dark:border-[#382B21] rounded-xl bg-white dark:bg-[#251D18]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#33261D] text-sm font-bold"
                >
                  -
                </button>
                <span className="px-4 text-xs font-bold text-neutral-900 dark:text-[#EDE4DA]">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  className="px-3 py-1.5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#33261D] text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`flex-1 py-3.5 rounded-full font-semibold text-xs transition flex items-center justify-center gap-2 ${
                  isOutOfStock
                    ? 'bg-neutral-200 dark:bg-[#231A14] text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#1E1611] dark:bg-rose-900 text-white hover:bg-rose-700 dark:hover:bg-rose-800 active:scale-95'
                }`}
              >
                {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{added ? 'Added to Bag' : 'Add to Bag'}</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className={`flex-1 py-3.5 rounded-full font-semibold text-xs transition flex items-center justify-center gap-2 border ${
                  isOutOfStock
                    ? 'border-neutral-200 dark:border-[#2C211A] text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    : 'border-[#1E1611] dark:border-rose-400 text-[#1E1611] dark:text-rose-300 hover:bg-[#1E1611] dark:hover:bg-rose-950 hover:text-white'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Instant Buy Now</span>
              </button>

              {/* Wishlist Toggle Button */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`p-3.5 rounded-full border transition flex items-center justify-center shrink-0 ${
                  isWishlisted
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400'
                    : 'border-neutral-300 dark:border-[#2C211A] text-neutral-600 dark:text-neutral-300 hover:border-rose-300 hover:text-rose-600 bg-white dark:bg-[#1A1410] hover:bg-rose-50/50 dark:hover:bg-[#251D18]'
                }`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`} />
              </button>

              {/* Share Product Button */}
              <button
                type="button"
                onClick={() => setIsShareOpen(true)}
                className="p-3.5 rounded-full border border-neutral-300 dark:border-[#2C211A] text-neutral-600 dark:text-neutral-300 hover:border-rose-300 hover:text-rose-600 bg-white dark:bg-[#1A1410] hover:bg-rose-50/50 dark:hover:bg-[#251D18] transition flex items-center justify-center shrink-0"
                title="Share this cosmetic"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Delivery & Assurance */}
          <div className="pt-4 border-t border-neutral-200 dark:border-[#2C211A] space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              <span>Complimentary shipping on orders above ₹999</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              <span>100% Authentic, Clean Certified & Dermatologically Tested</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-rose-700 dark:text-rose-400" />
              <span>3-day hassle-free exchange & return policy</span>
            </div>
          </div>

          {/* Tabs: Details, Ingredients, How to Use */}
          <div className="pt-4 border-t border-neutral-200 dark:border-[#2C211A]">
            <div className="flex border-b border-neutral-200 dark:border-[#2C211A] gap-6 text-xs font-semibold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('details')}
                className={`pb-2 transition ${activeTab === 'details' ? 'border-b-2 border-rose-700 dark:border-rose-400 text-rose-700 dark:text-rose-400' : 'text-neutral-400 dark:text-neutral-500'}`}
              >
                Product Details
              </button>
              <button
                onClick={() => setActiveTab('ingredients')}
                className={`pb-2 transition ${activeTab === 'ingredients' ? 'border-b-2 border-rose-700 dark:border-rose-400 text-rose-700 dark:text-rose-400' : 'text-neutral-400 dark:text-neutral-500'}`}
              >
                Key Actives
              </button>
              <button
                onClick={() => setActiveTab('howToUse')}
                className={`pb-2 transition ${activeTab === 'howToUse' ? 'border-b-2 border-rose-700 dark:border-rose-400 text-rose-700 dark:text-rose-400' : 'text-neutral-400 dark:text-neutral-500'}`}
              >
                How To Use
              </button>
            </div>

            <div className="pt-4 text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
              {activeTab === 'details' && (
                <p>{product.description}</p>
              )}
              {activeTab === 'ingredients' && (
                <p className="bg-[#FAF5EF] dark:bg-[#1A1410] p-3 rounded-xl border border-[#EAE1D3] dark:border-[#2C211A]">
                  {product.keyIngredients || 'Niacinamide, Hyaluronic Acid, Organic Rosehip Extract.'}
                </p>
              )}
              {activeTab === 'howToUse' && (
                <p className="bg-[#FAF5EF] dark:bg-[#1A1410] p-3 rounded-xl border border-[#EAE1D3] dark:border-[#2C211A]">
                  {product.howToUse || 'Apply 2-3 drops on clean skin every morning and night.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDABLE REVIEWS DROPDOWN SECTION */}
      <section ref={reviewsRef} className="pt-8 border-t border-neutral-200 dark:border-[#2C211A]">
        <div className="bg-white dark:bg-[#1A1410] rounded-3xl border border-neutral-200 dark:border-[#2C211A] shadow-sm overflow-hidden transition-all duration-300">
          {/* Dropdown Toggle Header */}
          <div
            onClick={() => setReviewsOpen(!reviewsOpen)}
            className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/60 dark:hover:bg-[#251D18]/60 transition select-none"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold text-xl border border-amber-200/60 dark:border-amber-800/60 shadow-xs shrink-0">
                ★
              </div>
              <div>
                <h3 className="font-serif text-xl sm:text-2xl text-neutral-900 dark:text-[#EDE4DA] font-medium flex items-center gap-2.5 flex-wrap">
                  <span>Customer Reviews & Real Results</span>
                  <span className="text-xs bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 px-3 py-0.5 rounded-full font-sans font-bold border border-rose-200 dark:border-rose-900/60">
                    {reviewSummary?.totalReviews || product.reviewCount} Reviews
                  </span>
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  ★ {reviewSummary?.averageRating || product.rating} / 5 Rating • Verified buyers community
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>100% Verified Buyer Reviews</span>
              </span>

              <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-[#251D18] flex items-center justify-center text-neutral-600 dark:text-neutral-300 transition-transform duration-200">
                {reviewsOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </div>
            </div>
          </div>

          {/* Collapsible Dropdown Content */}
          {reviewsOpen && (
            <div className="p-6 sm:p-8 border-t border-neutral-100 dark:border-[#2C211A] space-y-8 animate-in fade-in duration-300">
              {/* Verified Purchase Policy Banner */}
              <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#231A14] border border-neutral-200/80 dark:border-[#2C211A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    All ratings and reviews on Aura Luxe are strictly submitted by customers from their <strong>Order History</strong> after purchasing.
                  </span>
                </div>
                {user ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('profile')}
                    className="text-xs font-semibold text-rose-800 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 shrink-0 underline"
                  >
                    View My Orders & Leave a Review →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-xs font-semibold text-rose-800 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-300 shrink-0 underline"
                  >
                    Sign in to view your orders →
                  </button>
                )}
              </div>

              {/* SECTION A: RATING SUMMARY & STAR BREAKDOWN */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center pb-8 border-b border-neutral-100 dark:border-[#2C211A]">
                {/* Left: Overall Score (4 cols) */}
                <div className="md:col-span-4 text-center md:text-left space-y-2">
                  <div className="flex items-baseline justify-center md:justify-start gap-3">
                    <span className="font-serif text-5xl font-bold text-neutral-900 dark:text-[#EDE4DA]">
                      {reviewSummary?.averageRating || product.rating}
                    </span>
                    <span className="text-neutral-400 dark:text-neutral-500 text-sm font-semibold">out of 5</span>
                  </div>
                  <div className="flex text-amber-500 justify-center md:justify-start">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(reviewSummary?.averageRating || product.rating)
                            ? 'fill-current'
                            : 'text-neutral-200 dark:text-neutral-700 fill-neutral-200 dark:fill-neutral-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Based on {reviewSummary?.totalReviews || product.reviewCount} customer reviews
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800/60">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>100% Verified Buyer Purchases</span>
                  </div>
                </div>

                {/* Right: Star Distribution Bars (8 cols) */}
                <div className="md:col-span-8 space-y-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = reviewSummary?.distribution
                      ? star === 5
                        ? reviewSummary.distribution.fiveStar
                        : star === 4
                        ? reviewSummary.distribution.fourStar
                        : star === 3
                        ? reviewSummary.distribution.threeStar
                        : star === 2
                        ? reviewSummary.distribution.twoStar
                        : reviewSummary.distribution.oneStar
                      : star === 5
                      ? 20
                      : star === 4
                      ? 3
                      : star === 3
                      ? 1
                      : 0;

                    const total = reviewSummary?.totalReviews || product.reviewCount || 24;
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0;

                    return (
                      <div key={star} className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-300">
                        <span className="w-12 font-medium flex items-center gap-1">
                          <span>{star}</span>
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 inline" />
                        </span>
                        <div className="flex-1 h-2.5 bg-neutral-100 dark:bg-[#251D18] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-neutral-400 dark:text-neutral-500 font-mono text-[11px]">
                          {count} ({percent}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION B: CUSTOMER REAL RESULTS PHOTO GALLERY */}
              {sortedCustomerPhotos.length > 0 && (
                <div className="space-y-3 pb-8 border-b border-neutral-100 dark:border-[#2C211A]">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                      <Camera className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                      <span>Customer Real Results & Photos ({sortedCustomerPhotos.length})</span>
                    </h4>
                    <span className="text-[11px] text-neutral-400 dark:text-neutral-500">5-star customer photos first • Click to enlarge</span>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                    {sortedCustomerPhotos.map((photoUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPreviewPhotoUrl(photoUrl)}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-neutral-200 dark:border-[#2C211A] flex-shrink-0 group hover:ring-2 hover:ring-rose-500 transition shadow-2xs relative"
                      >
                        <img
                          src={photoUrl}
                          alt={`Customer photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION C: VERIFIED CUSTOMER REVIEWS LIST */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-neutral-900 dark:text-[#EDE4DA]">
                    Verified Customer Feedback ({sortedReviews.length})
                  </h4>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-900/40">
                    ★ 5-Star Reviews on Top
                  </span>
                </div>

                {loadingReviews ? (
                  <div className="py-12 text-center text-neutral-400 flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-rose-700 dark:text-rose-400" />
                    <span className="text-xs">Loading customer reviews...</span>
                  </div>
                ) : sortedReviews.length > 0 ? (
                  <div className="divide-y divide-neutral-100 dark:divide-[#251B15]">
                    {sortedReviews.map((rev) => {
                      let images: string[] = [];
                      if (rev.imagesJson) {
                        try {
                          images = JSON.parse(rev.imagesJson);
                        } catch (_) {}
                      }

                      return (
                        <div key={rev.id} className="py-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-neutral-900 dark:text-[#EDE4DA] text-xs">
                                  {rev.reviewerName}
                                </span>
                                {rev.verifiedBuyer && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/60">
                                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Verified Buyer</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                                {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>

                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < rev.rating ? 'fill-current' : 'text-neutral-200 dark:text-neutral-700 fill-neutral-200 dark:fill-neutral-700'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {rev.title && (
                            <h5 className="font-semibold text-xs text-neutral-900 dark:text-[#EDE4DA]">{rev.title}</h5>
                          )}

                          <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">{rev.comment}</p>

                          {/* Review Image Attachments */}
                          {images && images.length > 0 && (
                            <div className="flex gap-2 pt-1 flex-wrap">
                              {images.map((imgUrl, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setPreviewPhotoUrl(imgUrl)}
                                  className="w-16 h-16 rounded-xl overflow-hidden border border-neutral-200 dark:border-[#2C211A] hover:ring-2 hover:ring-rose-500 transition shadow-2xs"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={`Review photo ${i + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-[#231A14] text-center space-y-2 border border-neutral-100 dark:border-[#2C211A]">
                    <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">No customer reviews yet</p>
                    <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                      Be the first verified buyer to share your results with this cosmetic!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PHOTO LIGHTBOX MODAL */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl bg-black">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Customer result enlarged"
              className="w-full h-full object-contain max-h-[80vh]"
            />
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="pt-10 border-t border-neutral-200 dark:border-[#2C211A]">
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold">Complementary Regimen</span>
              <h3 className="font-serif text-2xl text-neutral-900 dark:text-[#EDE4DA] mt-1">Complete Your Beauty Ritual</h3>
            </div>
            <button
              onClick={() => onNavigate('plp', product.subCategory)}
              className="text-xs font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800"
            >
              View More {product.subCategory} →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5 items-stretch">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onNavigate={onNavigate} />
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      {product && (
        <RecentlyViewedSection
          currentProductId={product.id}
          onNavigate={onNavigate}
        />
      )}

      {/* Share Product Modal */}
      <ShareProductModal
        product={product}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />
    </div>
  );
};
