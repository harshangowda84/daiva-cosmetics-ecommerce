import React from 'react';
import { Plus, Trash2, Sparkles, Layers, Box } from 'lucide-react';
import { ProductVariant } from '../types';

interface AdminVariantsEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice?: number;
  baseOriginalPrice?: number;
  baseSku?: string;
}

export const AdminVariantsEditor: React.FC<AdminVariantsEditorProps> = ({
  variants,
  onChange,
  basePrice = 999,
  baseOriginalPrice = 1399,
  baseSku = '',
}) => {
  // Preset generator helpers
  const applyPreset = (type: 'serums' | 'creams' | 'mists') => {
    const cleanSku = (baseSku || 'AL-PROD').toUpperCase();
    if (type === 'serums') {
      onChange([
        {
          size: '10 ml',
          label: '10 ml Mini / Trial',
          price: Math.max(199, Math.round(basePrice * 0.5)),
          originalPrice: Math.max(299, Math.round(baseOriginalPrice * 0.5)),
          stock: 25,
          sku: `${cleanSku}-10ML`,
        },
        {
          size: '30 ml',
          label: '30 ml Standard Size',
          price: basePrice,
          originalPrice: baseOriginalPrice,
          stock: 40,
          sku: `${cleanSku}-30ML`,
        },
        {
          size: '50 ml',
          label: '50 ml Value Jumbo',
          price: Math.round(basePrice * 1.5),
          originalPrice: Math.round(baseOriginalPrice * 1.5),
          stock: 20,
          sku: `${cleanSku}-50ML`,
        },
      ]);
    } else if (type === 'creams') {
      onChange([
        {
          size: '30 g',
          label: '30 g Travel Jar',
          price: Math.max(249, Math.round(basePrice * 0.7)),
          originalPrice: Math.max(349, Math.round(baseOriginalPrice * 0.7)),
          stock: 20,
          sku: `${cleanSku}-30G`,
        },
        {
          size: '50 g',
          label: '50 g Standard Jar',
          price: basePrice,
          originalPrice: baseOriginalPrice,
          stock: 35,
          sku: `${cleanSku}-50G`,
        },
        {
          size: '100 g',
          label: '100 g Family Tub',
          price: Math.round(basePrice * 1.7),
          originalPrice: Math.round(baseOriginalPrice * 1.7),
          stock: 15,
          sku: `${cleanSku}-100G`,
        },
      ]);
    } else if (type === 'mists') {
      onChange([
        {
          size: '50 ml',
          label: '50 ml Pocket Spray',
          price: basePrice,
          originalPrice: baseOriginalPrice,
          stock: 30,
          sku: `${cleanSku}-50ML`,
        },
        {
          size: '100 ml',
          label: '100 ml Full Size',
          price: Math.round(basePrice * 1.6),
          originalPrice: Math.round(baseOriginalPrice * 1.6),
          stock: 25,
          sku: `${cleanSku}-100ML`,
        },
      ]);
    }
  };

  const addEmptyVariant = () => {
    const nextNum = variants.length + 1;
    const cleanSku = (baseSku || 'AL-PROD').toUpperCase();
    onChange([
      ...variants,
      {
        size: `${nextNum * 25} ml`,
        label: `${nextNum * 25} ml Pack`,
        price: basePrice,
        originalPrice: baseOriginalPrice,
        stock: 20,
        sku: `${cleanSku}-${nextNum * 25}ML`,
      },
    ]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    const next = [...variants];
    next[index] = { ...next[index], [field]: val };
    onChange(next);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    onChange([]);
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-[#2C211A] bg-white dark:bg-[#1A1410] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <h4 className="font-bold text-sm text-neutral-800 dark:text-[#EDE4DA]">
              Product Item Quantity & Size Variants (10ml / 50ml / 100ml)
            </h4>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
              {variants.length} {variants.length === 1 ? 'Variant' : 'Variants'}
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-[#A89A90] mt-0.5">
            Customers choose between these sizes on the PDP. Each size has its own price, stock, and SKU.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={addEmptyVariant}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 dark:bg-rose-600 text-white hover:bg-neutral-800 dark:hover:bg-rose-700 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Size</span>
          </button>
          {variants.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="px-2.5 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-semibold transition"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Quick 1-Click Preset Generators */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-neutral-500 dark:text-[#A89A90] flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" /> Quick Presets:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('serums')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FAF9F6] dark:bg-[#201813] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-700 dark:text-[#D5C7BC] border border-neutral-200 dark:border-[#2C211A] hover:border-rose-300 transition"
        >
          + 10ml, 30ml, 50ml (Serums)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('creams')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FAF9F6] dark:bg-[#201813] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-700 dark:text-[#D5C7BC] border border-neutral-200 dark:border-[#2C211A] hover:border-rose-300 transition"
        >
          + 30g, 50g, 100g (Creams)
        </button>
        <button
          type="button"
          onClick={() => applyPreset('mists')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#FAF9F6] dark:bg-[#201813] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-neutral-700 dark:text-[#D5C7BC] border border-neutral-200 dark:border-[#2C211A] hover:border-rose-300 transition"
        >
          + 50ml, 100ml (Mists / SPF)
        </button>
      </div>

      {/* Empty State */}
      {variants.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-neutral-200 dark:border-[#2C211A] bg-[#FAF9F6] dark:bg-[#201813] text-center space-y-1">
          <Box className="w-6 h-6 text-neutral-400 mx-auto" />
          <p className="text-xs font-semibold text-neutral-700 dark:text-[#EDE4DA]">
            Single Volume Mode Active
          </p>
          <p className="text-[11px] text-neutral-500 dark:text-[#A89A90]">
            This product currently uses the single volume, price, and stock quantity configured above.
            Click a preset above or "+ Add Custom Size" to offer selectable sizes (e.g. 10ml, 50ml, 100ml) on the PDP.
          </p>
        </div>
      ) : (
        /* Variants Editor Rows */
        <div className="space-y-2.5">
          <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-[11px] font-bold text-neutral-500 dark:text-[#A89A90] px-1 uppercase tracking-wider">
            <div className="col-span-3">Size / Unit (e.g. 10ml) *</div>
            <div className="col-span-2">Price (₹) *</div>
            <div className="col-span-2">Orig Price (₹)</div>
            <div className="col-span-2">Stock Qty *</div>
            <div className="col-span-2">SKU Identifier</div>
            <div className="col-span-1 text-center">Action</div>
          </div>

          {variants.map((v, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl border border-neutral-200 dark:border-[#2C211A] bg-[#FAF9F6] dark:bg-[#201813] grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
            >
              <div className="sm:col-span-3">
                <label className="sm:hidden text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">
                  Size / Unit
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 10 ml or 50 g"
                  value={v.size}
                  onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-[#382B22] bg-white dark:bg-[#1A1410] text-xs font-semibold text-neutral-800 dark:text-[#EDE4DA] focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="sm:hidden text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">
                  Price (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Selling price"
                  value={v.price}
                  onChange={(e) => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-[#382B22] bg-white dark:bg-[#1A1410] text-xs font-semibold text-rose-700 dark:text-rose-400 focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="sm:hidden text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Original price"
                  value={v.originalPrice || ''}
                  onChange={(e) => updateVariant(idx, 'originalPrice', parseFloat(e.target.value) || undefined)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-[#382B22] bg-white dark:bg-[#1A1410] text-xs text-neutral-500 dark:text-[#A89A90] focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="sm:hidden text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">
                  Stock Units
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="Units in stock"
                  value={v.stock}
                  onChange={(e) => updateVariant(idx, 'stock', parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-[#382B22] bg-white dark:bg-[#1A1410] text-xs font-semibold text-neutral-800 dark:text-[#EDE4DA] focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="sm:hidden text-[10px] font-bold text-neutral-500 uppercase block mb-0.5">
                  SKU
                </label>
                <input
                  type="text"
                  placeholder="SKU"
                  value={v.sku || ''}
                  onChange={(e) => updateVariant(idx, 'sku', e.target.value.toUpperCase())}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-[#382B22] bg-white dark:bg-[#1A1410] text-xs font-mono text-neutral-700 dark:text-[#D5C7BC] focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="sm:col-span-1 text-right sm:text-center">
                <button
                  type="button"
                  onClick={() => removeVariant(idx)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  title="Remove variant"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
