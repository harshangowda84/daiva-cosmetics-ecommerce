import React, { useState } from 'react';
import { RotateCcw, RefreshCw, X, AlertCircle, CheckCircle2, ShieldCheck, Camera, ArrowRight, Package } from 'lucide-react';
import { CustomerOrder, OrderItem, Product } from '../types';
import { api } from '../services/api';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface ReturnExchangeModalProps {
  order: CustomerOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  availableProducts?: Product[];
}

export const ReturnExchangeModal: React.FC<ReturnExchangeModalProps> = ({
  order,
  isOpen,
  onClose,
  onSuccess,
  availableProducts = [],
}) => {
  const [mode, setMode] = useState<'RETURN' | 'EXCHANGE'>('RETURN');
  const [selectedItemId, setSelectedItemId] = useState<number>(order.items?.[0]?.productId || 0);
  const [reasonCategory, setReasonCategory] = useState<string>('DAMAGED_LEAKING');
  const [detailedReason, setDetailedReason] = useState<string>('');
  const [proofImageUrl, setProofImageUrl] = useState<string>('');
  const [exchangeProductId, setExchangeProductId] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [successData, setSuccessData] = useState<any>(null);

  if (!isOpen || !order) return null;

  const returnReasons = [
    { value: 'DAMAGED_LEAKING', label: 'Damaged or leaking bottle/container' },
    { value: 'DEFECTIVE_PUMP', label: 'Defective dropper, pump, or dispenser' },
    { value: 'WRONG_ITEM', label: 'Wrong product or variant received' },
    { value: 'EXPIRED_PRODUCT', label: 'Product expired or close to expiry' },
    { value: 'QUALITY_SMELL', label: 'Texture, fragrance, or quality discrepancy' },
    { value: 'SKIN_SENSITIVITY', label: 'Skin irritation or adverse sensitivity' },
    { value: 'NOT_AS_DESCRIBED', label: 'Product does not match website pictures' },
  ];

  const exchangeReasons = [
    { value: 'WRONG_SHADE', label: 'Wrong shade or undertone chosen (Foundation / Lipstick / Blush)' },
    { value: 'WRONG_SIZE', label: 'Wrong volume/size ordered (e.g. 30ml vs 50ml)' },
    { value: 'CONTAINER_DAMAGED', label: 'Received damaged outer container - need fresh replacement' },
    { value: 'FORMULA_PREFERENCE', label: 'Prefer another skin formula in this range' },
  ];

  const selectedOrderItem = order.items?.find((i) => i.productId === selectedItemId) || order.items?.[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'EXCHANGE' && !exchangeProductId) {
      setError('Please select the replacement product you would like in exchange.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.requestReturnOrExchange(order.id, {
        userId: order.userId,
        type: mode,
        reasonCategory,
        detailedReason,
        proofImageUrl,
        originalProductId: selectedOrderItem?.productId,
        exchangeProductId: mode === 'EXCHANGE' ? exchangeProductId : undefined,
      });
      setSuccessData(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-[#1A1410] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#2C211A]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-[#EDE4DA]">
                Return or Exchange Item
              </h3>
              <p className="text-xs text-neutral-500">Order #{order.orderNumber} • 7-Day Easy Guarantee</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#251D18] hover:bg-neutral-200 dark:hover:bg-[#33261D] text-neutral-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successData ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif text-xl font-bold text-neutral-900 dark:text-[#EDE4DA]">
                {successData.type === 'RETURN' ? 'Return Pickup Scheduled!' : 'Exchange Request Confirmed!'}
              </h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                XpressBees courier pickup has been automatically booked. Reverse AWB: <strong className="font-mono text-neutral-900 dark:text-white">{successData.reverseAwbNumber}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#221914] text-xs text-left space-y-2 border border-neutral-200 dark:border-[#2C211A]">
              <div className="flex justify-between">
                <span className="text-neutral-500">Item:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{successData.originalProductName || 'Cosmetic Item'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Reason:</span>
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">{successData.reasonCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Pickup Courier:</span>
                <span className="font-semibold text-amber-600">XpressBees Reverse Logistics</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Refund Settlement:</span>
                <span className="font-semibold text-emerald-600">Instant Refund upon courier pickup inspection</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-[#1E1611] text-white text-xs font-bold hover:bg-rose-700 transition"
            >
              Done & View Order
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 text-xs">
            {/* Type Switcher: Return vs Exchange */}
            <div className="flex bg-[#FAF9F6] dark:bg-[#221914] p-1 rounded-2xl border border-neutral-200 dark:border-[#2C211A] text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setMode('RETURN'); setReasonCategory('DAMAGED_LEAKING'); }}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  mode === 'RETURN' ? 'bg-[#1E1611] dark:bg-rose-900 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return & Full Refund</span>
              </button>
              <button
                type="button"
                onClick={() => { setMode('EXCHANGE'); setReasonCategory('WRONG_SHADE'); }}
                className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                  mode === 'EXCHANGE' ? 'bg-[#1E1611] dark:bg-rose-900 text-white shadow-xs' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Exchange Item / Shade</span>
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Item to Return/Exchange */}
            <div>
              <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                Select Item from Order:
              </label>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <label
                    key={item.productId}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition ${
                      selectedItemId === item.productId
                        ? 'border-rose-500 bg-rose-50/30 dark:bg-rose-950/20'
                        : 'border-neutral-200 dark:border-[#2C211A] bg-white dark:bg-[#1A1410]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="orderItem"
                      checked={selectedItemId === item.productId}
                      onChange={() => setSelectedItemId(item.productId)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <img
                      src={getFullImageUrl(item.imageUrl)}
                      alt={item.productName}
                      className="w-10 h-10 rounded-lg object-cover border border-neutral-200 dark:border-neutral-800 shrink-0"
                      onError={handleImageError}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-neutral-900 dark:text-[#EDE4DA] truncate">{item.productName}</p>
                      <p className="text-[11px] text-neutral-500">Qty: {item.quantity} • ₹{item.price.toLocaleString()}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Category of Reason */}
            <div>
              <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                {mode === 'RETURN' ? 'Reason for Return:' : 'Reason for Exchange:'}
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-[#EDE4DA] text-xs font-medium focus:ring-1 focus:ring-rose-500"
              >
                {(mode === 'RETURN' ? returnReasons : exchangeReasons).map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* If Exchange: Select Replacement Product */}
            {mode === 'EXCHANGE' && (
              <div>
                <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                  Select Replacement Product / Shade:
                </label>
                <select
                  value={exchangeProductId}
                  onChange={(e) => setExchangeProductId(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-[#EDE4DA] text-xs font-medium focus:ring-1 focus:ring-rose-500"
                >
                  <option value={0}>-- Choose Replacement Product --</option>
                  {availableProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.subCategory}) - ₹{p.price}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Detailed Notes */}
            <div>
              <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1">
                Additional Details (Optional):
              </label>
              <textarea
                rows={2}
                value={detailedReason}
                onChange={(e) => setDetailedReason(e.target.value)}
                placeholder="Describe the issue with the shade, seal, or texture..."
                className="w-full p-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-[#EDE4DA] text-xs focus:ring-1 focus:ring-rose-500"
              />
            </div>

            {/* Proof Photo URL input for fast demo verification */}
            <div>
              <label className="font-semibold text-neutral-800 dark:text-neutral-200 block mb-1 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-rose-600" />
                <span>Damage / Condition Photo URL (Optional):</span>
              </label>
              <input
                type="url"
                value={proofImageUrl}
                onChange={(e) => setProofImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or paste image link"
                className="w-full p-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1A1410] text-neutral-900 dark:text-[#EDE4DA] text-xs"
              />
            </div>

            {/* Amazon / Flipkart Style Trust Note */}
            <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Doorstep Inspection & Instant Refund</span>
              </div>
              <p className="leading-relaxed">
                XpressBees courier will verify the cosmetic container and batch seal at your doorstep. Upon pickup confirmation, your refund of <strong>₹{order.totalAmount.toLocaleString()}</strong> will be instantly credited via Razorpay / Original Payment Method.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Scheduling...' : mode === 'RETURN' ? 'Confirm Return & Schedule Pickup' : 'Confirm Exchange'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
