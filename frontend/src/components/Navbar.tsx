import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingBag, User as UserIcon, Shield, Menu, X, Sparkles, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { api } from '../services/api';
import { Product } from '../types';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface NavbarProps {
  onNavigate: (page: string, param?: string) => void;
  currentPage: string;
  currentParam?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, currentPage, currentParam }) => {
  const { totalItemsCount, setIsCartDrawerOpen } = useCart();
  const { totalWishlistCount } = useWishlist();
  const { user, isAdmin, logout } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const results = await api.searchProducts(searchQuery);
        setSearchResults(results.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      onNavigate('search', searchQuery.trim());
    }
  };

  const navCategories = [
    { label: 'All Cosmetics', value: 'All' },
    { label: 'Serums & Treatments', value: 'Serums & Treatments' },
    { label: 'Moisturizers', value: 'Moisturizers' },
    { label: 'Lip Care & Makeup', value: 'Lip Care & Makeup' },
    { label: 'Sun Care', value: 'Sun Care' },
    { label: 'Cleansers', value: 'Cleansers' },
  ];

  const isCatActive = (catValue: string): boolean => {
    if (currentPage !== 'plp') return false;
    const active = currentParam ? decodeURIComponent(currentParam).trim() : 'All';
    if (catValue === 'All') {
      return !active || active.toLowerCase() === 'all';
    }
    return active.toLowerCase() === catValue.toLowerCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/95 dark:bg-[#120D0A]/95 backdrop-blur-md border-b border-[#e8e2d8] dark:border-[#2C211A] transition-colors duration-200">
      {/* Top Banner */}
      <div className="bg-[#1E1611] dark:bg-[#0A0705] text-[#FAF9F6] text-[10px] sm:text-xs py-1.5 px-3 text-center font-medium tracking-wide sm:tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 border-b border-transparent dark:border-[#201813]">
        <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-300 animate-pulse shrink-0" />
        <span className="truncate sm:overflow-visible">COMPLIMENTARY SHIPPING ON LUXURY ORDERS ABOVE ₹999 | 100% CLEAN & BOTANICAL COSMETICS</span>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Brand Logo */}
          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer flex flex-col items-center md:items-start group shrink-0"
          >
            <span className="font-serif text-lg sm:text-2xl md:text-3xl tracking-[0.15em] sm:tracking-[0.2em] font-medium text-[#1E1611] dark:text-[#F5EDE4] group-hover:text-rose-700 transition">
              AURA LUXE
            </span>
            <span className="text-[7.5px] sm:text-[9px] tracking-[0.3em] uppercase text-neutral-500 dark:text-neutral-400 font-sans -mt-0.5">
              Organic Cosmetics
            </span>
          </div>

          {/* Global Search Bar with Live Suggest */}
          <div className="flex-1 max-w-lg hidden md:block relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search luxury skincare, serums, lipsticks..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                className="w-full bg-[#f1ece5] dark:bg-[#1E1713] text-sm text-neutral-800 dark:text-[#EDE4DA] placeholder-neutral-500 dark:placeholder-neutral-400 rounded-full pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#8B755E]/40 border border-transparent dark:border-[#33261D] transition"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-4 top-3" />
            </form>

            {/* Live Search Suggestion Dropdown */}
            {isSearchOpen && (searchResults.length > 0 || searchQuery.trim().length >= 2) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1410] rounded-2xl shadow-xl border border-neutral-100 dark:border-[#2C211A] overflow-hidden z-50">
                {searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                      Cosmetics Suggestions
                    </div>
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          onNavigate('pdp', product.slug);
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-[#FAF9F6] dark:hover:bg-[#251C17] rounded-xl cursor-pointer transition"
                      >
                        <img
                          src={getFullImageUrl(product.imageUrl)}
                          alt={product.name}
                          className="w-12 h-12 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
                          onError={handleImageError}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{product.brand}</p>
                          <p className="text-sm font-medium text-neutral-800 dark:text-[#EDE4DA] truncate">{product.name}</p>
                          <p className="text-xs font-semibold text-rose-700">₹{product.price.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full text-center py-2 text-xs font-medium text-rose-700 hover:text-rose-800 border-t border-neutral-100 dark:border-[#2C211A] mt-1"
                    >
                      View all results for "{searchQuery}" →
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-neutral-500">
                    No cosmetic products found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Theme Toggle Button - hidden on tiny mobile, accessible in mobile menu */}
            <div className="hidden sm:flex">
              <ThemeToggle />
            </div>

            {/* User Profile / Auth */}
            {user ? (
              <div className="relative group">
                <button
                  onClick={() => onNavigate('profile')}
                  className="flex items-center gap-1 sm:gap-2 p-1.5 sm:p-2 rounded-full hover:bg-[#f1ece5] dark:hover:bg-[#201813] text-neutral-700 dark:text-neutral-200 transition"
                  title="My Account"
                >
                  <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-xs font-medium hidden md:inline">{user.fullName.split(' ')[0]}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 sm:p-2 rounded-full hover:bg-[#f1ece5] dark:hover:bg-[#201813] transition"
                title="Sign In / Register"
              >
                <UserIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden md:inline">Sign In</span>
              </button>
            )}

            {/* Wishlist Button with Counter */}
            <button
              onClick={() => onNavigate('wishlist')}
              className={`relative p-1.5 sm:p-2 rounded-full hover:bg-[#f1ece5] dark:hover:bg-[#201813] transition flex items-center justify-center ${
                currentPage === 'wishlist' 
                  ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' 
                  : 'text-neutral-700 dark:text-neutral-200 hover:text-rose-600 dark:hover:text-rose-400'
              }`}
              title="My Saved Wishlist"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${totalWishlistCount > 0 ? 'fill-rose-500/20 text-rose-600 dark:text-rose-400' : ''}`} />
              {totalWishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full flex items-center justify-center shadow-xs">
                  {totalWishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon with Counter */}
            <button
              onClick={() => setIsCartDrawerOpen(true)}
              className="relative p-2 sm:p-2.5 rounded-full bg-[#1E1611] dark:bg-rose-900/90 text-[#FAF9F6] hover:bg-rose-800 dark:hover:bg-rose-800 transition flex items-center justify-center border border-transparent dark:border-rose-700/50"
              title="View Cart"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] sm:text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-md animate-bounce">
                  {totalItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Bar (End-User PLP Navigation with Active Pointing) */}
        <div className="hidden md:flex items-center justify-center space-x-8 py-2 border-t border-[#e8e2d8]/60 dark:border-[#2C211A]/80 text-xs uppercase tracking-widest font-medium">
          {navCategories.map((cat) => {
            const active = isCatActive(cat.value);
            return (
              <button
                key={cat.value}
                onClick={() => onNavigate('plp', cat.value)}
                className={`relative py-1.5 transition-all duration-200 select-none ${
                  active
                    ? 'text-rose-700 dark:text-rose-400 font-bold border-b-2 border-rose-600 dark:border-rose-500'
                    : 'text-neutral-600 dark:text-neutral-300 hover:text-rose-700 dark:hover:text-rose-400 hover:border-b-2 hover:border-rose-400'
                }`}
              >
                <span>{cat.label}</span>
                {active && (
                  <span className="absolute -bottom-[2px] left-0 right-0 h-0.5 bg-rose-600 dark:bg-rose-500 rounded-full animate-in fade-in zoom-in-75 duration-200" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#e8e2d8] dark:border-[#2C211A] bg-[#FAF9F6] dark:bg-[#150F0C] px-4 pt-3 pb-6 space-y-4">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search cosmetics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f1ece5] dark:bg-[#201813] text-neutral-800 dark:text-[#EDE4DA] placeholder-neutral-500 dark:placeholder-neutral-400 text-sm rounded-full pl-10 pr-4 py-2 border border-transparent dark:border-[#33261D] focus:outline-none"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-2.5" />
          </form>

          {/* Mobile Theme Toggle */}
          <div className="flex items-center justify-between py-1.5 px-1 border-b border-[#e8e2d8] dark:border-[#2C211A]">
            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300">Appearance Mode</span>
            <ThemeToggle showLabel={true} />
          </div>

          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              Cosmetics Categories
            </div>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigate('wishlist');
              }}
              className="flex items-center justify-between w-full py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:text-rose-700 dark:hover:text-rose-400 border-b border-neutral-200/60 dark:border-[#2C211A] pb-2 mb-1"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>My Wishlist</span>
              </span>
              {totalWishlistCount > 0 && (
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {totalWishlistCount}
                </span>
              )}
            </button>
            {navCategories.map((cat) => {
              const active = isCatActive(cat.value);
              return (
                <button
                  key={cat.value}
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigate('plp', cat.value);
                  }}
                  className={`block w-full text-left py-2 px-3 text-sm font-medium rounded-xl transition ${
                    active
                      ? 'bg-[#1E1611] dark:bg-rose-900/40 text-white font-semibold shadow-2xs'
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-[#f1ece5] dark:hover:bg-[#201813]'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="border-t border-neutral-200 dark:border-[#2C211A] pt-3 flex justify-between items-center text-sm">
            {user ? (
              <>
                <button onClick={() => { setIsMobileMenuOpen(false); onNavigate('profile'); }} className="font-medium text-neutral-800 dark:text-neutral-200">
                  My Profile ({user.fullName})
                </button>
                <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="text-rose-600 dark:text-rose-400">
                  Logout
                </button>
              </>
            ) : (
              <button onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }} className="text-rose-700 dark:text-rose-400 font-medium">
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
