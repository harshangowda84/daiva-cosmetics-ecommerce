import React, { useState } from 'react';
import {
  SlidersHorizontal,
  LayoutGrid,
  FileCode,
  Eye,
  ShieldCheck,
  Image as ImageIcon,
  Award,
  Sparkles,
  Share2,
  MessageSquare,
  Package,
  Zap,
  Star,
  Truck,
  RotateCcw,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Save,
  Clock,
  Heart,
  Droplet,
  ExternalLink,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface AdminStorefrontControlsProps {
  onNavigate?: (page: string, param?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

export const AdminStorefrontControls: React.FC<AdminStorefrontControlsProps> = ({
  onNavigate,
  showToast,
}) => {
  const { settings, updateSetting, saveSettingsToBackend, isSaving } = useSettings();
  const [activeSection, setActiveSection] = useState<'all' | 'plp' | 'pdp'>('all');

  const handleToggle = async (key: string, currentVal: string) => {
    const nextVal = currentVal === 'false' ? 'true' : 'false';
    updateSetting(key, nextVal);
    try {
      await saveSettingsToBackend({ ...settings, [key]: nextVal });
      showToast('Setting updated and published live', 'success', 2000);
    } catch (err) {
      showToast('Failed to sync setting', 'error');
    }
  };

  const handleTimerChange = async (newVal: string) => {
    updateSetting('plp_hover_slideshow_timer', newVal);
    try {
      await saveSettingsToBackend({ ...settings, plp_hover_slideshow_timer: newVal });
      showToast('Slideshow timer updated', 'success', 2000);
    } catch (err) {
      showToast('Failed to update timer', 'error');
    }
  };

  const cardClass = 'bg-white dark:bg-[#1A1410] border border-neutral-200 dark:border-[#2C211A] rounded-3xl p-5 shadow-xs transition-all duration-200 hover:border-neutral-300 dark:hover:border-[#382B21]';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-[#2C211A] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-xs font-semibold mb-2 border border-amber-200/60 dark:border-amber-900/40">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Storefront Dynamic Feature Toggles</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-[#EDE4DA]">
            PLP & PDP Storefront Controls
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Developer-grade On/Off switches modeled from Project08. Turn customer storefront modules, widgets, badges,
            and interactive features on or off in real-time with zero code deployments.
          </p>
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center gap-2 bg-[#FAF9F6] dark:bg-[#1A130E] p-1.5 rounded-2xl border border-neutral-200 dark:border-[#2C211A]">
          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeSection === 'all'
                ? 'bg-[#1E1611] dark:bg-rose-900 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            All Controls
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('plp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSection === 'plp'
                ? 'bg-[#1E1611] dark:bg-rose-900 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>PLP Only</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSection('pdp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
              activeSection === 'pdp'
                ? 'bg-[#1E1611] dark:bg-rose-900 text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>PDP Only</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: PRODUCT LISTING PAGE (PLP) CONTROLS                           */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'plp') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold">
                <LayoutGrid className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA]">
                Product Listing Page (PLP) Controls
              </h3>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('plp', 'All')}
                className="text-xs text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Preview PLP Catalog</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Quick Preview Eye Button */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Eye className="w-4 h-4 text-rose-600" />
                  <span>Quick Preview Eye Button</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Shows an eye preview icon on each product card for fast modal peek into cosmetic details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('plp_show_quick_preview', settings.plp_show_quick_preview)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.plp_show_quick_preview === 'true' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Quick Preview"
              >
                {settings.plp_show_quick_preview === 'true' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 2. Product Badges */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Product Badges ("Best Seller", "% OFF")</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Displays highlighted badge pills on the top left of product card thumbnails.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('plp_show_badges', settings.plp_show_badges)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.plp_show_badges !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Product Badges"
              >
                {settings.plp_show_badges !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 3. Star Rating & Verified Count */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Star Rating & Review Count Floating Pill</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Displays customer rating and verified review count at the bottom left of card thumbnails.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('plp_show_rating', settings.plp_show_rating)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.plp_show_rating !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Star Rating"
              >
                {settings.plp_show_rating !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 4. Volume / Size Pill */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-500" />
                  <span>Item Volume / Size Specification (e.g. 50ml)</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Displays product volume / net quantity below the product title on catalog cards.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('plp_show_volume_pill', settings.plp_show_volume_pill)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.plp_show_volume_pill !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Volume Pill"
              >
                {settings.plp_show_volume_pill !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 5. Stock Status Indicator */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Stock Status ("In Stock" / "Low Stock" / "Out of Stock")</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Shows inventory availability color tags next to the price on each catalog item.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('plp_show_stock_badge', settings.plp_show_stock_badge)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.plp_show_stock_badge !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Stock Indicator"
              >
                {settings.plp_show_stock_badge !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 6. PLP Share Product Button */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-500" />
                  <span>Card 1-Click Share Button</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Allows customers to instantly share cosmetics directly from the catalog grid.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('plp_show_share_button', settings.plp_show_share_button)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.plp_show_share_button !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Card Share Button"
              >
                {settings.plp_show_share_button !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 7. Multi-Image Hover Slideshow & Timer */}
            <div className={`${cardClass} md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Multi-Image Hover Slideshow & Auto-Cycle Timer</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Automatically cycles through all cosmetic bottle gallery angles when a customer hovers over any card.
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-[#251D18] px-3 py-1.5 rounded-2xl border border-neutral-200 dark:border-[#382B21]">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="text-[11px] font-mono text-neutral-500">Timer:</span>
                  <input
                    type="number"
                    min={0.5}
                    max={10}
                    step={0.1}
                    value={settings.plp_hover_slideshow_timer || '1.5'}
                    onChange={(e) => handleTimerChange(e.target.value)}
                    className="w-14 px-1.5 py-0.5 rounded-lg border border-neutral-300 dark:border-[#382B21] text-xs font-mono text-center font-bold bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-[#EDE4DA]"
                  />
                  <span className="text-[11px] font-mono text-neutral-500">sec</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('plp_hover_slideshow', settings.plp_hover_slideshow)}
                  className={`p-1.5 rounded-full transition shrink-0 ${
                    settings.plp_hover_slideshow !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                  }`}
                  title="Toggle Hover Slideshow"
                >
                  {settings.plp_hover_slideshow !== 'false' ? (
                    <ToggleRight className="w-9 h-9" />
                  ) : (
                    <ToggleLeft className="w-9 h-9" />
                  )}
                </button>
              </div>
            </div>

            {/* 8. Recently Viewed Section on PLP */}
            <div className={`${cardClass} md:col-span-2 flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span>Recently Viewed Cosmetics Section on PLP</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Displays customer's personal browsing history carousel at the bottom of the Product Listing Page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('plp_show_recently_viewed', settings.plp_show_recently_viewed)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.plp_show_recently_viewed !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Recently Viewed on PLP"
              >
                {settings.plp_show_recently_viewed !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PRODUCT DETAIL PAGE (PDP) CONTROLS                            */}
      {/* ========================================================================= */}
      {(activeSection === 'all' || activeSection === 'pdp') && (
        <div className="space-y-4 pt-4 border-t border-neutral-200 dark:border-[#2C211A]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                <FileCode className="w-4 h-4" />
              </div>
              <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA]">
                Product Detail Page (PDP) Controls
              </h3>
            </div>
            <p className="text-xs text-neutral-400">
              Manage individual components on dedicated cosmetic product pages
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Volume / Size Variant Selector (10ml, 50ml, 100ml) */}
            <div className={`${cardClass} md:col-span-2 flex items-center justify-between gap-4 border-2 border-rose-100 dark:border-rose-950/60 bg-gradient-to-r from-rose-50/30 to-amber-50/20 dark:from-[#201510] dark:to-[#18110D]`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                    <Package className="w-4 h-4 text-rose-600" />
                    <span>Item Quantity / Volume Variants Selector (10ml, 50ml, 100ml)</span>
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white">
                    Core Feature
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Enables the interactive size / volume pill selector on PDP. Allows customers to choose between different
                  quantities (e.g. 10ml travel vial, 50ml standard bottle, 100ml value pack) with dynamic prices and stock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_volume_selector', settings.pdp_show_volume_selector)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_volume_selector !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Volume Selector"
              >
                {settings.pdp_show_volume_selector !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 2. WhatsApp Direct Inquiry Button */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-500" />
                  <span>WhatsApp Concierge Direct Inquiry Button</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Allows customers to immediately chat with Aura Luxe beauty advisors on WhatsApp about the product.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_whatsapp_share', settings.pdp_show_whatsapp_share)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_whatsapp_share !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle WhatsApp Button"
              >
                {settings.pdp_show_whatsapp_share !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 3. Direct Share Link Modal Button */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-purple-500" />
                  <span>1-Click Copy Share Link & Social Share</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Displays the floating share button next to Wishlist on the product action bar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_direct_share', settings.pdp_show_direct_share)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_direct_share !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Share Link"
              >
                {settings.pdp_show_direct_share !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 4. Quantity Stepper Controls */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-500" />
                  <span>Quantity Counter Stepper (+ / -)</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Enables customers to increment or decrement units before adding to cart.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_quantity_selector', settings.pdp_show_quantity_selector)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_quantity_selector !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Quantity Stepper"
              >
                {settings.pdp_show_quantity_selector !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 5. Instant Buy Now Button */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>"Instant Buy Now" Direct Checkout Button</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Allows customers to bypass the shopping cart and proceed straight to checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_instant_buy_now', settings.pdp_show_instant_buy_now)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_instant_buy_now !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Instant Buy Now"
              >
                {settings.pdp_show_instant_buy_now !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 6. Customer Verified Reviews & Photos Accordion */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>Customer Reviews & Photo Gallery Section</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Displays customer star ratings breakdown, photo proofs, and verified buyer reviews.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_reviews_section', settings.pdp_show_reviews_section)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_reviews_section !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Reviews Section"
              >
                {settings.pdp_show_reviews_section !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 7. Key Ingredients Disclosure Tab */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-600" />
                  <span>Key Ingredients & Active Bio-Chemicals Tab</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Shows clean clinical actives disclosure tab (Niacinamide, Hyaluronic, Peptides...).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_ingredients_accordion', settings.pdp_show_ingredients_accordion)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_ingredients_accordion !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Ingredients Tab"
              >
                {settings.pdp_show_ingredients_accordion !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 8. How To Use Routine Application Steps */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>How To Use & Routine Application Steps Tab</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Shows application ritual guide (e.g. apply 3-4 drops morning and night on clean face).
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_how_to_use_accordion', settings.pdp_show_how_to_use_accordion)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_how_to_use_accordion !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle How To Use Tab"
              >
                {settings.pdp_show_how_to_use_accordion !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 9. PETA Cruelty-Free & Vegan Trust Badge */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>100% PETA Certified Cruelty-Free Badge</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Shows certified cruelty-free and zero animal testing trust seal in delivery assurance dock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_peta_cruelty_free_badge', settings.pdp_show_peta_cruelty_free_badge)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_peta_cruelty_free_badge !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle PETA Badge"
              >
                {settings.pdp_show_peta_cruelty_free_badge !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 10. Dermatologist Tested & Clinically Validated Badge */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Dermatologist Tested & Clinically Validated Badge</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Shows clinical safety certification badge in delivery assurance dock.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_dermatologist_tested_badge', settings.pdp_show_dermatologist_tested_badge)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_dermatologist_tested_badge !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Dermatologist Badge"
              >
                {settings.pdp_show_dermatologist_tested_badge !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 11. Delivery & Logistics Estimator Box */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <Truck className="w-4 h-4 text-rose-600" />
                  <span>Complimentary Shipping & Delivery Policy Dock</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Shows express delivery assurance, free shipping threshold, and return policy bullets.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_delivery_estimator', settings.pdp_show_delivery_estimator)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_delivery_estimator !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Delivery Box"
              >
                {settings.pdp_show_delivery_estimator !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>

            {/* 12. Complementary Related Products Regimen */}
            <div className={`${cardClass} flex items-center justify-between gap-4`}>
              <div className="space-y-1">
                <h4 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-rose-600" />
                  <span>Complementary Regimen (Related Cosmetics Carousel)</span>
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  Displays related cosmetics from the same routine category below the product details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('pdp_show_related_products', settings.pdp_show_related_products)}
                className={`p-1.5 rounded-full transition shrink-0 ${
                  settings.pdp_show_related_products !== 'false' ? 'text-emerald-500' : 'text-neutral-400'
                }`}
                title="Toggle Related Products"
              >
                {settings.pdp_show_related_products !== 'false' ? (
                  <ToggleRight className="w-9 h-9" />
                ) : (
                  <ToggleLeft className="w-9 h-9" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
