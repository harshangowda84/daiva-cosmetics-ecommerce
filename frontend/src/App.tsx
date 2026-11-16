import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { BrowsingHistoryProvider } from './context/BrowsingHistoryContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { FloatingCartPill } from './components/FloatingCartPill';

// Pages
import { HomePage } from './pages/HomePage';
import { PLPPage } from './pages/PLPPage';
import { PDPPage } from './pages/PDPPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { CartPage } from './pages/CartPage';
import { WishlistPage } from './pages/WishlistPage';
import { HistoryPage } from './pages/HistoryPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { AuthPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { PolicyPage } from './pages/PolicyPage';

const parseRouteFromUrl = (): { page: string; param: string } => {
  // Check hash first: e.g. "#admin", "#/admin", "#pdp/slug", "#cart", "#plp/Serums%20&%20Treatments"
  const hash = window.location.hash.replace(/^#\/?/, '').trim();
  if (hash) {
    const parts = hash.split('/');
    const page = parts[0]?.toLowerCase() || 'home';
    const rawParam = parts.slice(1).join('/');
    let param = rawParam;
    try {
      param = decodeURIComponent(rawParam);
    } catch {
      // fallback
    }
    return { page, param };
  }

  // Fallback check pathname if user went to /admin
  const pathname = window.location.pathname.replace(/^\//, '').trim().toLowerCase();
  if (pathname === 'admin') {
    return { page: 'admin', param: '' };
  }

  return { page: 'home', param: '' };
};

export const App: React.FC = () => {
  const initialRoute = parseRouteFromUrl();
  const [currentPage, setCurrentPage] = useState<string>(initialRoute.page);
  const [pageParam, setPageParam] = useState<string>(initialRoute.param);

  const handleNavigate = (page: string, param?: string) => {
    let cleanParam = param || '';
    try {
      cleanParam = decodeURIComponent(cleanParam);
    } catch {}
    setCurrentPage(page);
    setPageParam(cleanParam);
    const newHash = page === 'home' ? '' : cleanParam ? `#${page}/${encodeURIComponent(cleanParam)}` : `#${page}`;
    if (window.location.hash !== newHash) {
      if (newHash === '') {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        window.location.hash = newHash;
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const syncFromLocation = () => {
      const route = parseRouteFromUrl();
      setCurrentPage(route.page);
      setPageParam(route.param);
    };

    // Run immediately on mount
    syncFromLocation();

    window.addEventListener('hashchange', syncFromLocation);
    window.addEventListener('popstate', syncFromLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromLocation);
      window.removeEventListener('popstate', syncFromLocation);
    };
  }, []);

  const isDedicatedAuthOrAdmin = currentPage === 'admin' || currentPage === 'login' || currentPage === 'register';

  return (
    <ThemeProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <BrowsingHistoryProvider>
              <div className="min-h-screen w-full max-w-full overflow-x-hidden flex flex-col bg-[#FAF9F6] dark:bg-[#120E0C] text-neutral-800 dark:text-[#EDE4DA] font-sans selection:bg-rose-100 selection:text-rose-900 transition-colors duration-200">
                {/* Header/Navbar only for main shopping storefront, hidden on Login, Register and Admin Portal */}
                {!isDedicatedAuthOrAdmin && (
                  <Navbar
                    onNavigate={handleNavigate}
                    currentPage={currentPage}
                    currentParam={pageParam}
                  />
                )}

                <main className="flex-1">
                  {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
                  {currentPage === 'plp' && <PLPPage initialSubCategory={pageParam || 'All'} onNavigate={handleNavigate} />}
                  {currentPage === 'pdp' && <PDPPage slug={pageParam} onNavigate={handleNavigate} />}
                  {currentPage === 'search' && <SearchResultsPage query={pageParam} onNavigate={handleNavigate} />}
                  {currentPage === 'cart' && <CartPage onNavigate={handleNavigate} />}
                  {currentPage === 'wishlist' && <WishlistPage onNavigate={handleNavigate} />}
                  {(currentPage === 'history' || currentPage === 'browsing-history') && (
                    <HistoryPage onNavigate={handleNavigate} />
                  )}
                  {currentPage === 'checkout' && <CheckoutPage onNavigate={handleNavigate} />}
                  {currentPage === 'login' && <AuthPage initialMode="login" onNavigate={handleNavigate} />}
                  {currentPage === 'register' && <AuthPage initialMode="register" onNavigate={handleNavigate} />}
                  {currentPage === 'profile' && <ProfilePage onNavigate={handleNavigate} />}
                  {currentPage === 'admin' && <AdminPage onNavigate={handleNavigate} />}
                  {(currentPage === 'policy' ||
                    currentPage === 'refund-policy' ||
                    currentPage === 'shipping-policy' ||
                    currentPage === 'privacy-policy' ||
                    currentPage === 'terms' ||
                    currentPage === 'contact-us') && (
                    <PolicyPage initialTab={currentPage === 'policy' ? (pageParam || 'refund-policy') : currentPage} onNavigate={handleNavigate} />
                  )}
                </main>

                {/* CartDrawer, FloatingCartPill, and Footer only for main shopping storefront, hidden on Login, Register and Admin Portal */}
                {!isDedicatedAuthOrAdmin && <CartDrawer onNavigate={handleNavigate} />}
                {!isDedicatedAuthOrAdmin && currentPage !== 'checkout' && currentPage !== 'cart' && (
                  <FloatingCartPill onNavigate={handleNavigate} />
                )}
                {!isDedicatedAuthOrAdmin && <Footer onNavigate={handleNavigate} />}
              </div>
            </BrowsingHistoryProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
