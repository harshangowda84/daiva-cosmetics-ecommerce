import React, { useState } from 'react';
import { Truck, CheckCircle2, AlertTriangle, RotateCcw, Package, Clock, ShieldCheck, X, ArrowRight, UserCheck, RefreshCw, AlertCircle } from 'lucide-react';
import { CustomerOrder } from '../types';
import { api } from '../services/api';

interface XpressBeesSimulatorModalProps {
  order: CustomerOrder;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: CustomerOrder) => void;
}

export const XpressBeesSimulatorModal: React.FC<XpressBeesSimulatorModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [ndrReason, setNdrReason] = useState('CUSTOMER_UNREACHABLE');
  const [ndrNotes, setNdrNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !order) return null;

  const isDispatched = !!order.awbNumber;
  const isDelivered = order.orderStatus === 'DELIVERED';
  const isCancelled = order.orderStatus === 'CANCELLED' || order.orderStatus === 'RETURNED';

  // 1. Simulate Dispatch (Manifest)
  const handleManifest = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const updated = await api.manifestShipment(order.id);
      onOrderUpdated(updated);
      setStatusMessage({ type: 'success', text: `Shipment Manifested! Assigned XpressBees AWB: ${updated.awbNumber}` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Manifest failed' });
    } finally {
      setLoading(false);
    }
  };

  // 2. Simulate Order Delivered (Syncs DB, Zoho, Razorpay, and Customer Profile)
  const handleMarkDelivered = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const updated = await api.deliverOrder(order.id);
      onOrderUpdated(updated);
      setStatusMessage({
        type: 'success',
        text: `Order delivered successfully! Synced across Local DB, Zoho Inventory Sales Order, and Customer Profile.`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to mark delivered' });
    } finally {
      setLoading(false);
    }
  };

  // 3. Simulate Doorstep Delivery Failure / NDR
  const handleFailDoorstep = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const updated = await api.failDoorstepDelivery(order.id, ndrReason, ndrNotes);
      onOrderUpdated(updated);
      setStatusMessage({
        type: 'success',
        text: `Doorstep delivery failure recorded (${ndrReason}). RTO initiated back to warehouse. Instant refund processed & Zoho order voided.`,
      });
      setActiveAction(null);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to simulate doorstep failure' });
    } finally {
      setLoading(false);
    }
  };

  // 4. Simulate In-Transit Cancellation (Customer cancels after dispatch)
  const handleCancelInTransit = async () => {
    if (!window.confirm('Simulate in-transit cancellation? Package will be redirected via XpressBees RTO and customer will receive instant refund.')) {
      return;
    }
    setLoading(true);
    setStatusMessage(null);
    try {
      const updated = await api.cancelOrder(order.id, 'Cancelled in transit by customer - RTO initiated');
      onOrderUpdated(updated);
      setStatusMessage({
        type: 'success',
        text: `In-transit cancellation complete! RTO shipment active, stock restored, instant Razorpay refund triggered.`,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'In-transit cancellation failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative bg-white dark:bg-[#1A1410] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#2C211A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-neutral-900 dark:text-[#EDE4DA]">
                  XpressBees Logistics Simulator
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  Interactive Emulation
                </span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Order #{order.orderNumber} • {order.customerName} ({order.city}, {order.pincode})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#251D18] hover:bg-neutral-200 dark:hover:bg-[#33261D] text-neutral-500 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="overflow-y-auto py-4 space-y-4 text-xs">
          {/* Order Live Status Card */}
          <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#221914] border border-[#ede7df] dark:border-[#2C211A] grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Order Status</span>
              <span className={`font-bold ${
                order.orderStatus === 'DELIVERED' ? 'text-emerald-600 dark:text-emerald-400' :
                order.orderStatus === 'CANCELLED' ? 'text-rose-600 dark:text-rose-400' :
                order.orderStatus === 'SHIPPED' ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-800 dark:text-neutral-200'
              }`}>
                {order.orderStatus}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Courier / AWB</span>
              <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200 truncate block">
                {order.awbNumber || 'Not Dispatched'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Logistics Status</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 block truncate">
                {order.courierStatus || 'PENDING'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-neutral-400 block font-semibold">Zoho SalesOrder</span>
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                {order.zohoSalesOrderNumber || order.zohoSyncStatus}
              </span>
            </div>
          </div>

          {/* Feedback banner */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 text-red-800 dark:text-red-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
              )}
              <span className="leading-snug">{statusMessage.text}</span>
            </div>
          )}

          {/* Simulation Action Buttons Grid */}
          <div className="space-y-3">
            <h4 className="font-bold text-neutral-900 dark:text-[#EDE4DA] uppercase tracking-wider text-[11px]">
              Available Courier Simulation Triggers
            </h4>

            {/* 1. Dispatch & Assign AWB */}
            {!isDispatched && !isCancelled && (
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-[#2C211A] bg-white dark:bg-[#1E1611] flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-neutral-900 dark:text-[#EDE4DA]">Step 1: Manifest & Dispatch Order</h5>
                  <p className="text-[11px] text-neutral-500">
                    Assigns XpressBees Air Express AWB, generates shipping label, and transitions order to SHIPPED.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleManifest}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#1E1611] dark:bg-rose-900 text-white font-bold text-xs hover:bg-rose-700 transition shrink-0 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Manifest Shipment
                </button>
              </div>
            )}

            {/* 2. Order Delivered */}
            {isDispatched && !isDelivered && !isCancelled && (
              <div className="p-3.5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Deliver Order (Multi-System Sync)</span>
                  </h5>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                    Marks order DELIVERED. Updates Local DB, marks Zoho Sales Order fulfilled, records Razorpay delivery, and updates customer profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMarkDelivered}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition shrink-0 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Mark Delivered
                </button>
              </div>
            )}

            {/* 3. In-Transit Cancellation (After Dispatch) */}
            {isDispatched && !isDelivered && !isCancelled && (
              <div className="p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 flex items-center justify-between gap-3">
                <div>
                  <h5 className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-amber-600" />
                    <span>In-Transit Cancellation (RTO Back to Seller)</span>
                  </h5>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                    Customer cancels while order is in-transit. Intercepts shipment with XpressBees RTO, initiates instant refund, and returns items to warehouse.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelInTransit}
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition shrink-0 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Cancel In-Transit
                </button>
              </div>
            )}

            {/* 4. Doorstep Delivery Failure / NDR Emulation */}
            {isDispatched && !isDelivered && !isCancelled && (
              <div className="p-3.5 rounded-2xl border border-neutral-200 dark:border-[#2C211A] bg-white dark:bg-[#1E1611] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span>Doorstep Delivery Failed / NDR Emulation</span>
                    </h5>
                    <p className="text-[11px] text-neutral-500">
                      Simulate doorstep delivery rejection (e.g. customer unreachable, ordered mistakenly, premises closed).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveAction(activeAction === 'ndr' ? null : 'ndr')}
                    className="px-3.5 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-[#251D18] transition"
                  >
                    {activeAction === 'ndr' ? 'Close NDR Options' : 'Configure NDR'}
                  </button>
                </div>

                {activeAction === 'ndr' && (
                  <div className="p-3 bg-neutral-50 dark:bg-[#221914] rounded-xl border border-neutral-200 dark:border-[#382B21] space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                        Select Non-Delivery Reason (NDR):
                      </label>
                      <select
                        value={ndrReason}
                        onChange={(e) => setNdrReason(e.target.value)}
                        className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1A1410] text-xs font-medium"
                      >
                        <option value="CUSTOMER_UNREACHABLE">Customer Not Picking Phone Call (3 attempts)</option>
                        <option value="MISTAKEN_ORDER">Customer Ordered Mistakenly & Refused Delivery</option>
                        <option value="CUSTOMER_REFUSED">Customer Refused - Does Not Want Product</option>
                        <option value="INCORRECT_ADDRESS">Customer Address Incomplete / Premises Locked</option>
                        <option value="CASH_NOT_READY">Customer COD Cash Not Ready / Postponed</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                        Courier Agent Field Notes:
                      </label>
                      <input
                        type="text"
                        value={ndrNotes}
                        onChange={(e) => setNdrNotes(e.target.value)}
                        placeholder="e.g. Called customer 3 times at destination gate, no response."
                        className="w-full p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#1A1410] text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleFailDoorstep}
                      disabled={loading}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Trigger Doorstep NDR & Initiate Auto-RTO</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {isDelivered && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <p className="font-bold text-emerald-900 dark:text-emerald-200">Shipment Fully Delivered</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                  Delivered on {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString('en-IN') : 'Recent'}. Customer can now initiate Return or Exchange from Profile if needed.
                </p>
              </div>
            )}

            {isCancelled && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-center space-y-1">
                <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
                <p className="font-bold text-rose-900 dark:text-rose-200">Order Cancelled / RTO Processed</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400">
                  Reason: {order.deliveryFailureReason || order.refundReason || 'Cancelled'}.
                  {order.refundStatus === 'REFUNDED' && ` Refund ID: ${order.refundId}`}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-neutral-100 dark:border-[#2C211A] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-100 dark:bg-[#251D18] hover:bg-neutral-200 dark:hover:bg-[#33261D] text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
};
