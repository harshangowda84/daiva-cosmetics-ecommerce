import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Save,
  Upload,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Award,
  ArrowRight,
  Star,
  Layers,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Package
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';
import { getFullImageUrl } from '../utils/image';

interface AdminHomepageEditorProps {
  onNavigate?: (page: string, param?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

export interface HomeCategoryCard {
  id?: string;
  title: string;
  subCat: string;
  image: string;
  desc: string;
}

const DEFAULT_CATEGORY_CARDS: HomeCategoryCard[] = [
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

export const AdminHomepageEditor: React.FC<AdminHomepageEditorProps> = ({ onNavigate, showToast }) => {
  const { settings, updateSetting, saveSettingsToBackend, isSaving } = useSettings();
  const [activeSubTab, setActiveSubTab] = useState<'hero' | 'categories' | 'featured' | 'clean_banner' | 'bestsellers'>('hero');
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // Category cards state
  const categoryCards: HomeCategoryCard[] = React.useMemo(() => {
    if (settings.home_categories_json) {
      try {
        const parsed = JSON.parse(settings.home_categories_json);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (_) {}
    }
    return DEFAULT_CATEGORY_CARDS;
  }, [settings.home_categories_json]);

  const [cardsState, setCardsState] = useState<HomeCategoryCard[]>(categoryCards);

  // Synchronize when settings change
  React.useEffect(() => {
    setCardsState(categoryCards);
  }, [categoryCards]);

  const handleTextChange = (key: string, value: string) => {
    updateSetting(key, value);
  };

  const handleToggle = (key: string, currentVal: string) => {
    const next = currentVal === 'false' ? 'true' : 'false';
    updateSetting(key, next);
  };

  const handleImageUpload = async (key: string, file: File) => {
    try {
      setUploadingImage(key);
      showToast('Uploading banner asset...', 'loading');
      const res = await api.uploadSingleProductImage(file);
      const url = res.pdpUrl || res.plpUrl;
      updateSetting(key, url);
      showToast('Image uploaded and set successfully', 'success', 2000);
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleCardImageUpload = async (index: number, file: File) => {
    try {
      setUploadingImage(`card-${index}`);
      showToast('Uploading category card image...', 'loading');
      const res = await api.uploadSingleProductImage(file);
      const url = res.pdpUrl || res.plpUrl;
      const updated = [...cardsState];
      updated[index].image = url;
      setCardsState(updated);
      updateSetting('home_categories_json', JSON.stringify(updated));
      showToast('Category card image updated', 'success', 2000);
    } catch (err: any) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setUploadingImage(null);
    }
  };

  const handleCardFieldChange = (index: number, field: keyof HomeCategoryCard, value: string) => {
    const updated = [...cardsState];
    updated[index] = { ...updated[index], [field]: value };
    setCardsState(updated);
    updateSetting('home_categories_json', JSON.stringify(updated));
  };

  const handleAddCategoryCard = () => {
    const newCard: HomeCategoryCard = {
      title: 'New Spotlight Category',
      subCat: 'Cleansers',
      image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
      desc: 'Gentle clarifying botanicals & balancing nutrients',
    };
    const updated = [...cardsState, newCard];
    setCardsState(updated);
    updateSetting('home_categories_json', JSON.stringify(updated));
    showToast('New category card added to spotlight list', 'info', 2000);
  };

  const handleDeleteCategoryCard = (index: number) => {
    if (cardsState.length <= 1) {
      showToast('At least one spotlight category card is required', 'error');
      return;
    }
    const updated = cardsState.filter((_, i) => i !== index);
    setCardsState(updated);
    updateSetting('home_categories_json', JSON.stringify(updated));
    showToast('Category card removed', 'info', 2000);
  };

  const handleSaveAll = async () => {
    try {
      showToast('Saving homepage settings to live site...', 'loading');
      await saveSettingsToBackend({
        ...settings,
        home_categories_json: JSON.stringify(cardsState)
      });
      showToast('Homepage settings saved and published live!', 'success', 3000);
    } catch (err) {
      showToast('Failed to save homepage settings', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Save Button */}
      <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </span>
            <h2 className="font-serif text-xl font-bold text-neutral-900 dark:text-[#EDE4DA]">
              Homepage CMS & Hero Banner Controls
            </h2>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Customize hero headlines, hero imagery, quick stats, category spotlight cards, and promo banners live on the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 bg-[#FAF9F6] dark:bg-[#221914] hover:bg-neutral-100 dark:hover:bg-[#2c201a] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-[#382B21] text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
              title="Preview homepage on customer storefront"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Live</span>
            </button>
          )}

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-5 py-2.5 bg-rose-700 text-white text-xs font-semibold rounded-xl hover:bg-rose-800 transition flex items-center gap-2 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish Changes'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs for Homepage Sections */}
      <div className="flex border-b border-neutral-200 dark:border-[#2C211A] gap-2 text-xs font-semibold overflow-x-auto bg-white dark:bg-[#16100C] p-2 rounded-2xl border">
        <button
          onClick={() => setActiveSubTab('hero')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'hero'
              ? 'bg-[#1E1611] dark:bg-rose-950 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#FAF9F6] dark:hover:bg-[#251D18]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Hero Banner & Stats</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'categories'
              ? 'bg-[#1E1611] dark:bg-rose-950 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#FAF9F6] dark:hover:bg-[#251D18]'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-rose-400" />
          <span>Curated Category Cards ({cardsState.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('featured')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'featured'
              ? 'bg-[#1E1611] dark:bg-rose-950 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#FAF9F6] dark:hover:bg-[#251D18]'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-rose-400" />
          <span>Featured Products Section</span>
        </button>

        <button
          onClick={() => setActiveSubTab('clean_banner')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'clean_banner'
              ? 'bg-[#1E1611] dark:bg-rose-950 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#FAF9F6] dark:hover:bg-[#251D18]'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Clean Beauty Standard Banner</span>
        </button>

        <button
          onClick={() => setActiveSubTab('bestsellers')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'bestsellers'
              ? 'bg-[#1E1611] dark:bg-rose-950 text-white shadow-sm'
              : 'text-neutral-600 dark:text-neutral-400 hover:bg-[#FAF9F6] dark:hover:bg-[#251D18]'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
          <span>Best Sellers Section</span>
        </button>
      </div>

      {/* SECTION 1: HERO BANNER & STATS */}
      {activeSubTab === 'hero' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: 7 cols */}
          <div className="lg:col-span-7 bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] space-y-5">
            <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2 border-b border-neutral-100 dark:border-[#2C211A] pb-3">
              <Sparkles className="w-4 h-4 text-rose-600" />
              <span>Hero Copy & Primary Call-To-Action</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Badge Tagline (Top Pill)
              </label>
              <input
                type="text"
                value={settings.home_hero_badge || 'Organic Clinical Beauty'}
                onChange={(e) => handleTextChange('home_hero_badge', e.target.value)}
                placeholder="e.g. Organic Clinical Beauty"
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Main Hero Headline (H1)
              </label>
              <input
                type="text"
                value={settings.home_hero_title || 'Luminescence Born From Pure Botanicals'}
                onChange={(e) => handleTextChange('home_hero_title', e.target.value)}
                placeholder="e.g. Luminescence Born From Pure Botanicals"
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] focus:ring-1 focus:ring-rose-500 focus:outline-none font-serif text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Hero Description Paragraph
              </label>
              <textarea
                rows={3}
                value={settings.home_hero_subtitle || 'Experience clinically proven organic formulations that restore your skin barrier, hydrate deeply, and provide an effortless, radiant glow for every skin type.'}
                onChange={(e) => handleTextChange('home_hero_subtitle', e.target.value)}
                placeholder="Enter compelling brand & clinical value story..."
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Primary CTA Button Text
                </label>
                <input
                  type="text"
                  value={settings.home_hero_cta_text || 'Shop Cosmetics Range'}
                  onChange={(e) => handleTextChange('home_hero_cta_text', e.target.value)}
                  placeholder="e.g. Shop Cosmetics Range"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Button Destination Target
                </label>
                <select
                  value={settings.home_hero_cta_target || 'All'}
                  onChange={(e) => handleTextChange('home_hero_cta_target', e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] focus:ring-1 focus:ring-rose-500 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Cosmetics</option>
                  <option value="Lip Care & Makeup">Lip Care & Makeup</option>
                  <option value="Face Makeup">Face Makeup</option>
                  <option value="Serums & Treatments">Serums & Treatments</option>
                  <option value="Moisturizers">Moisturizers</option>
                  <option value="Sun Care">Sun Care</option>
                  <option value="Cleansers">Cleansers</option>
                </select>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="pt-3 border-t border-neutral-100 dark:border-[#2C211A] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Hero Bottom 3 Trust Counters
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#FAF9F6] dark:bg-[#221914] rounded-xl border border-neutral-200 dark:border-[#382B21] space-y-1.5">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Stat 1</span>
                  <input
                    type="text"
                    value={settings.home_hero_stat1_value || '100%'}
                    onChange={(e) => handleTextChange('home_hero_stat1_value', e.target.value)}
                    placeholder="100%"
                    className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410] font-bold"
                  />
                  <input
                    type="text"
                    value={settings.home_hero_stat1_label || 'Vegan & Clean'}
                    onChange={(e) => handleTextChange('home_hero_stat1_label', e.target.value)}
                    placeholder="Vegan & Clean"
                    className="w-full text-[11px] p-1.5 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410]"
                  />
                </div>

                <div className="p-3 bg-[#FAF9F6] dark:bg-[#221914] rounded-xl border border-neutral-200 dark:border-[#382B21] space-y-1.5">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Stat 2</span>
                  <input
                    type="text"
                    value={settings.home_hero_stat2_value || '4.9 ★'}
                    onChange={(e) => handleTextChange('home_hero_stat2_value', e.target.value)}
                    placeholder="4.9 ★"
                    className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410] font-bold"
                  />
                  <input
                    type="text"
                    value={settings.home_hero_stat2_label || 'Customer Rating'}
                    onChange={(e) => handleTextChange('home_hero_stat2_label', e.target.value)}
                    placeholder="Customer Rating"
                    className="w-full text-[11px] p-1.5 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410]"
                  />
                </div>

                <div className="p-3 bg-[#FAF9F6] dark:bg-[#221914] rounded-xl border border-neutral-200 dark:border-[#382B21] space-y-1.5">
                  <span className="text-[10px] text-neutral-400 font-bold uppercase block">Stat 3</span>
                  <input
                    type="text"
                    value={settings.home_hero_stat3_value || 'Clinical'}
                    onChange={(e) => handleTextChange('home_hero_stat3_value', e.target.value)}
                    placeholder="Clinical"
                    className="w-full text-xs p-1.5 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410] font-bold"
                  />
                  <input
                    type="text"
                    value={settings.home_hero_stat3_label || 'Approved Formulas'}
                    onChange={(e) => handleTextChange('home_hero_stat3_label', e.target.value)}
                    placeholder="Approved Formulas"
                    className="w-full text-[11px] p-1.5 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image & Floating Card (5 cols) */}
          <div className="lg:col-span-5 bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] space-y-5">
            <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2 border-b border-neutral-100 dark:border-[#2C211A] pb-3">
              <ImageIcon className="w-4 h-4 text-rose-600" />
              <span>Hero Media & Floating Badge</span>
            </h3>

            {/* Hero Image URL & Preview */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Hero Main Image
              </label>

              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-[#221914] border border-neutral-200 dark:border-[#382B21] relative group">
                <img
                  src={getFullImageUrl(settings.home_hero_image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=85')}
                  alt="Hero Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <label className="px-3.5 py-1.5 bg-white text-neutral-900 rounded-lg text-xs font-semibold cursor-pointer shadow hover:bg-neutral-100 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload('home_hero_image', file);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={settings.home_hero_image || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1000&q=85'}
                  onChange={(e) => handleTextChange('home_hero_image', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 text-xs p-2 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-800 dark:text-[#EDE4DA]"
                />
                <label className="px-3 py-2 bg-neutral-100 dark:bg-[#251D18] hover:bg-neutral-200 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-[#382B21] rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1 shadow-2xs">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload('home_hero_image', file);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Floating Product Badge */}
            <div className="pt-3 border-t border-neutral-100 dark:border-[#2C211A] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-[#EDE4DA]">Floating Highlight Badge</h4>
                  <p className="text-[11px] text-neutral-500">Overlay card displayed in bottom corner of hero photo</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('home_hero_floating_card_enabled', settings.home_hero_floating_card_enabled || 'true')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                    settings.home_hero_floating_card_enabled !== 'false'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {settings.home_hero_floating_card_enabled !== 'false' ? 'Visible' : 'Hidden'}
                </button>
              </div>

              {settings.home_hero_floating_card_enabled !== 'false' && (
                <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#FAF9F6] dark:bg-[#221914] border border-neutral-200 dark:border-[#382B21]">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Badge Product Title
                    </label>
                    <input
                      type="text"
                      value={settings.home_hero_floating_title || 'Lumière 10% Niacinamide'}
                      onChange={(e) => handleTextChange('home_hero_floating_title', e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Reviews Label
                    </label>
                    <input
                      type="text"
                      value={settings.home_hero_floating_subtitle || '128 Verified Reviews'}
                      onChange={(e) => handleTextChange('home_hero_floating_subtitle', e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Sale Price (₹)
                      </label>
                      <input
                        type="text"
                        value={settings.home_hero_floating_price || '899'}
                        onChange={(e) => handleTextChange('home_hero_floating_price', e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410] font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                        Original Price (₹)
                      </label>
                      <input
                        type="text"
                        value={settings.home_hero_floating_original_price || '1299'}
                        onChange={(e) => handleTextChange('home_hero_floating_original_price', e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410] line-through text-neutral-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: CURATED CATEGORY SPOTLIGHT CARDS */}
      {activeSubTab === 'categories' && (
        <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-neutral-100 dark:border-[#2C211A] pb-4">
            <div>
              <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                <Layers className="w-4 h-4 text-rose-600" />
                <span>Curated Category Spotlight Cards</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Manage the visual category cards displayed right under the hero on the homepage.
              </p>
            </div>

            <button
              onClick={handleAddCategoryCard}
              className="px-4 py-2 bg-rose-700 text-white text-xs font-semibold rounded-xl hover:bg-rose-800 transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Category Card</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardsState.map((card, idx) => (
              <div
                key={idx}
                className="bg-[#FAF9F6] dark:bg-[#1E1712] rounded-2xl p-4 border border-neutral-200 dark:border-[#382B21] space-y-3.5 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded">
                      Card #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategoryCard(idx)}
                      className="text-neutral-400 hover:text-red-600 p-1 rounded transition"
                      title="Remove this category card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Image Preview & Upload */}
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-neutral-200 dark:bg-[#251D18] relative group border border-neutral-200 dark:border-[#382B21]">
                    <img
                      src={getFullImageUrl(card.image)}
                      alt={card.title}
                      className="w-full h-full object-cover"
                    />
                    <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1 text-white text-xs font-semibold cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Change Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCardImageUpload(idx, file);
                        }}
                      />
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                      Display Title
                    </label>
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handleCardFieldChange(idx, 'title', e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410] font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                      Category Link Target
                    </label>
                    <select
                      value={card.subCat}
                      onChange={(e) => handleCardFieldChange(idx, 'subCat', e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410] cursor-pointer"
                    >
                      <option value="Lip Care & Makeup">Lip Care & Makeup</option>
                      <option value="Face Makeup">Face Makeup</option>
                      <option value="Serums & Treatments">Serums & Treatments</option>
                      <option value="Moisturizers">Moisturizers</option>
                      <option value="Sun Care">Sun Care</option>
                      <option value="Cleansers">Cleansers</option>
                      <option value="All">All Cosmetics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                      Card Tagline
                    </label>
                    <input
                      type="text"
                      value={card.desc}
                      onChange={(e) => handleCardFieldChange(idx, 'desc', e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={card.image}
                      onChange={(e) => handleCardFieldChange(idx, 'image', e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-[11px] p-1.5 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-white dark:bg-[#1A1410]"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: FEATURED PRODUCTS SECTION */}
      {activeSubTab === 'featured' && (
        <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] space-y-5 max-w-2xl">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-[#2C211A] pb-3">
            <div>
              <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                Featured Cosmetics Essentials
              </h3>
              <p className="text-xs text-neutral-500">Curated showcase section for editor's pick cosmetics</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('home_featured_enabled', settings.home_featured_enabled || 'true')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                settings.home_featured_enabled !== 'false'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {settings.home_featured_enabled !== 'false' ? 'Section Visible' : 'Section Hidden'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Section Tagline
            </label>
            <input
              type="text"
              value={settings.home_featured_tagline || "Editor's Choice"}
              onChange={(e) => handleTextChange('home_featured_tagline', e.target.value)}
              placeholder="e.g. Editor's Choice"
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Section Main Heading
            </label>
            <input
              type="text"
              value={settings.home_featured_title || 'Featured Cosmetics Essentials'}
              onChange={(e) => handleTextChange('home_featured_title', e.target.value)}
              placeholder="e.g. Featured Cosmetics Essentials"
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] font-serif text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Section Description
            </label>
            <textarea
              rows={2}
              value={settings.home_featured_subtitle || 'Top-rated botanical serums, nourishing lipsticks, and dermatologist-approved daily barrier protection.'}
              onChange={(e) => handleTextChange('home_featured_subtitle', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Number of Products to Display
            </label>
            <select
              value={settings.home_featured_count || '4'}
              onChange={(e) => handleTextChange('home_featured_count', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] cursor-pointer"
            >
              <option value="4">4 Products (1 Row)</option>
              <option value="8">8 Products (2 Rows)</option>
              <option value="12">12 Products (3 Rows)</option>
            </select>
          </div>
        </div>
      )}

      {/* SECTION 4: CLEAN BEAUTY STANDARD BANNER */}
      {activeSubTab === 'clean_banner' && (
        <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] space-y-5 max-w-3xl">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-[#2C211A] pb-3">
            <div>
              <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                Clean Beauty Standard Banner (Middle Promo)
              </h3>
              <p className="text-xs text-neutral-500">Wide banner highlighting clean skincare guarantees and clinical safety</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('home_clean_banner_enabled', settings.home_clean_banner_enabled || 'true')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                settings.home_clean_banner_enabled !== 'false'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {settings.home_clean_banner_enabled !== 'false' ? 'Banner Visible' : 'Banner Hidden'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Badge Header
              </label>
              <input
                type="text"
                value={settings.home_clean_badge || 'The Clean Beauty Standard'}
                onChange={(e) => handleTextChange('home_clean_badge', e.target.value)}
                placeholder="The Clean Beauty Standard"
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={settings.home_clean_cta_text || 'Explore Full Range →'}
                onChange={(e) => handleTextChange('home_clean_cta_text', e.target.value)}
                placeholder="Explore Full Range →"
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Banner Heading
            </label>
            <input
              type="text"
              value={settings.home_clean_title || 'Formulated With Care for Sensitive Skin'}
              onChange={(e) => handleTextChange('home_clean_title', e.target.value)}
              placeholder="Formulated With Care for Sensitive Skin"
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] font-serif text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Banner Paragraph
            </label>
            <textarea
              rows={3}
              value={settings.home_clean_desc || 'Every formula in our cosmetics collection is created with skin-barrier-first science. We source cold-pressed organic botanicals and bio-compatible ceramides that work with your skin, never against it.'}
              onChange={(e) => handleTextChange('home_clean_desc', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA]"
            />
          </div>

          <div className="pt-2 border-t border-neutral-100 dark:border-[#2C211A] space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              4 Guarantee Bullet Points
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Bullet 1</label>
                <input
                  type="text"
                  value={settings.home_clean_bullet_1 || '100% Free of Parabens & Phthalates'}
                  onChange={(e) => handleTextChange('home_clean_bullet_1', e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Bullet 2</label>
                <input
                  type="text"
                  value={settings.home_clean_bullet_2 || 'Non-Comedogenic & Low Sensitizing'}
                  onChange={(e) => handleTextChange('home_clean_bullet_2', e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Bullet 3</label>
                <input
                  type="text"
                  value={settings.home_clean_bullet_3 || 'Sustainably Sourced Raw Ingredients'}
                  onChange={(e) => handleTextChange('home_clean_bullet_3', e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-neutral-500 mb-1">Bullet 4</label>
                <input
                  type="text"
                  value={settings.home_clean_bullet_4 || 'Recyclable Luxury Glass Packaging'}
                  onChange={(e) => handleTextChange('home_clean_bullet_4', e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 5: BEST SELLERS SECTION */}
      {activeSubTab === 'bestsellers' && (
        <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] space-y-5 max-w-2xl">
          <div className="flex items-center justify-between border-b border-neutral-100 dark:border-[#2C211A] pb-3">
            <div>
              <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                Best Selling Cosmetics
              </h3>
              <p className="text-xs text-neutral-500">Automated showcase based on top ratings and sales velocity</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('home_bestsellers_enabled', settings.home_bestsellers_enabled || 'true')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                settings.home_bestsellers_enabled !== 'false'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {settings.home_bestsellers_enabled !== 'false' ? 'Section Visible' : 'Section Hidden'}
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Section Tagline
            </label>
            <input
              type="text"
              value={settings.home_bestsellers_tagline || 'Most Loved'}
              onChange={(e) => handleTextChange('home_bestsellers_tagline', e.target.value)}
              placeholder="e.g. Most Loved"
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Section Main Heading
            </label>
            <input
              type="text"
              value={settings.home_bestsellers_title || 'Best Selling Cosmetics'}
              onChange={(e) => handleTextChange('home_bestsellers_title', e.target.value)}
              placeholder="e.g. Best Selling Cosmetics"
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] font-serif text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
              Number of Products to Display
            </label>
            <select
              value={settings.home_bestsellers_count || '4'}
              onChange={(e) => handleTextChange('home_bestsellers_count', e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#221914] text-neutral-900 dark:text-[#EDE4DA] cursor-pointer"
            >
              <option value="4">4 Products (1 Row)</option>
              <option value="8">8 Products (2 Rows)</option>
              <option value="12">12 Products (3 Rows)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
