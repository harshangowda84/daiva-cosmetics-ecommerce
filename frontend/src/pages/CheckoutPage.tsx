import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  Smartphone,
  AlertCircle,
  X,
  Lock,
  Loader2,
  QrCode,
  Wallet,
  Sparkles,
  Home,
  Building2,
  MapPin,
  Plus,
  Check,
  Edit3
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CustomerOrder, RazorpayOrderResponse, ShippingServiceability, UserAddress } from '../types';

interface CheckoutPageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const {
    items,
    selectedItems,
    subtotal,
    shippingFee,
    totalAmount,
    selectedSubtotal,
    selectedShippingFee,
    selectedTotalAmount,
    clearCart,
    clearSelectedItems,
  } = useCart();
  const { user, refreshUser } = useAuth();

  const checkoutItems = selectedItems.length > 0 ? selectedItems : items;
  const checkoutSubtotal = selectedItems.length > 0 ? selectedSubtotal : subtotal;
  const checkoutShippingFee = selectedItems.length > 0 ? selectedShippingFee : shippingFee;
  const checkoutTotalAmount = selectedItems.length > 0 ? selectedTotalAmount : totalAmount;

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new' | null>(null);

  // Address Modal in Checkout
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addrType, setAddrType] = useState<'HOME' | 'OFFICE' | 'OTHER'>('HOME');
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrLandmark, setAddrLandmark] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPincode, setAddrPincode] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrSaving, setAddrSaving] = useState(false);
  const [addrError, setAddrError] = useState('');

  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
    addressLine: user?.addressLine1 || '',
    city: user?.city || '',
    state: user?.state || '',
    pincode: user?.pincode || '',
    paymentMethod: 'RAZORPAY', // Default to Razorpay
    saveToProfile: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<CustomerOrder | null>(null);

  // Load User Addresses and pre-select default
  useEffect(() => {
    if (user?.id) {
      setLoadingAddresses(true);
      api.getUserAddresses(user.id)
        .then((addrs) => {
          setSavedAddresses(addrs);
          if (addrs.length > 0) {
            const def = addrs.find((a) => a.isDefault) || addrs[0];
            setSelectedAddressId(def.id);
            setFormData((prev) => ({
              ...prev,
              customerName: def.recipientName || user.fullName || prev.customerName,
              customerEmail: user.email || prev.customerEmail,
              customerPhone: def.phone || user.phone || prev.customerPhone,
              addressLine: def.addressLine1 + (def.addressLine2 ? `, ${def.addressLine2}` : '') + (def.landmark ? ` (Near ${def.landmark})` : ''),
              city: def.city,
              state: def.state,
              pincode: def.pincode,
            }));
          } else {
            setSelectedAddressId('new');
            setFormData((prev) => ({
              ...prev,
              customerName: user.fullName || prev.customerName,
              customerEmail: user.email || prev.customerEmail,
              customerPhone: user.phone || prev.customerPhone,
              addressLine: user.addressLine1 || '',
              city: user.city || '',
              state: user.state || '',
              pincode: user.pincode || '',
            }));
          }
        })
        .catch((e) => {
          console.error('Failed to load user addresses', e);
          setSelectedAddressId('new');
        })
        .finally(() => setLoadingAddresses(false));
    } else {
      setSelectedAddressId('new');
    }
  }, [user]);

  const handleSelectAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      customerName: addr.recipientName || prev.customerName,
      customerPhone: addr.phone || prev.customerPhone,
      addressLine: addr.addressLine1 + (addr.addressLine2 ? `, ${addr.addressLine2}` : '') + (addr.landmark ? ` (Near ${addr.landmark})` : ''),
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    }));
  };

  const handleOpenNewAddressModal = () => {
    setAddrType('HOME');
    setAddrRecipient(user?.fullName || formData.customerName || '');
    setAddrPhone(user?.phone || formData.customerPhone || '');
    setAddrLine1('');
    setAddrLine2('');
    setAddrLandmark('');
    setAddrCity('Bengaluru');
    setAddrState('Karnataka');
    setAddrPincode('');
    setAddrIsDefault(savedAddresses.length === 0);
    setAddrError('');
    setIsAddressModalOpen(true);
  };

  const handleSaveNewAddressInCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLine1.trim() || !addrCity.trim() || !addrState.trim() || !addrPincode.trim() || !addrRecipient.trim() || !addrPhone.trim()) {
      setAddrError('Please fill in all required fields.');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(addrPincode.trim())) {
      setAddrError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    try {
      setAddrSaving(true);
      setAddrError('');
      if (user?.id) {
        const created = await api.createUserAddress(user.id, {
          addressType: addrType,
          recipientName: addrRecipient.trim(),
          phone: addrPhone.trim(),
          addressLine1: addrLine1.trim(),
          addressLine2: addrLine2.trim() || undefined,
          landmark: addrLandmark.trim() || undefined,
          city: addrCity.trim(),
          state: addrState.trim(),
          pincode: addrPincode.trim(),
          isDefault: addrIsDefault,
        });

        const refreshed = await api.getUserAddresses(user.id);
        setSavedAddresses(refreshed);
        handleSelectAddress(created);
        if (refreshUser) await refreshUser();
      } else {
        setFormData((prev) => ({
          ...prev,
          customerName: addrRecipient.trim(),
          customerPhone: addrPhone.trim(),
          addressLine: addrLine1.trim() + (addrLine2 ? `, ${addrLine2}` : '') + (addrLandmark ? ` (Near ${addrLandmark})` : ''),
          city: addrCity.trim(),
          state: addrState.trim(),
          pincode: addrPincode.trim(),
        }));
        setSelectedAddressId('new');
      }

      setIsAddressModalOpen(false);
    } catch (err: any) {
      setAddrError(err.message || 'Failed to save address');
    } finally {
      setAddrSaving(false);
    }
  };

  // Xpressbees Pincode Serviceability States
  const [shippingInfo, setShippingInfo] = useState<ShippingServiceability | null>(null);
  const [checkingPincode, setCheckingPincode] = useState(false);

  // Razorpay Polling Ref
  const pollTimerRef = useRef<any>(null);

  // Check pincode serviceability
  useEffect(() => {
    const pin = (formData.pincode || '').trim();
    if (/^[1-9][0-9]{5}$/.test(pin)) {
      setCheckingPincode(true);
      api.checkPincodeServiceability(pin)
        .then((res) => setShippingInfo(res))
        .catch(() => setShippingInfo(null))
        .finally(() => setCheckingPincode(false));
    } else {
      setShippingInfo(null);
    }
  }, [formData.pincode]);

  // Clean up any active polling timer on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, []);

  // Razorpay Interactive Test Modal States
  const [mockModalOpen, setMockModalOpen] = useState(false);
  const [mockOrderDetails, setMockOrderDetails] = useState<RazorpayOrderResponse | null>(null);
  const [mockPaymentChannel, setMockPaymentChannel] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [simulatingPayment, setSimulatingPayment] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const executePlaceOrder = async (paymentDetails?: {
    paymentMethod: string;
    paymentStatus: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  }) => {
    const payload = {
      userId: user?.id,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      addressLine: formData.addressLine,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
      paymentMethod: paymentDetails?.paymentMethod || formData.paymentMethod,
      paymentStatus: paymentDetails?.paymentStatus || (formData.paymentMethod === 'COD' ? 'PENDING' : 'PAID'),
      razorpayOrderId: paymentDetails?.razorpayOrderId,
      razorpayPaymentId: paymentDetails?.razorpayPaymentId,
      razorpaySignature: paymentDetails?.razorpaySignature,
      items: checkoutItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        price: item.product.price,
      })),
    };

    // Auto-save new address to profile if checked
    if (formData.saveToProfile && user?.id && selectedAddressId === 'new') {
      try {
        await api.createUserAddress(user.id, {
          addressType: 'HOME',
          recipientName: formData.customerName,
          phone: formData.customerPhone,
          addressLine1: formData.addressLine,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          isDefault: savedAddresses.length === 0,
        });
        if (refreshUser) await refreshUser();
      } catch (err) {
        console.warn('Could not auto-save address to profile:', err);
      }
    }

    const order = await api.placeOrder(payload);
    setCompletedOrder(order);
    if (selectedItems.length > 0) {
      clearSelectedItems();
    } else {
      clearCart();
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    try {
      setLoading(true);
      setError('');

      if (formData.paymentMethod === 'COD') {
        // Direct COD Order placement
        await executePlaceOrder({
          paymentMethod: 'COD',
          paymentStatus: 'PENDING',
        });
      } else {
        // Razorpay Online Payment Flow
        const razorpayOrder = await api.createRazorpayOrder(checkoutTotalAmount, 'rcpt_' + Date.now());

        if (razorpayOrder.isMockMode) {
          // Open interactive test simulator
          setMockOrderDetails(razorpayOrder);
          setMockModalOpen(true);
        } else {
          // Live Razorpay Checkout
          await openRealRazorpayCheckout(razorpayOrder);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process checkout');
    } finally {
      setLoading(false);
    }
  };

  // Live Razorpay SDK checkout opener with 3s active UPI polling fallback
  const openRealRazorpayCheckout = async (orderInfo: RazorpayOrderResponse) => {
    if (!(window as any).Razorpay) {
      // Dynamically load razorpay script
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
        document.body.appendChild(script);
      });
    }

    let paymentResolved = false;

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const options = {
      key: orderInfo.keyId,
      amount: orderInfo.amount,
      currency: orderInfo.currency,
      name: orderInfo.companyName,
      description: `Payment for ${items.length} cosmetics item(s)`,
      order_id: orderInfo.orderId,
      prefill: {
        name: formData.customerName,
        email: formData.customerEmail,
        contact: formData.customerPhone,
      },
      theme: {
        color: '#BE185D',
      },
      handler: async (response: any) => {
        if (paymentResolved) return;
        paymentResolved = true;
        stopPolling();

        try {
          setLoading(true);
          // 1. Cryptographically verify signature on server
          await api.verifyPayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          // 2. Save order as PAID
          await executePlaceOrder({
            paymentMethod: 'RAZORPAY',
            paymentStatus: 'PAID',
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          });
        } catch (err: any) {
          setError('Payment verification failed: ' + err.message);
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: () => {
          stopPolling();
          if (!paymentResolved) {
            setError('Payment window closed. If you completed payment on your UPI app, please wait a moment or check My Orders.');
          }
        },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();

    // Start 3-second active UPI polling fallback
    stopPolling();
    pollTimerRef.current = setInterval(async () => {
      if (paymentResolved) return;
      try {
        const check = await api.checkOrderStatus(orderInfo.orderId);
        if (check && check.paid && !paymentResolved) {
          paymentResolved = true;
          stopPolling();
          try {
            rzp.close();
          } catch (_) {}

          setLoading(true);
          await executePlaceOrder({
            paymentMethod: 'RAZORPAY',
            paymentStatus: 'PAID',
            razorpayOrderId: orderInfo.orderId,
            razorpayPaymentId: check.paymentId || 'pay_poll_' + Date.now(),
            razorpaySignature: 'sig_verified_via_server_polling',
          });
        }
      } catch (err) {
        // Silent poll error; continue polling
      }
    }, 3000);
  };

  // Mock Simulation Actions
  const handleSimulatePayment = async (isSuccess: boolean) => {
    if (!mockOrderDetails) return;

    if (!isSuccess) {
      setMockModalOpen(false);
      setError('Payment simulation: The issuing bank / UPI provider declined the transaction. No funds were captured.');
      return;
    }

    try {
      setSimulatingPayment(true);
      setError('');

      // 1. Ask backend to generate authentic mock payment ID and valid cryptographic HMAC signature
      const mockResult = await api.simulateMockPayment(mockOrderDetails.orderId);

      // 2. Submit to backend /verify endpoint to prove cryptographic verification works end-to-end
      const verification = await api.verifyPayment(
        mockResult.orderId,
        mockResult.paymentId,
        mockResult.signature
      );

      if (!verification.valid) {
        throw new Error('HMAC signature verification failed on backend');
      }

      // 3. Confirm order, deduct batch stock, and record in audit log
      await executePlaceOrder({
        paymentMethod: 'RAZORPAY',
        paymentStatus: 'PAID',
        razorpayOrderId: mockResult.orderId,
        razorpayPaymentId: mockResult.paymentId,
        razorpaySignature: mockResult.signature,
      });

      setMockModalOpen(false);
    } catch (err: any) {
      setError('Simulated payment error: ' + err.message);
    } finally {
      setSimulatingPayment(false);
    }
  };

  // Order Success Screen
  if (completedOrder) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-emerald-700 font-bold">
            Order Confirmed & Recorded
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-neutral-900">
            Thank You For Your Order!
          </h1>
          <p className="text-xs text-neutral-500">
            A confirmation receipt has been generated and your cosmetics will be carefully prepared for dispatch.
          </p>
        </div>

        {/* Order Details Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 text-left shadow-sm space-y-6">
          <div className="flex flex-wrap justify-between items-center pb-4 border-b border-neutral-100 gap-2">
            <div>
              <p className="text-xs text-neutral-400">Order Reference</p>
              <p className="font-mono text-base font-bold text-neutral-900">{completedOrder.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-neutral-400">Total Paid / Due</p>
              <p className="font-serif text-xl font-bold text-rose-800">₹{completedOrder.totalAmount.toLocaleString()}</p>
            </div>
          </div>

          {/* Payment Status Banner */}
          {completedOrder.paymentMethod === 'RAZORPAY' ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 flex items-center gap-1.5 flex-wrap">
                    <span>Payment Verified via Razorpay</span>
                    <span className="text-[10px] font-mono bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                      PAID
                    </span>
                  </p>
                  <p className="text-[11px] text-neutral-600 font-mono mt-0.5">
                    Payment ID: <strong className="text-neutral-900">{completedOrder.razorpayPaymentId || 'pay_verified'}</strong>
                  </p>
                  {completedOrder.razorpayOrderId && (
                    <p className="text-[10px] text-neutral-500 font-mono">
                      Razorpay Order: {completedOrder.razorpayOrderId}
                    </p>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white text-emerald-800 border border-emerald-200 self-start sm:self-auto shadow-xs">
                Instant Capture
              </span>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-sm flex-shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900 flex items-center gap-1.5 flex-wrap">
                    <span>Cash on Delivery (COD)</span>
                    <span className="text-[10px] font-mono bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                      PAYMENT PENDING
                    </span>
                  </p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    Please keep exact cash or UPI ready for delivery at your doorstep.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-emerald-700 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900">Order Status: Confirmed</p>
                <p className="text-[11px] text-neutral-500">
                  Your cosmetics order is confirmed. Scheduled for dispatch via Xpressbees Express within 24 hours.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Confirmed
            </span>
          </div>

          {/* Courier & Delivery Partner Information */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50/50 to-orange-50/30 border border-amber-200/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900 flex items-center gap-2">
                  <span>Logistics Partner: Xpressbees Express</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-mono px-2 py-0.5 rounded font-semibold">
                    SURFACE / AIR
                  </span>
                </p>
                <p className="text-[11px] text-neutral-500">
                  Tracking details & AWB will be updated as soon as our warehouse hands off your package.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-neutral-700 hidden sm:inline-block">
              Est. 2-3 Days
            </span>
          </div>

          {/* Items summary */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Cosmetics in this order</p>
            <div className="space-y-2">
              {completedOrder.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-xs text-neutral-700">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{item.quantity}x</span>
                    <span>{item.productName}</span>
                  </div>
                  <span className="font-semibold text-neutral-900">₹{item.totalPrice.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="pt-4 border-t border-neutral-100 text-xs text-neutral-600">
            <p className="font-semibold text-neutral-800">Delivering To:</p>
            <p>{completedOrder.customerName} ({completedOrder.customerPhone})</p>
            <p>{completedOrder.addressLine}, {completedOrder.city}, {completedOrder.state} - {completedOrder.pincode}</p>
          </div>
        </div>

        <div className="flex justify-center gap-4 pt-4">
          <button
            onClick={() => onNavigate('profile')}
            className="px-6 py-3 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-800 hover:bg-neutral-100 transition"
          >
            View in My Orders
          </button>
          <button
            onClick={() => onNavigate('plp', 'All')}
            className="px-8 py-3 rounded-full bg-[#1E1611] text-white text-xs font-semibold hover:bg-rose-700 transition shadow-lg"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <ShoppingBag className="w-12 h-12 text-neutral-300 mx-auto" />
        <h2 className="font-serif text-2xl text-neutral-800">No items to checkout</h2>
        <button
          onClick={() => onNavigate('plp', 'All')}
          className="px-6 py-2.5 rounded-full bg-[#1E1611] text-white text-xs font-semibold"
        >
          Browse Cosmetics
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <span className="text-xs uppercase tracking-widest text-rose-700 font-bold">Fast Checkout</span>
        <h1 className="font-serif text-3xl text-neutral-900 mt-1">Shipping & Order Confirmation</h1>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-xs border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Shipping Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-[#1A1410] rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-[#2C211A] shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <h3 className="font-serif text-lg font-semibold text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-rose-700 dark:text-rose-400" />
                <span>1. Delivery Destination</span>
              </h3>
              {user && (
                <button
                  type="button"
                  onClick={handleOpenNewAddressModal}
                  className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Address</span>
                </button>
              )}
            </div>

            {/* SAVED ADDRESSES SELECTOR CAROUSEL / GRID (When user has saved addresses) */}
            {savedAddresses.length > 0 && (
              <div className="space-y-3">
                <label className="font-semibold text-xs text-neutral-700 dark:text-neutral-300 block">
                  Select from Saved Addresses
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {savedAddresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all duration-200 space-y-1.5 relative ${
                          isSelected
                            ? 'bg-rose-50/40 dark:bg-rose-950/30 border-rose-500 dark:border-rose-700 ring-2 ring-rose-500/20 shadow-xs'
                            : 'bg-white dark:bg-[#231A14] border-neutral-200 dark:border-[#2C211A] hover:border-neutral-300 dark:hover:border-[#382B21]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${
                              addr.addressType === 'HOME'
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : addr.addressType === 'OFFICE'
                                ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300'
                                : 'bg-neutral-100 dark:bg-[#33261D] text-neutral-700 dark:text-neutral-300'
                            }`}
                          >
                            {addr.addressType === 'HOME' && <Home className="w-2.5 h-2.5" />}
                            {addr.addressType === 'OFFICE' && <Building2 className="w-2.5 h-2.5" />}
                            {addr.addressType === 'OTHER' && <MapPin className="w-2.5 h-2.5" />}
                            <span>{addr.addressType}</span>
                          </span>

                          <div className="flex items-center gap-1">
                            {addr.isDefault && (
                              <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                                DEFAULT
                              </span>
                            )}
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-rose-700 border-rose-700 text-white'
                                  : 'border-neutral-300 dark:border-[#3D2C20]'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                            {addr.recipientName}
                          </p>
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono">
                            {addr.phone}
                          </p>
                        </div>

                        <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                        </p>
                        <p className="text-[11px] font-medium text-neutral-800 dark:text-[#EDE4DA]">
                          {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                      </div>
                    );
                  })}

                  {/* Option: Enter a Custom / Different Address */}
                  <div
                    onClick={() => {
                      setSelectedAddressId('new');
                      setFormData((prev) => ({
                        ...prev,
                        addressLine: '',
                        city: '',
                        state: '',
                        pincode: '',
                      }));
                    }}
                    className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all duration-200 flex flex-col items-center justify-center text-center space-y-1 ${
                      selectedAddressId === 'new'
                        ? 'bg-rose-50/40 dark:bg-rose-950/30 border-rose-500 dark:border-rose-700 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-neutral-50/60 dark:bg-[#231A14] border-dashed border-neutral-200 dark:border-[#2C211A] hover:border-neutral-300'
                    }`}
                  >
                    <Plus className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <p className="font-semibold text-neutral-800 dark:text-[#EDE4DA]">
                      Deliver to a Different Address
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      Enter temporary or new address below
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* MANUAL / EDITABLE ADDRESS INPUT FIELDS */}
            {(selectedAddressId === 'new' || savedAddresses.length === 0) && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-neutral-800 dark:text-[#EDE4DA]">
                    {savedAddresses.length > 0 ? 'Custom Delivery Address' : 'Enter Delivery Address'}
                  </h4>
                  {user && savedAddresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectAddress(savedAddresses[0])}
                      className="text-xs text-rose-700 dark:text-rose-400 hover:underline font-semibold"
                    >
                      ← Back to saved addresses
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="customerName"
                      required
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="e.g. Priya Sharma"
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      name="customerPhone"
                      required
                      value={formData.customerPhone}
                      onChange={handleChange}
                      placeholder="e.g. +91 9876543210"
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="customerEmail"
                      required
                      value={formData.customerEmail}
                      onChange={handleChange}
                      placeholder="e.g. priya@demo.com"
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Street Address / Apartment *</label>
                    <input
                      type="text"
                      name="addressLine"
                      required
                      value={formData.addressLine}
                      onChange={handleChange}
                      placeholder="House/Flat No., Building Name, Street"
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Bengaluru"
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Karnataka"
                      className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Pincode *</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="pincode"
                        required
                        maxLength={6}
                        value={formData.pincode}
                        onChange={handleChange}
                        placeholder="e.g. 560038"
                        className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                      />
                      {checkingPincode && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-neutral-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Checking Xpressbees...</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {user && (
                    <div className="sm:col-span-2 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formData.saveToProfile}
                          onChange={(e) => setFormData({ ...formData, saveToProfile: e.target.checked })}
                          className="rounded border-neutral-300 text-rose-700 focus:ring-rose-500 w-4 h-4"
                        />
                        <span className="text-xs text-neutral-700 dark:text-neutral-300">
                          Save this address to my profile for future orders
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Xpressbees Serviceability Feedback (Shown for both selected or manual address) */}
            {shippingInfo && (
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                  shippingInfo.serviceable
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {shippingInfo.serviceable ? (
                  <>
                    <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold flex items-center gap-1.5 flex-wrap">
                        <span>Serviceable by {shippingInfo.courier || 'Xpressbees Express'}</span>
                        <span className="text-[10px] bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase">
                          Est. {shippingInfo.estimatedDays || 3} Days Delivery
                        </span>
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Prepaid UPI / Cards {shippingInfo.isCodAvailable ? '& Cash on Delivery supported' : ''} for {formData.city || 'your area'}.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Pincode {shippingInfo.pincode} is not currently serviceable</p>
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5">
                        {shippingInfo.message || 'Please check your pincode or try an alternate delivery address.'}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="font-serif text-lg font-semibold text-neutral-900">
                2. Select Payment Method
              </h3>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
                <Lock className="w-3 h-3" />
                <span>256-bit Encrypted</span>
              </span>
            </div>

            <div className="space-y-3">
              {/* Option 1: Razorpay Online Payment */}
              <label
                className={`flex items-start justify-between p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer ${
                  formData.paymentMethod === 'RAZORPAY'
                    ? 'border-neutral-900 bg-[#FAF9F6] shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="RAZORPAY"
                    checked={formData.paymentMethod === 'RAZORPAY'}
                    onChange={handleChange}
                    className="accent-neutral-900 w-4 h-4 mt-1"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-neutral-900">
                        Online Payment (UPI, Cards, NetBanking)
                      </span>
                      <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                        Razorpay
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Pay instantly with Google Pay, PhonePe, Paytm, QR Code, Visa, Mastercard, RuPay, or NetBanking.
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-semibold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">UPI</span>
                      <span className="text-[10px] font-semibold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">GPay</span>
                      <span className="text-[10px] font-semibold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">PhonePe</span>
                      <span className="text-[10px] font-semibold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">Cards</span>
                      <span className="text-[10px] font-semibold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">NetBanking</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-rose-700" />
                </div>
              </label>

              {/* Option 2: Cash on Delivery */}
              <label
                className={`flex items-start justify-between p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer ${
                  formData.paymentMethod === 'COD'
                    ? 'border-neutral-900 bg-[#FAF9F6] shadow-sm'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={handleChange}
                    className="accent-neutral-900 w-4 h-4 mt-1"
                  />
                  <div>
                    <span className="text-xs font-bold text-neutral-900 block">
                      Cash on Delivery (COD)
                    </span>
                    <p className="text-[11px] text-neutral-500 mt-1">
                      Pay with cash or UPI directly to the courier when your package arrives at your doorstep.
                    </p>
                    <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded mt-2">
                      No advance payment needed
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-neutral-700" />
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right: Order Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6 sticky top-24">
            <h3 className="font-serif text-lg font-semibold text-neutral-900 pb-3 border-b border-neutral-100">
              Order Summary ({checkoutItems.length} items)
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {checkoutItems.map((item) => (
                <div key={item.product.id} className="flex gap-3 items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      className="w-12 h-14 rounded-lg object-cover bg-neutral-100 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-800 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-neutral-400">Qty: {item.quantity} • {item.product.volume}</p>
                    </div>
                  </div>
                  <span className="font-bold text-neutral-900 flex-shrink-0">
                    ₹{(item.product.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs text-neutral-600 pt-4 border-t border-neutral-100">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900">₹{checkoutSubtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span>{checkoutShippingFee === 0 ? <strong className="text-emerald-700">FREE</strong> : `₹${checkoutShippingFee}`}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-neutral-900 pt-3 border-t border-neutral-200">
                <span>Total Amount</span>
                <span className="text-rose-800">₹{checkoutTotalAmount.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || simulatingPayment}
              className={`w-full py-4 rounded-full bg-[#1E1611] text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xl ${
                loading ? 'opacity-70 cursor-wait' : 'hover:bg-rose-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Razorpay...</span>
                </>
              ) : formData.paymentMethod === 'RAZORPAY' ? (
                <>
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Pay ₹{checkoutTotalAmount.toLocaleString()} via Razorpay</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  <Truck className="w-4 h-4 text-amber-300" />
                  <span>Place Order (Pay ₹{checkoutTotalAmount.toLocaleString()} on Delivery)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-neutral-400 flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Authentic Luxury Cosmetics • Safe & Secure</span>
            </div>

            <div className="pt-2 border-t border-neutral-100 text-center text-[10px] text-neutral-400 leading-relaxed">
              By placing your order, you agree to Aura Luxe's{' '}
              <button type="button" onClick={() => onNavigate('policy', 'terms')} className="text-neutral-600 underline hover:text-rose-700">Terms</button>,{' '}
              <button type="button" onClick={() => onNavigate('policy', 'refund-policy')} className="text-neutral-600 underline hover:text-rose-700">7-Day Refund Policy</button>, and{' '}
              <button type="button" onClick={() => onNavigate('policy', 'shipping-policy')} className="text-neutral-600 underline hover:text-rose-700">Xpressbees Shipping</button>.
            </div>
          </div>
        </div>
      </form>

      {/* ADD NEW ADDRESS MODAL IN CHECKOUT */}
      {isAddressModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddressModalOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-[#1A1410] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-[#2C211A] p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 tracking-wider">
                  Checkout Delivery
                </span>
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA] mt-0.5">
                  Add Delivery Address
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Save this address to your account for faster doorstep deliveries.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#251D18] hover:bg-neutral-200 dark:hover:bg-[#33261D] text-neutral-500 dark:text-neutral-400 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAddressInCheckout} className="space-y-4 text-xs">
              {/* 1. Address Type Selector */}
              <div>
                <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-2">
                  Address Type *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['HOME', 'OFFICE', 'OTHER'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setAddrType(type)}
                      className={`p-2.5 rounded-xl border font-semibold flex items-center justify-center gap-1.5 transition text-xs ${
                        addrType === type
                          ? 'bg-[#1E1611] dark:bg-rose-950 text-white border-[#1E1611] dark:border-rose-900 shadow-xs'
                          : 'bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-[#382B21] hover:border-neutral-300'
                      }`}
                    >
                      {type === 'HOME' && <Home className="w-3.5 h-3.5" />}
                      {type === 'OFFICE' && <Building2 className="w-3.5 h-3.5" />}
                      {type === 'OTHER' && <MapPin className="w-3.5 h-3.5" />}
                      <span>{type}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                    Contact / Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrRecipient}
                    onChange={(e) => setAddrRecipient(e.target.value)}
                    placeholder="e.g., Priya Sharma"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                    Contact Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={addrPhone}
                    onChange={(e) => setAddrPhone(e.target.value)}
                    placeholder="e.g., +91 9876543210"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* 3. Address Line 1 */}
              <div>
                <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                  Flat, House No., Building, Street *
                </label>
                <input
                  type="text"
                  required
                  value={addrLine1}
                  onChange={(e) => setAddrLine1(e.target.value)}
                  placeholder="e.g., Flat 402, Lotus Residency, 12th Main Road"
                  className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              {/* 4. Address Line 2 & Landmark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                    Area, Colony, Sector (Optional)
                  </label>
                  <input
                    type="text"
                    value={addrLine2}
                    onChange={(e) => setAddrLine2(e.target.value)}
                    placeholder="e.g., Indiranagar"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={addrLandmark}
                    onChange={(e) => setAddrLandmark(e.target.value)}
                    placeholder="e.g., Near Defence Colony Club"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              {/* 5. City, State, Pincode */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={(e) => setAddrCity(e.target.value)}
                    placeholder="Bengaluru"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    placeholder="Karnataka"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={addrPincode}
                    onChange={(e) => setAddrPincode(e.target.value)}
                    placeholder="560038"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-neutral-900 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                  />
                </div>
              </div>

              {/* 6. Default Checkbox */}
              {user && (
                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    className="rounded border-neutral-300 text-rose-700 focus:ring-rose-500 w-4 h-4"
                  />
                  <span className="text-xs text-neutral-700 dark:text-neutral-300">
                    Set as default delivery address for future orders
                  </span>
                </label>
              )}

              {addrError && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2.5 rounded-xl border border-red-200 dark:border-red-800">
                  {addrError}
                </p>
              )}

              {/* Submit / Cancel Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-[#2C211A]">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-full border border-neutral-300 dark:border-[#382B21] text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#251D18] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addrSaving}
                  className="px-6 py-2 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 dark:hover:bg-rose-800 transition-all shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {addrSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Deliver to This Address</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RAZORPAY MOCK / TEST CHECKOUT MODAL */}
      {mockModalOpen && mockOrderDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => !simulatingPayment && setMockModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden my-auto z-10">
            {/* Modal Header with Razorpay Styling */}
            <div className="bg-[#0B1E40] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-sm">Razorpay Checkout</h4>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded border border-amber-400/30">
                      Sandbox Test Mode
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200">
                    {mockOrderDetails.companyName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={simulatingPayment}
                onClick={() => setMockModalOpen(false)}
                className="text-white/60 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Price Banner */}
            <div className="bg-[#FAF9F6] px-6 py-3 border-b border-neutral-200 flex justify-between items-center text-xs">
              <span className="text-neutral-500 font-mono">Order: {mockOrderDetails.orderId}</span>
              <span className="font-bold text-base text-neutral-900">
                ₹{totalAmount.toLocaleString()}
              </span>
            </div>

            {/* Channel Tabs */}
            <div className="p-6 space-y-5">
              <div className="flex border-b border-neutral-200 text-xs">
                <button
                  type="button"
                  onClick={() => setMockPaymentChannel('upi')}
                  className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold transition border-b-2 -mb-px ${
                    mockPaymentChannel === 'upi'
                      ? 'border-[#0B1E40] text-[#0B1E40]'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMockPaymentChannel('card')}
                  className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold transition border-b-2 -mb-px ${
                    mockPaymentChannel === 'card'
                      ? 'border-[#0B1E40] text-[#0B1E40]'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Cards</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMockPaymentChannel('netbanking')}
                  className={`flex items-center gap-1.5 pb-2.5 px-3 font-semibold transition border-b-2 -mb-px ${
                    mockPaymentChannel === 'netbanking'
                      ? 'border-[#0B1E40] text-[#0B1E40]'
                      : 'border-transparent text-neutral-400 hover:text-neutral-700'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>NetBanking</span>
                </button>
              </div>

              {/* Tab Contents */}
              {mockPaymentChannel === 'upi' && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-center space-y-2">
                    <div className="w-24 h-24 mx-auto bg-white p-2 rounded-xl border border-neutral-300 flex items-center justify-center shadow-inner">
                      <QrCode className="w-20 h-20 text-neutral-800" />
                    </div>
                    <p className="text-xs font-semibold text-neutral-800">Scan & Pay with Any UPI App</p>
                    <p className="text-[11px] text-neutral-500">Google Pay • PhonePe • Paytm • CRED • BHIM</p>
                  </div>
                </div>
              )}

              {mockPaymentChannel === 'card' && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 text-white space-y-3 shadow-lg">
                  <div className="flex justify-between items-center text-xs opacity-70">
                    <span>Razorpay Sandbox Card</span>
                    <span className="font-bold">VISA / RuPay</span>
                  </div>
                  <div className="font-mono text-base tracking-widest py-2">
                    4111 •••• •••• 1111
                  </div>
                  <div className="flex justify-between items-center text-[11px] opacity-80">
                    <span>HOLDER: {formData.customerName.toUpperCase()}</span>
                    <span>EXP: 12/28</span>
                  </div>
                </div>
              )}

              {mockPaymentChannel === 'netbanking' && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((bank) => (
                    <div key={bank} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-800 font-semibold text-center hover:bg-neutral-100 transition">
                      {bank}
                    </div>
                  ))}
                </div>
              )}

              {/* Test Action Controls */}
              <div className="space-y-2 pt-2 border-t border-neutral-100">
                <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider text-center">
                  Select Simulation Outcome:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={simulatingPayment}
                    onClick={() => handleSimulatePayment(true)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                  >
                    {simulatingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    <span>Simulate Success (Pay)</span>
                  </button>

                  <button
                    type="button"
                    disabled={simulatingPayment}
                    onClick={() => handleSimulatePayment(false)}
                    className="w-full py-3 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Simulate Decline / Fail</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF9F6] px-6 py-3 border-t border-neutral-200 text-center text-[11px] text-neutral-400 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Razorpay Sandbox Simulation • Cryptographic HMAC verification enabled</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
