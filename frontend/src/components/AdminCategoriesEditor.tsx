import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Sparkles,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Save,
  Tag,
  Package,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { useSettings, NavbarCategory, DEFAULT_NAVBAR_CATEGORIES } from '../context/SettingsContext';
import { Product } from '../types';

interface AdminCategoriesEditorProps {
  products: Product[];
  onNavigate?: (page: string, param?: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'loading', duration?: number) => void;
}

export const AdminCategoriesEditor: React.FC<AdminCategoriesEditorProps> = ({
  products,
  onNavigate,
  showToast,
}) => {
  const {
    navbarCategories,
    addNavbarCategory,
    updateNavbarCategory,
    deleteNavbarCategory,
    reorderNavbarCategories,
    saveSettingsToBackend,
    isSaving,
  } = useSettings();

  // Add category modal / form state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatBadge, setNewCatBadge] = useState('');
  const [newCatActive, setNewCatActive] = useState(true);

  // Edit category modal / form state
  const [editingCategory, setEditingCategory] = useState<NavbarCategory | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editActive, setEditActive] = useState(true);

  // Delete category confirmation
  const [deletingCategory, setDeletingCategory] = useState<NavbarCategory | null>(null);

  // Compute products count per category
  const productCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of products) {
      const sub = p.subCategory || 'Other';
      map[sub.toLowerCase()] = (map[sub.toLowerCase()] || 0) + 1;
    }
    return map;
  }, [products]);

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    const slug = newCatSlug.trim() || newCatName.trim();
    try {
      const success = await addNavbarCategory({
        name: newCatName.trim(),
        slug: slug,
        badge: newCatBadge.trim() || undefined,
        active: newCatActive,
      });

      if (success) {
        showToast(`Category "${newCatName}" added to navbar!`, 'success');
        setNewCatName('');
        setNewCatSlug('');
        setNewCatBadge('');
        setNewCatActive(true);
        setIsAddModalOpen(false);
      } else {
        showToast('Failed to save category', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error adding category', 'error');
    }
  };

  // Open Edit Modal
  const openEditModal = (cat: NavbarCategory) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditSlug(cat.slug || cat.name);
    setEditBadge(cat.badge || '');
    setEditActive(cat.active !== false);
  };

  // Handle Update Category
  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    if (!editName.trim()) {
      showToast('Category name is required', 'error');
      return;
    }

    try {
      const success = await updateNavbarCategory(editingCategory.id, {
        name: editName.trim(),
        slug: editSlug.trim() || editName.trim(),
        badge: editBadge.trim() || undefined,
        active: editActive,
      });

      if (success) {
        showToast(`Category "${editName}" updated successfully!`, 'success');
        setEditingCategory(null);
      } else {
        showToast('Failed to update category', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating category', 'error');
    }
  };

  // Handle Delete Category
  const confirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      const success = await deleteNavbarCategory(deletingCategory.id);
      if (success) {
        showToast(`Category "${deletingCategory.name}" removed from navbar`, 'info');
        setDeletingCategory(null);
      } else {
        showToast('Failed to delete category', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error deleting category', 'error');
    }
  };

  // Toggle Category Active Status inline
  const handleToggleActive = async (cat: NavbarCategory) => {
    try {
      const nextActive = !cat.active;
      await updateNavbarCategory(cat.id, { active: nextActive });
      showToast(
        `Category "${cat.name}" is now ${nextActive ? 'visible in navbar' : 'hidden from navbar'}`,
        'info',
        2500
      );
    } catch (err) {
      showToast('Could not update category visibility', 'error');
    }
  };

  // Move Category Up / Down
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= navbarCategories.length) return;

    const copy = [...navbarCategories];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    try {
      await reorderNavbarCategories(copy);
      showToast('Navbar categories reordered', 'success', 2000);
    } catch (err) {
      showToast('Failed to reorder categories', 'error');
    }
  };

  // Reset to default categories
  const handleResetDefaults = async () => {
    if (
      !window.confirm(
        'Are you sure you want to restore the default cosmetics navbar categories? Any custom categories will be replaced with defaults.'
      )
    ) {
      return;
    }

    try {
      await reorderNavbarCategories(DEFAULT_NAVBAR_CATEGORIES);
      showToast('Standard navbar categories restored!', 'success');
    } catch (err) {
      showToast('Failed to restore defaults', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-[#2C211A] shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-semibold mb-2 border border-rose-100 dark:border-rose-900/40">
            <Layers className="w-3.5 h-3.5" />
            <span>Navigation & Taxonomy CMS</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-[#EDE4DA]">
            Navbar Categories & Catalog Taxonomy
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">
            Control every category tab displayed in the header navbar, mobile drawer, and PLP filter pills.
            Add new categories, edit names and highlight badges, reorder tabs, or toggle visibility in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-[#2C211A] text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#251D18] transition flex items-center gap-1.5"
            title="Reset to default 6 cosmetics categories"
          >
            <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 dark:hover:bg-rose-800 transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Navbar Category</span>
          </button>
        </div>
      </div>

      {/* Categories Table / Card Grid */}
      <div className="bg-white dark:bg-[#16100C] rounded-3xl border border-neutral-200 dark:border-[#2C211A] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-neutral-100 dark:border-[#2C211A] bg-[#FAF9F6] dark:bg-[#1A130E] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-neutral-800 dark:text-[#EDE4DA]">
              Active Categories List
            </span>
            <span className="text-xs bg-neutral-200 dark:bg-[#251D18] text-neutral-700 dark:text-neutral-300 font-mono font-bold px-2 py-0.5 rounded-full">
              {navbarCategories.length}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400">
            Drag / move order determines left-to-right navbar sequence
          </span>
        </div>

        <div className="divide-y divide-neutral-100 dark:divide-[#251B15]">
          {navbarCategories.map((cat, idx) => {
            const itemCount = productCountMap[cat.slug.toLowerCase()] || productCountMap[cat.name.toLowerCase()] || 0;
            const isFirst = idx === 0;
            const isLast = idx === navbarCategories.length - 1;

            return (
              <div
                key={cat.id || idx}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  cat.active !== false
                    ? 'hover:bg-neutral-50/70 dark:hover:bg-[#1E1611]/40'
                    : 'bg-neutral-50/50 dark:bg-[#120D0A]/50 opacity-60'
                }`}
              >
                {/* Left: Reorder & Name */}
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Sequence pill & reorder arrows */}
                  <div className="flex items-center gap-1">
                    <span className="w-6 text-center font-mono text-xs font-bold text-neutral-400">
                      {idx + 1}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-1 text-neutral-400 hover:text-neutral-800 dark:hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Category Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-neutral-900 dark:text-[#EDE4DA]">
                        {cat.name}
                      </h4>
                      {cat.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50">
                          {cat.badge}
                        </span>
                      )}
                      {cat.active === false && (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-neutral-200 text-neutral-600 dark:bg-[#251D18] dark:text-neutral-400">
                          Hidden from Navbar
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      <span className="font-mono text-[11px]">slug: {cat.slug || cat.name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-medium text-neutral-600 dark:text-neutral-400">
                        <Package className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{itemCount} products</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 sm:self-center">
                  {/* Quick preview on storefront */}
                  {onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate('plp', cat.slug || cat.name)}
                      className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-[#2C211A] text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#251D18] transition flex items-center gap-1"
                      title="Preview this category in storefront PLP"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                  )}

                  {/* Toggle Navbar Visibility */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                      cat.active !== false
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'
                        : 'bg-neutral-100 dark:bg-[#251D18] text-neutral-500 border-neutral-200 dark:border-[#2C211A]'
                    }`}
                    title={cat.active !== false ? 'Category is live on navbar' : 'Category is hidden'}
                  >
                    {cat.active !== false ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hidden</span>
                      </>
                    )}
                  </button>

                  {/* Edit Category */}
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#251D18] transition"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Category */}
                  <button
                    type="button"
                    onClick={() => setDeletingCategory(cat)}
                    className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL 1: ADD NEW CATEGORY */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative bg-white dark:bg-[#1A1410] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-[#2C211A] z-10 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA]">
                  Add Navbar Category
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Body Lotions & Oils"
                  value={newCatName}
                  onChange={(e) => {
                    setNewCatName(e.target.value);
                    if (!newCatSlug || newCatSlug === newCatName) {
                      setNewCatSlug(e.target.value);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Catalog Matching Slug
                </label>
                <input
                  type="text"
                  placeholder="e.g. Body Lotions & Oils"
                  value={newCatSlug}
                  onChange={(e) => setNewCatSlug(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-[11px]"
                />
                <p className="text-[10px] text-neutral-400 mt-1">
                  Must match the product subCategory value in catalog to automatically filter products.
                </p>
              </div>

              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Highlight Badge (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. HOT, NEW, POPULAR, SPF 50+"
                  value={newCatBadge}
                  onChange={(e) => setNewCatBadge(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newCatActive"
                  checked={newCatActive}
                  onChange={(e) => setNewCatActive(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="newCatActive" className="font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Visible immediately in navbar header and mobile menu
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-[#2C211A]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#251D18] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#1E1611] dark:bg-rose-900 text-white font-semibold hover:bg-rose-700 dark:hover:bg-rose-800 transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Create Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CATEGORY */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={() => setEditingCategory(null)}
          />
          <div className="relative bg-white dark:bg-[#1A1410] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-[#2C211A] z-10 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA]">
                  Edit Category: {editingCategory.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCategory} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Catalog Matching Slug
                </label>
                <input
                  type="text"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                  Highlight Badge (e.g. HOT, SPF 50+, BEST SELLER)
                </label>
                <input
                  type="text"
                  placeholder="Leave empty for no badge"
                  value={editBadge}
                  onChange={(e) => setEditBadge(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editActive"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="editActive" className="font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Visible in header navbar and mobile menu
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-[#2C211A]">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#251D18] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#1E1611] dark:bg-rose-900 text-white font-semibold hover:bg-rose-700 dark:hover:bg-rose-800 transition flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DELETE CATEGORY CONFIRMATION */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="fixed inset-0"
            onClick={() => setDeletingCategory(null)}
          />
          <div className="relative bg-white dark:bg-[#1A1410] rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-neutral-200 dark:border-[#2C211A] z-10 space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA]">
              Delete Category?
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Are you sure you want to remove <span className="font-bold text-neutral-800 dark:text-neutral-200">"{deletingCategory.name}"</span> from the navbar and catalog filters?
            </p>

            <div className="flex justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:hover:bg-[#251D18] text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
              >
                Yes, Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
