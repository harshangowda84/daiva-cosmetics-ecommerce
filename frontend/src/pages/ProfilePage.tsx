import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Package,
  MapPin,
  LogOut,
  Truck,
  ExternalLink,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  ShoppingCart,
  Home,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Box,
  Star,
  Camera,
  X,
  AlertTriangle,
  ShieldCheck,
  Heart,
  Building2,
  Plus,
  Trash2,
  Edit3,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { CustomerOrder, ShipmentTracking, ProductReview, OrderItem, UserAddress } from '../types';
import { api } from '../services/api';
import { profanityService } from '../services/profanityService';
import { getFullImageUrl, handleImageError } from '../utils/image';

interface ProfilePageProps {
  onNavigate: (page: string, param?: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, logout, updateUser, refreshUser } = useAuth();
  const { totalWishlistCount, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline Tracking Dropdown State
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderDropdownTab, setOrderDropdownTab] = useState<Record<number, 'tracking' | 'reviews' | null>>({});
  const [trackingMap, setTrackingMap] = useState<Record<number, ShipmentTracking>>({});
  const [loadingTrackingMap, setLoadingTrackingMap] = useState<Record<number, boolean>>({});

  const toggleOrderCard = (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      setOrderDropdownTab((prev) => ({ ...prev, [orderId]: null }));
    } else {
      setExpandedOrderId(orderId);
      setOrderDropdownTab((prev) => ({ ...prev, [orderId]: prev[orderId] || null }));
    }
  };

  const toggleOrderSubDropdown = async (order: CustomerOrder, tab: 'tracking' | 'reviews') => {
    setExpandedOrderId(order.id);
    const currentTab = orderDropdownTab[order.id];
    const nextTab = currentTab === tab ? null : tab;
    setOrderDropdownTab((prev) => ({ ...prev, [order.id]: nextTab }));

    if (nextTab === 'tracking' && !trackingMap[order.id]) {
      setLoadingTrackingMap((prev) => ({ ...prev, [order.id]: true }));
      try {
        const data = await api.trackOrderShipment(order.id);
        setTrackingMap((prev) => ({ ...prev, [order.id]: data }));
      } catch (e) {
        console.error('Failed to fetch tracking data', e);
      } finally {
        setLoadingTrackingMap((prev) => ({ ...prev, [order.id]: false }));
      }
    }
  };

  const refreshTracking = async (orderId: number) => {
    setLoadingTrackingMap((prev) => ({ ...prev, [orderId]: true }));
    try {
      const data = await api.trackOrderShipment(orderId);
      setTrackingMap((prev) => ({ ...prev, [orderId]: data }));
    } catch (e) {
      console.error('Failed to refresh tracking data', e);
    } finally {
      setLoadingTrackingMap((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Determine which stage (0 to 3) the order is in:
  // 0: Confirmation, 1: Fulfillment, 2: Transit, 3: Delivery
  const getStageIndex = (order: CustomerOrder, tracking?: ShipmentTracking | null): number => {
    const status = (tracking?.currentStatus || order.courierStatus || order.orderStatus || '').toUpperCase();
    if (status.includes('DELIVERED')) return 3;
    if (
      status.includes('TRANSIT') ||
      status.includes('OUT_FOR_DELIVERY') ||
      status.includes('PICKED_UP') ||
      status.includes('DISPATCHED') ||
      status.includes('SHIPPED')
    ) {
      return 2;
    }
    if (status.includes('MANIFEST') || status.includes('PACK') || status.includes('PROCESSING') || order.awbNumber) {
      return 1;
    }
    return 0; // Confirmation
  };

  // Truck position along the route (%)
  const getTruckPosition = (stageIdx: number): string => {
    switch (stageIdx) {
      case 0:
        return '12%';
      case 1:
        return '38%';
      case 2:
        return '65%';
      case 3:
        return '92%';
      default:
        return '12%';
    }
  };

  // User Reviews & Order History Review Modal state
  const [userReviewsMap, setUserReviewsMap] = useState<Record<number, ProductReview>>({});
  const [reviewingItem, setReviewingItem] = useState<{ item: OrderItem; order: CustomerOrder } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState<number | null>(null);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploadingReviewPhoto, setUploadingReviewPhoto] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccessMessage, setReviewSuccessMessage] = useState('');

  // Real-time client-side profanity check for the review modal
  const profanityCheck = React.useMemo(() => {
    return profanityService.detectProfanity(`${reviewTitle} ${reviewComment}`);
  }, [reviewTitle, reviewComment]);

  const handleOpenWriteReview = (item: OrderItem, order: CustomerOrder) => {
    setReviewingItem({ item, order });
    setReviewRating(0);
    setReviewHoverRating(null);
    setReviewTitle('');
    setReviewComment('');
    setReviewImages([]);
    setReviewError('');
    setReviewSuccessMessage('');
  };

  const handleCloseWriteReview = () => {
    setReviewingItem(null);
    setReviewError('');
    setReviewSuccessMessage('');
  };

  const handleUploadReviewPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (reviewImages.length >= 4) {
      setReviewError('You can attach up to 4 customer photos.');
      return;
    }
    try {
      setUploadingReviewPhoto(true);
      setReviewError('');
      const res = await api.uploadReviewImage(file);
      setReviewImages((prev) => [...prev, res.imageUrl]);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to upload photo');
    } finally {
      setUploadingReviewPhoto(false);
    }
  };

  const handleSubmitItemReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingItem || !user) return;

    if (!reviewRating || reviewRating < 1) {
      setReviewError('Please select a star rating (1 to 5 stars) before submitting.');
      return;
    }

    if (profanityCheck.hasProfanity) {
      setReviewError(`Please remove abusive or inappropriate words (${profanityCheck.detectedWords.join(', ')}) before publishing.`);
      return;
    }

    if (profanityService.countWords(reviewComment) > 120) {
      setReviewError('Review comment exceeds the 120-word maximum limit.');
      return;
    }

    try {
      setSubmittingReview(true);
      setReviewError('');
      const createdReview = await api.submitReview({
        productId: reviewingItem.item.productId,
        userId: user.id,
        reviewerName: user.fullName || 'Verified Customer',
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
        imageUrls: reviewImages,
      });

      // Update userReviewsMap so item reflects reviewed state
      setUserReviewsMap((prev) => ({
        ...prev,
        [reviewingItem.item.productId]: createdReview,
      }));

      setReviewSuccessMessage(`Thank you! Your verified review for "${reviewingItem.item.productName}" has been published.`);
      setTimeout(() => {
        handleCloseWriteReview();
      }, 1500);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Multiple Addresses Management State
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
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

  const fetchAddresses = async () => {
    if (!user?.id) return;
    try {
      setLoadingAddresses(true);
      const data = await api.getUserAddresses(user.id);
      setAddresses(data);
    } catch (e) {
      console.error('Failed to load user addresses', e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    if (!user) {
      onNavigate('login');
      return;
    }

    const fetchOrdersAndReviews = async () => {
      try {
        setLoading(true);
        const [ordersData, userReviews] = await Promise.all([
          api.getUserOrders(user.id),
          api.getUserReviews(user.id).catch(() => []),
        ]);
        setOrders(ordersData);

        const revMap: Record<number, ProductReview> = {};
        for (const r of userReviews) {
          revMap[r.productId] = r;
        }
        setUserReviewsMap(revMap);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrdersAndReviews();
    fetchAddresses();
  }, [user]);

  if (!user) return null;

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddrType('HOME');
    setAddrRecipient(user.fullName || '');
    setAddrPhone(user.phone || '');
    setAddrLine1('');
    setAddrLine2('');
    setAddrLandmark('');
    setAddrCity('Bengaluru');
    setAddrState('Karnataka');
    setAddrPincode('');
    setAddrIsDefault(addresses.length === 0);
    setAddrError('');
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: UserAddress) => {
    setEditingAddressId(addr.id);
    setAddrType(addr.addressType);
    setAddrRecipient(addr.recipientName);
    setAddrPhone(addr.phone);
    setAddrLine1(addr.addressLine1);
    setAddrLine2(addr.addressLine2 || '');
    setAddrLandmark(addr.landmark || '');
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPincode(addr.pincode);
    setAddrIsDefault(addr.isDefault);
    setAddrError('');
    setIsAddressModalOpen(true);
  };

  const handleSaveAddressModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
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
      const payload: Partial<UserAddress> = {
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
      };

      if (editingAddressId) {
        await api.updateUserAddress(user.id, editingAddressId, payload);
      } else {
        await api.createUserAddress(user.id, payload);
      }

      await fetchAddresses();
      if (refreshUser) await refreshUser();
      setIsAddressModalOpen(false);
    } catch (err: any) {
      setAddrError(err.message || 'Failed to save address');
    } finally {
      setAddrSaving(false);
    }
  };

  const handleSetDefaultAddress = async (addressId: number) => {
    if (!user?.id) return;
    try {
      await api.setDefaultUserAddress(user.id, addressId);
      await fetchAddresses();
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      console.error('Failed to set default address', err);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!user?.id) return;
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      await api.deleteUserAddress(user.id, addressId);
      await fetchAddresses();
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      console.error('Failed to delete address', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-neutral-200 dark:border-[#2C211A]">
        <div>
          <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold">Customer Portal</span>
          <h1 className="font-serif text-3xl text-neutral-900 dark:text-[#EDE4DA] mt-1">Hello, {user.fullName}</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {user.email} • {user.role === 'ADMIN' ? 'Store Administrator' : 'Beauty VIP Member'}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              logout();
              onNavigate('home');
            }}
            className="px-4 py-2 rounded-full border border-neutral-300 dark:border-[#382B21] text-xs font-semibold text-neutral-700 dark:text-[#EDE4DA] hover:bg-neutral-100 dark:hover:bg-[#251D18] flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Account & Saved Address (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1A1410] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] shadow-sm space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">Personal Info</h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">Account details</p>
              </div>
            </div>

            <div className="text-xs space-y-2 text-neutral-600 dark:text-neutral-300">
              <p>
                <strong className="text-neutral-800 dark:text-[#EDE4DA]">Name:</strong> {user.fullName}
              </p>
              <p>
                <strong className="text-neutral-800 dark:text-[#EDE4DA]">Email:</strong> {user.email}
              </p>
              <p>
                <strong className="text-neutral-800 dark:text-[#EDE4DA]">Phone:</strong> {user.phone || 'Not added'}
              </p>
            </div>
          </div>

          {/* Multiple Delivery Addresses Card */}
          <div className="bg-white dark:bg-[#1A1410] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-700 dark:text-rose-400" />
                <h3 className="font-serif text-base font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                  Saved Addresses ({addresses.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={handleOpenAddAddress}
                className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New</span>
              </button>
            </div>

            {loadingAddresses ? (
              <div className="py-6 flex flex-col items-center justify-center gap-2 text-neutral-400">
                <Loader2 className="w-5 h-5 animate-spin text-rose-700 dark:text-rose-400" />
                <span className="text-xs">Loading addresses...</span>
              </div>
            ) : addresses.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-neutral-50/70 dark:bg-[#231A14] rounded-2xl border border-dashed border-neutral-200 dark:border-[#2C211A] p-5">
                <MapPin className="w-8 h-8 text-neutral-300 dark:text-neutral-600 mx-auto" />
                <div>
                  <p className="text-xs font-semibold text-neutral-800 dark:text-[#EDE4DA]">No addresses saved yet</p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    Add your Home and Office addresses for 1-click checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenAddAddress}
                  className="px-4 py-2 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 dark:hover:bg-rose-800 transition"
                >
                  + Add First Address
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-4 rounded-2xl border transition-all text-xs space-y-2 relative ${
                      addr.isDefault
                        ? 'bg-rose-50/30 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 shadow-2xs'
                        : 'bg-white dark:bg-[#231A14] border-neutral-200 dark:border-[#2C211A] hover:border-neutral-300'
                    }`}
                  >
                    {/* Header: Type, Default Badge & Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] tracking-wider uppercase ${
                            addr.addressType === 'HOME'
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                              : addr.addressType === 'OFFICE'
                              ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                              : 'bg-neutral-100 dark:bg-[#33261D] text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700'
                          }`}
                        >
                          {addr.addressType === 'HOME' && <Home className="w-3 h-3" />}
                          {addr.addressType === 'OFFICE' && <Building2 className="w-3 h-3" />}
                          {addr.addressType === 'OTHER' && <MapPin className="w-3 h-3" />}
                          <span>{addr.addressType}</span>
                        </span>

                        {addr.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] border border-emerald-200 dark:border-emerald-800/50">
                            <Check className="w-2.5 h-2.5" />
                            <span>DEFAULT</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditAddress(addr)}
                          title="Edit address"
                          className="w-7 h-7 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#33261D] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-[#EDE4DA] flex items-center justify-center transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          title="Delete address"
                          className="w-7 h-7 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Recipient & Phone */}
                    <div className="pt-0.5">
                      <span className="font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                        {addr.recipientName}
                      </span>
                      <span className="text-neutral-400 dark:text-neutral-500 font-mono text-[11px] ml-2">
                        {addr.phone}
                      </span>
                    </div>

                    {/* Formatted Address */}
                    <div className="text-[11px] text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      <p>{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      {addr.landmark && (
                        <p className="text-neutral-400 dark:text-neutral-500 italic">Landmark: {addr.landmark}</p>
                      )}
                      <p className="font-medium text-neutral-800 dark:text-[#EDE4DA] mt-0.5">
                        {addr.city}, {addr.state} - {addr.pincode}
                      </p>
                    </div>

                    {/* Footer: Set Default Button */}
                    {!addr.isDefault && (
                      <div className="pt-1 border-t border-neutral-100 dark:border-[#2C211A] flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAddress(addr.id)}
                          className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition hover:underline"
                        >
                          Set as Default Address
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Wishlist Box */}
          <div
            onClick={() => onNavigate('wishlist')}
            className="bg-white dark:bg-[#1A1410] rounded-2xl p-5 border border-neutral-200 dark:border-[#2C211A] shadow-2xs hover:border-rose-300 dark:hover:border-rose-800/60 hover:shadow-md transition cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                <Heart className="w-5 h-5 fill-rose-500/20 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h4 className="font-semibold text-xs text-neutral-900 dark:text-[#EDE4DA] group-hover:text-rose-700 dark:group-hover:text-rose-400 transition">
                  My Saved Wishlist
                </h4>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {totalWishlistCount} item{totalWishlistCount === 1 ? '' : 's'} saved
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
              <span>View</span>
              <span>→</span>
            </span>
          </div>

        </div>

        {/* Right: Past Orders & Tracking (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#2C211A]">
            <div className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400">
              <Package className="w-4 h-4" />
              <span>Order History ({orders.length})</span>
            </div>
          </div>

          <div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white dark:bg-[#1A1410] rounded-2xl h-36 animate-pulse border border-neutral-100 dark:border-[#2C211A]" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white dark:bg-[#1A1410] rounded-3xl p-12 text-center border border-neutral-200 dark:border-[#2C211A] space-y-3">
              <Package className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto" />
              <p className="font-serif text-lg text-neutral-700 dark:text-neutral-300">No orders placed yet</p>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Your placed orders will show here along with live shipment and tracking journey details.
              </p>
              <button
                onClick={() => onNavigate('plp', 'All')}
                className="mt-2 px-6 py-2.5 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white text-xs font-semibold hover:bg-rose-700 dark:hover:bg-rose-800 transition"
              >
                Browse Cosmetics Catalog
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const isExpanded = expandedOrderId === order.id;
                const activeTab = orderDropdownTab[order.id];
                const tracking = trackingMap[order.id];
                const isTrackingLoading = !!loadingTrackingMap[order.id];
                const currentStage = getStageIndex(order, tracking);
                const truckLeft = getTruckPosition(currentStage);

                const itemsSummary = order.items.map((i) => i.productName).join(', ');
                const unreviewedCount = order.items.filter((i) => !userReviewsMap[i.productId]).length;

                return (
                  <div
                    key={order.id}
                    className="bg-white dark:bg-[#1A1410] rounded-2xl border border-neutral-200 dark:border-[#2C211A] shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* SLEEK SINGLE CARD COLLAPSED VIEW (Tap to expand) */}
                    <div
                      onClick={() => toggleOrderCard(order.id)}
                      className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/70 dark:hover:bg-[#251D18]/50 transition select-none"
                    >
                      {/* Left: Icon & Order Essentials */}
                      <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
                          <Package className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                        </div>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-neutral-900 dark:text-[#EDE4DA] tracking-tight">
                              {order.orderNumber}
                            </span>
                            {order.awbNumber && (
                              <span className="text-[10px] font-mono bg-neutral-100 dark:bg-[#251D18] text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded border border-neutral-200 dark:border-[#382B21]">
                                AWB: {order.awbNumber}
                              </span>
                            )}
                            <span className="text-[11px] text-neutral-300 dark:text-neutral-600">•</span>
                            <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              Placed on{' '}
                              {new Date(order.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                          </div>

                          {/* Compact Items One-Liner */}
                          {(() => {
                            const distinctCount = order.items.length;
                            const totalUnitsCount = order.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
                            return (
                              <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate max-w-xl">
                                <strong className="text-neutral-900 dark:text-[#EDE4DA]">
                                  {distinctCount} Product{distinctCount > 1 ? 's' : ''} ({totalUnitsCount} Unit{totalUnitsCount > 1 ? 's' : ''}):
                                </strong>{' '}
                                {itemsSummary}
                              </p>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Right: Status Pills, Total & Expand Arrow */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-neutral-100 dark:border-[#2C211A]">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            {order.orderStatus}
                          </span>
                          {order.paymentStatus === 'PAID' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                              PAID
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          <span className="font-serif text-sm sm:text-base font-bold text-neutral-900 dark:text-[#EDE4DA]">
                            ₹{order.totalAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#251D18] hover:bg-neutral-200 dark:hover:bg-[#33261D] flex items-center justify-center text-neutral-500 dark:text-neutral-400 transition-transform">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED CONTENT WHEN TAPPED */}
                    {isExpanded && (
                      <div className="p-4 sm:p-6 border-t border-neutral-100 dark:border-[#2C211A] bg-[#FCFBF9]/60 dark:bg-[#140F0D]/60 space-y-4 animate-in fade-in duration-200">
                        {/* Two Primary Action Dropdowns: Tracking & Review */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* BUTTON 1: Tapping tracking will dropdown tracking */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOrderSubDropdown(order, 'tracking');
                            }}
                            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all shadow-2xs ${
                              activeTab === 'tracking'
                                ? 'bg-[#1E1611] dark:bg-rose-950/80 text-white border-[#1E1611] dark:border-rose-900 shadow-sm'
                                : 'bg-white dark:bg-[#1A1410] hover:bg-neutral-50 dark:hover:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] border-neutral-200 dark:border-[#2C211A]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 text-left">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  activeTab === 'tracking'
                                    ? 'bg-white/20 text-white'
                                    : 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-400'
                                }`}
                              >
                                <Truck className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="block font-bold">Delivery Tracking</span>
                                <span
                                  className={`text-[10px] font-normal ${
                                    activeTab === 'tracking' ? 'text-amber-200 dark:text-amber-300' : 'text-neutral-500 dark:text-neutral-400'
                                  }`}
                                >
                                  {order.awbNumber
                                    ? `Xpressbees • ${order.courierStatus || 'In Transit'}`
                                    : 'Hub Manifested'}
                                </span>
                              </div>
                            </div>
                            {activeTab === 'tracking' ? (
                              <ChevronUp className="w-4 h-4 opacity-80" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                            )}
                          </button>

                          {/* BUTTON 2: Tapping review will dropdown actual review */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleOrderSubDropdown(order, 'reviews');
                            }}
                            className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all shadow-2xs ${
                              activeTab === 'reviews'
                                ? 'bg-[#1E1611] dark:bg-rose-950/80 text-white border-[#1E1611] dark:border-rose-900 shadow-sm'
                                : 'bg-white dark:bg-[#1A1410] hover:bg-neutral-50 dark:hover:bg-[#251D18] text-neutral-800 dark:text-[#EDE4DA] border-neutral-200 dark:border-[#2C211A]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 text-left">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  activeTab === 'reviews'
                                    ? 'bg-white/20 text-amber-300'
                                    : 'bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400'
                                }`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </div>
                              <div>
                                <span className="block font-bold">
                                  Product Reviews ({order.items.length})
                                </span>
                                <span
                                  className={`text-[10px] font-normal ${
                                    activeTab === 'reviews' ? 'text-rose-200 dark:text-rose-300' : 'text-neutral-500 dark:text-neutral-400'
                                  }`}
                                >
                                  {unreviewedCount > 0
                                    ? `${unreviewedCount} item${unreviewedCount > 1 ? 's' : ''} to review`
                                    : 'All items reviewed ★'}
                                </span>
                              </div>
                            </div>
                            {activeTab === 'reviews' ? (
                              <ChevronUp className="w-4 h-4 opacity-80" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                            )}
                          </button>
                        </div>

                        {/* DROPDOWN 1: FLUID ANIMATED ORDER TRACKING JOURNEY */}
                        {activeTab === 'tracking' && (
                          <div className="pt-2 animate-in fade-in duration-200">
                            <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-5 border border-neutral-200/90 dark:border-[#2C211A] shadow-sm space-y-6">
                              {/* Dropdown Header */}
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA]">
                                      Order Tracking Journey
                                    </h3>
                                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 animate-ping" />
                                      {tracking?.currentStatus || order.courierStatus || 'Processing'}
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Xpressbees Air Express •{' '}
                                    {order.awbNumber ? `AWB #${order.awbNumber}` : 'Tracking active'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  {order.awbNumber && (
                                    <a
                                      href={
                                        tracking?.trackingUrl ||
                                        `https://shipmentv2.xpressbees.com/orders/tracking/${order.awbNumber}`
                                      }
                                      target="_blank"
                                      rel="noreferrer"
                                      className="px-3 py-1 rounded-full bg-white dark:bg-[#251D18] border border-neutral-200 dark:border-[#382B21] text-neutral-700 dark:text-[#EDE4DA] text-[11px] font-semibold hover:bg-neutral-50 dark:hover:bg-[#33261D] flex items-center gap-1 shadow-2xs transition"
                                    >
                                      <span>Official Portal</span>
                                      <ExternalLink className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                                    </a>
                                  )}
                                  <button
                                    onClick={() => refreshTracking(order.id)}
                                    disabled={isTrackingLoading}
                                    title="Refresh live courier status"
                                    className="p-1.5 rounded-full bg-white dark:bg-[#251D18] border border-neutral-200 dark:border-[#382B21] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-[#EDE4DA] hover:bg-neutral-50 dark:hover:bg-[#33261D] transition shadow-2xs disabled:opacity-50"
                                  >
                                    <RefreshCw
                                      className={`w-3.5 h-3.5 ${
                                        isTrackingLoading ? 'animate-spin text-amber-600 dark:text-amber-400' : ''
                                      }`}
                                    />
                                  </button>
                                </div>
                              </div>

                              {/* Centered Order Code Pill (Inspired by Reference Design) */}
                              <div className="text-center pt-1">
                                <div className="inline-block bg-neutral-100 dark:bg-[#251D18] border border-neutral-200 dark:border-[#382B21] text-neutral-800 dark:text-[#EDE4DA] font-mono font-bold text-xs px-6 py-1.5 rounded-lg shadow-2xs">
                                  {order.orderNumber}
                                </div>
                              </div>

                              {/* Estimated Delivery Notice if available */}
                              {tracking?.expectedDelivery && (
                                <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300">
                                    <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                                    <span className="font-medium">Estimated Doorstep Delivery:</span>
                                  </div>
                                  <span className="font-bold text-amber-900 dark:text-amber-200 font-mono text-sm">
                                    {tracking.expectedDelivery}
                                  </span>
                                </div>
                              )}

                              {/* ANIMATED FLUID JOURNEY PIPELINE */}
                              <div className="pt-8 pb-4 px-2 sm:px-6 relative select-none">
                                {/* Connecting Progress Line & Nodes (Reference Design Style) */}
                                <div className="relative">
                                  {/* Progress Line */}
                                  <div className="absolute top-3.5 left-[12%] right-[12%] h-1 bg-neutral-200 dark:bg-[#2C211A] rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 transition-all duration-1000 ease-out"
                                      style={{
                                        width:
                                          currentStage === 0
                                            ? '0%'
                                            : currentStage === 1
                                            ? '35%'
                                            : currentStage === 2
                                            ? '70%'
                                            : '100%',
                                      }}
                                    />
                                  </div>

                                  {/* Line Checkmark Indicator Nodes */}
                                  <div className="grid grid-cols-4 relative z-10">
                                    {[0, 1, 2, 3].map((idx) => {
                                      const isPassed = currentStage > idx;
                                      const isCurrent = currentStage === idx;
                                      return (
                                        <div key={idx} className="flex justify-center">
                                          <div
                                            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 text-xs font-bold ${
                                              isPassed
                                                ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100 dark:ring-emerald-950/60'
                                                : isCurrent
                                                ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 dark:ring-emerald-900/60 animate-pulse'
                                                : 'bg-white dark:bg-[#1A1410] border-2 border-neutral-300 dark:border-[#3D2C20] text-neutral-300 dark:text-neutral-600'
                                            }`}
                                          >
                                            {isPassed || isCurrent ? (
                                              <Check className="w-4 h-4" />
                                            ) : (
                                              <span className="w-2 h-2 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* FLUID ANIMATED MOVING TRUCK */}
                                <div
                                  className="absolute top-0 transition-all duration-1000 ease-out -translate-x-1/2 pointer-events-none z-20 flex flex-col items-center"
                                  style={{ left: truckLeft }}
                                >
                                  <div className="relative animate-truck-bounce">
                                    <div className="absolute -left-4 top-2 flex flex-col gap-1 animate-speed-wind pointer-events-none">
                                      <span className="w-3 h-0.5 bg-amber-500 rounded-full" />
                                      <span className="w-2 h-0.5 bg-emerald-500 rounded-full" />
                                      <span className="w-3.5 h-0.5 bg-amber-400 rounded-full" />
                                    </div>

                                    <div className="relative bg-[#1E1611] text-white px-2.5 py-1 rounded-xl shadow-lg border border-neutral-700 flex items-center gap-1.5">
                                      <Truck className="w-4 h-4 text-amber-400" />
                                      <span className="text-[9px] font-mono font-bold tracking-tight text-amber-300">
                                        {currentStage === 3 ? 'DELIVERED' : 'IN MOTION'}
                                      </span>
                                    </div>

                                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mx-auto mt-0.5 animate-ping" />
                                  </div>
                                </div>

                                {/* 4 STAGES / MILESTONE CARDS (Reference Design Matching) */}
                                <div className="grid grid-cols-4 mt-6 gap-2 text-center relative z-10">
                                  {/* 1. Confirmation */}
                                  <div className="flex flex-col items-center group">
                                    <div
                                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                        currentStage >= 0
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                          : 'bg-neutral-100 dark:bg-[#251D18] text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-[#382B21]'
                                      }`}
                                    >
                                      <ShoppingCart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <p className="mt-2.5 text-xs font-bold text-neutral-900 dark:text-[#EDE4DA]">Confirmation</p>
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">Order Confirmed</p>
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                                      {new Date(order.createdAt).toLocaleDateString(undefined, {
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </span>
                                  </div>

                                  {/* 2. Fulfillment */}
                                  <div className="flex flex-col items-center group">
                                    <div
                                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                        currentStage >= 1
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                          : 'bg-neutral-100 dark:bg-[#251D18] text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-[#382B21]'
                                      }`}
                                    >
                                      <Box className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                                    </div>
                                    <p className="mt-2.5 text-xs font-bold text-neutral-900 dark:text-[#EDE4DA]">Fulfillment</p>
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                      {currentStage >= 1 ? 'Packed & Processed' : 'Packing at Hub'}
                                    </p>
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                                      {order.awbNumber ? 'Hub Ready' : 'In Queue'}
                                    </span>
                                  </div>

                                  {/* 3. Transit */}
                                  <div className="flex flex-col items-center group">
                                    <div
                                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                        currentStage >= 2
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                          : 'bg-neutral-100 dark:bg-[#251D18] text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-[#382B21]'
                                      }`}
                                    >
                                      <Truck className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                                    </div>
                                    <p className="mt-2.5 text-xs font-bold text-neutral-900 dark:text-[#EDE4DA]">Transit</p>
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                      {currentStage >= 2 ? 'In Air Transit' : 'Carrier Handover'}
                                    </p>
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                                      Xpressbees Network
                                    </span>
                                  </div>

                                  {/* 4. Delivery */}
                                  <div className="flex flex-col items-center group">
                                    <div
                                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                                        currentStage === 3
                                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                          : 'bg-neutral-100 dark:bg-[#251D18] text-neutral-400 dark:text-neutral-500 border border-neutral-200 dark:border-[#382B21]'
                                      }`}
                                    >
                                      <Home className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                                    </div>
                                    <p className="mt-2.5 text-xs font-bold text-neutral-900 dark:text-[#EDE4DA]">Delivery</p>
                                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                      {currentStage === 3 ? 'Delivered' : 'Doorstep Dispatch'}
                                    </p>
                                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5">
                                      {tracking?.expectedDelivery || 'Expected soon'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* LIVE COURIER SCAN TIMELINE */}
                              <div className="pt-4 border-t border-neutral-100 dark:border-[#2C211A] space-y-3">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Detailed Hub Milestones
                                  </p>
                                  <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                                    Automated telemetry from Xpressbees Logistics
                                  </span>
                                </div>

                                {isTrackingLoading ? (
                                  <div className="py-6 flex items-center justify-center gap-2 text-neutral-400 dark:text-neutral-500 text-xs">
                                    <Loader2 className="w-4 h-4 animate-spin text-amber-600 dark:text-amber-400" />
                                    <span>Fetching live courier updates...</span>
                                  </div>
                                ) : tracking?.milestones && tracking.milestones.length > 0 ? (
                                  <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-neutral-200 dark:before:bg-[#2C211A] pl-1">
                                    {tracking.milestones.map((m: any, idx: number) => (
                                      <div key={idx} className="relative flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center z-10 shrink-0 shadow-2xs">
                                          <Check className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="bg-neutral-50/80 dark:bg-[#231A14] p-3 rounded-xl border border-neutral-200/80 dark:border-[#2C211A] shadow-2xs flex-1">
                                          <div className="flex flex-wrap items-center justify-between gap-1">
                                            <p className="font-semibold text-neutral-900 dark:text-[#EDE4DA] text-xs">{m.title}</p>
                                            <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500">
                                              {m.time}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                                            <span>{m.location}</span>
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#231A14] border border-neutral-200/60 dark:border-[#2C211A] text-center text-xs text-neutral-500 dark:text-neutral-400">
                                    Shipment manifested and waiting for courier gateway scan.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* DROPDOWN 2: ACTUAL PRODUCT REVIEWS DROPDOWN */}
                        {activeTab === 'reviews' && (
                          <div className="pt-2 animate-in fade-in duration-200 space-y-3">
                            <div className="bg-white dark:bg-[#1A1410] rounded-2xl p-5 border border-neutral-200/90 dark:border-[#2C211A] shadow-sm space-y-4">
                              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
                                <div>
                                  <h4 className="font-serif text-sm font-bold text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span>Rate & Review Purchased Items</span>
                                  </h4>
                                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Share real feedback for products ordered in this delivery.
                                  </p>
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-1 rounded-full">
                                  Verified Order #{order.orderNumber}
                                </span>
                              </div>

                              <div className="space-y-2.5">
                                {order.items.map((item) => {
                                  const existingReview = userReviewsMap[item.productId];
                                  return (
                                    <div
                                      key={item.id}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-50/80 dark:bg-[#231A14] border border-neutral-200/70 dark:border-[#2C211A] hover:border-neutral-300 dark:hover:border-[#3D2C20] transition"
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1A1410] border border-neutral-200 dark:border-[#2C211A] flex items-center justify-center shrink-0 shadow-2xs">
                                          <Package className="w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-xs text-neutral-900 dark:text-[#EDE4DA] leading-snug">
                                            {item.productName}
                                          </p>
                                          <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                                              {item.quantity} {item.quantity > 1 ? 'units' : 'unit'}
                                            </span>
                                            <span className="text-[10px] text-neutral-300 dark:text-neutral-600">•</span>
                                            <span className="text-[11px] font-semibold text-neutral-800 dark:text-[#EDE4DA]">
                                              ₹{item.totalPrice.toLocaleString()}
                                            </span>
                                            {item.sku && (
                                              <>
                                                <span className="text-[10px] text-neutral-300 dark:text-neutral-600">•</span>
                                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                                                  {item.sku}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      {/* Review Action */}
                                      <div className="shrink-0 self-end sm:self-center">
                                        {existingReview ? (
                                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-300 text-xs font-semibold">
                                            <div className="flex items-center text-amber-500">
                                              {[1, 2, 3, 4, 5].map((s) => (
                                                <Star
                                                  key={s}
                                                  className={`w-3 h-3 ${
                                                    s <= existingReview.rating
                                                      ? 'fill-amber-400 text-amber-400'
                                                      : 'text-neutral-200 dark:text-neutral-700'
                                                  }`}
                                                />
                                              ))}
                                            </div>
                                            <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                              Reviewed ({existingReview.rating}★)
                                            </span>
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleOpenWriteReview(item, order)}
                                            className="px-4 py-2 rounded-full bg-[#1E1611] dark:bg-rose-900 text-white hover:bg-rose-700 dark:hover:bg-rose-800 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs group"
                                          >
                                            <Star className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
                                            <span>Write Review</span>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* ORDER FOOTER / SUMMARY DETAILS */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-[#1A1410] border border-neutral-200/80 dark:border-[#2C211A] flex flex-wrap justify-between items-center text-xs gap-3">
                          <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <span>Payment: <strong className="text-neutral-800 dark:text-[#EDE4DA]">{order.paymentMethod}</strong></span>
                            <span className="text-neutral-300 dark:text-neutral-600">•</span>
                            {order.refundStatus === 'REFUNDED' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                                REFUNDED
                              </span>
                            ) : order.paymentStatus === 'PAID' ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                                PAID
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                COD PENDING
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-neutral-500 dark:text-neutral-400">Order Total:</span>
                            <span className="font-serif text-sm font-bold text-neutral-900 dark:text-[#EDE4DA]">
                              ₹{order.totalAmount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </div>
  </div>

      {/* AMAZON-STYLE VERIFIED PRODUCT REVIEW MODAL */}
      {reviewingItem && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={handleCloseWriteReview}
        >
          <div
            className="relative bg-white dark:bg-[#1A1410] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200 dark:border-[#2C211A] p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-[#2C211A]">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 tracking-wider">
                  Verified Purchase Review
                </span>
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA] mt-0.5">
                  Rate & Review Product
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                  Order #{reviewingItem.order.orderNumber}
                </p>
              </div>
              <button
                onClick={handleCloseWriteReview}
                className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-[#251D18] hover:bg-neutral-200 dark:hover:bg-[#33261D] text-neutral-500 dark:text-neutral-400 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Product Summary Card */}
            <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-[#231A14] border border-neutral-200 dark:border-[#2C211A] flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#1A1410] border border-neutral-200 dark:border-[#2C211A] flex items-center justify-center shrink-0">
                <Package className="w-6 h-6 text-neutral-500 dark:text-neutral-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-xs text-neutral-900 dark:text-[#EDE4DA] leading-tight">
                  {reviewingItem.item.productName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border border-transparent dark:border-emerald-800/40">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Verified Order Item
                  </span>
                  {reviewingItem.item.sku && (
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono">
                      {reviewingItem.item.sku}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {reviewSuccessMessage ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="font-serif text-base font-bold text-emerald-950 dark:text-emerald-200">Review Published!</h4>
                <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">{reviewSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitItemReview} className="space-y-4 text-xs">
                {/* 1. Overall Star Rating */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-900 dark:text-[#EDE4DA] block">
                    Overall Product Rating *
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setReviewHoverRating(star)}
                          onMouseLeave={() => setReviewHoverRating(null)}
                          onClick={() => setReviewRating(star)}
                          className="p-1 transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-7 h-7 transition-colors ${
                              (reviewHoverRating || reviewRating) >= star
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-neutral-200 dark:text-neutral-700'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <span className={`text-xs font-bold font-serif ml-2 ${reviewRating === 0 ? 'text-neutral-400 dark:text-neutral-500 italic' : 'text-amber-800 dark:text-amber-400'}`}>
                      {reviewRating === 5
                        ? '5.0 - Excellent, loved it!'
                        : reviewRating === 4
                        ? '4.0 - Very Good'
                        : reviewRating === 3
                        ? '3.0 - Average'
                        : reviewRating === 2
                        ? '2.0 - Below Average'
                        : reviewRating === 1
                        ? '1.0 - Poor'
                        : 'Tap stars above to rate (1 to 5)'}
                    </span>
                  </div>
                </div>

                {/* 2. Review Headline */}
                <div className="space-y-1">
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block">
                    Add a Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g., Amazing hydration, silky texture!"
                    className="w-full p-2.5 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-xs text-neutral-800 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                {/* 3. Detailed Review Comment */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block">
                      Written Review *
                    </label>
                    <span
                      className={`text-[11px] font-mono font-semibold ${
                        profanityService.countWords(reviewComment) > 120
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      {profanityService.countWords(reviewComment)} / 120 words
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="How does this product look and feel? What results did you notice on your skin?"
                    className="w-full p-3 rounded-xl border border-neutral-200 dark:border-[#382B21] bg-[#FAF9F6] dark:bg-[#251D18] text-xs text-neutral-800 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-rose-500 leading-relaxed"
                  />
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    Max 120 words. Please keep your feedback respectful and genuine.
                  </p>
                </div>

                {/* Real-time Client-Side Profanity Warning Alert */}
                {profanityCheck.hasProfanity && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5 shadow-2xs animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-950 dark:text-amber-200">
                        Please help keep our beauty community welcoming
                      </p>
                      <p className="text-[11px] text-amber-850 dark:text-amber-300 leading-relaxed">
                        We noticed language (<span className="font-semibold underline text-red-700 dark:text-red-400">{profanityCheck.detectedWords.map((w) => `"${w}"`).join(', ')}</span>) that violates our review guidelines. Please rephrase or remove these words to enable the submit button.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Customer Photos (Up to 4) */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-800 dark:text-[#EDE4DA] block">
                    Add Photos (Optional, up to 4 photos)
                  </label>
                  <div className="flex flex-wrap gap-2.5 items-center">
                    {reviewImages.map((imgUrl, i) => (
                      <div
                        key={i}
                        className="w-14 h-14 rounded-xl overflow-hidden relative border border-neutral-200 dark:border-[#2C211A] group"
                      >
                        <img
                          src={getFullImageUrl(imgUrl)}
                          alt={`Upload ${i + 1}`}
                          className="w-full h-full object-cover"
                          onError={handleImageError}
                        />
                        <button
                          type="button"
                          onClick={() => setReviewImages((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center opacity-80 hover:opacity-100 transition"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}

                    {reviewImages.length < 4 && (
                      <label className="w-14 h-14 rounded-xl border-2 border-dashed border-neutral-300 dark:border-[#382B21] hover:border-rose-500 bg-[#FAF9F6] dark:bg-[#251D18] flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-rose-700 dark:hover:text-rose-400 cursor-pointer transition">
                        <Camera className="w-4 h-4" />
                        <span className="text-[8px] font-semibold mt-0.5">+ Photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleUploadReviewPhoto}
                          disabled={uploadingReviewPhoto}
                          className="hidden"
                        />
                      </label>
                    )}

                    {uploadingReviewPhoto && (
                      <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700 dark:text-rose-400" />
                        <span>Uploading...</span>
                      </div>
                    )}
                  </div>
                </div>

                {reviewError && (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2.5 rounded-xl border border-red-200 dark:border-red-800">
                    {reviewError}
                  </p>
                )}

                {/* Submit Action Buttons */}
                <div className="flex justify-end gap-2.5 pt-3 border-t border-neutral-100 dark:border-[#2C211A]">
                  <button
                    type="button"
                    onClick={handleCloseWriteReview}
                    className="px-4 py-2 rounded-full border border-neutral-300 dark:border-[#382B21] text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#251D18] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      submittingReview ||
                      profanityCheck.hasProfanity ||
                      !reviewComment.trim() ||
                      profanityService.countWords(reviewComment) > 120
                    }
                    className={`px-6 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                      profanityCheck.hasProfanity
                        ? 'bg-neutral-200 dark:bg-[#251D18] text-neutral-400 dark:text-neutral-600 border border-neutral-300 dark:border-[#382B21] cursor-not-allowed shadow-none'
                        : 'bg-[#1E1611] dark:bg-rose-900 text-white hover:bg-rose-700 dark:hover:bg-rose-800 disabled:opacity-50'
                    }`}
                  >
                    {submittingReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : profanityCheck.hasProfanity ? (
                      <span>Remove Abusive Words to Submit</span>
                    ) : (
                      <span>Submit Verified Review</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      {/* ADD / EDIT ADDRESS MODAL */}
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
                  Address Management
                </span>
                <h3 className="font-serif text-lg font-bold text-neutral-900 dark:text-[#EDE4DA] mt-0.5">
                  {editingAddressId ? 'Edit Delivery Address' : 'Add New Delivery Address'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Save your address for faster doorstep deliveries and accurate courier tracking.
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

            <form onSubmit={handleSaveAddressModal} className="space-y-4 text-xs">
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
                    <span>{editingAddressId ? 'Update Address' : 'Save Address'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
