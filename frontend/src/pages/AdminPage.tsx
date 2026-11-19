import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Database,
  CheckCircle2,
  AlertCircle,
  Package,
  ShoppingCart,
  ShieldCheck,
  Plus,
  Save,
  ExternalLink,
  X,
  Sparkles,
  Info,
  Loader2,
  Image as ImageIcon,
  LogOut,
  Edit3,
  Lock,
  ArrowLeft,
  Eye,
  Check,
  UploadCloud,
  Upload,
  Trash2,
  Star,
  History,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Tag,
  Barcode,
  Search,
  Copy,
  Box,
  Truck,
  Printer,
  RotateCcw,
  EyeOff,
  MessageSquare,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Product, CustomerOrder, ZohoStatus, UploadedImageInfo, StockMovement, ProductBatch, ShipmentTracking, ProductReview, OrderReturnExchange } from '../types';
import { getFullImageUrl, handleImageError } from '../utils/image';
import { XpressBeesSimulatorModal } from '../components/XpressBeesSimulatorModal';
import { AdminFooterPoliciesEditor } from '../components/AdminFooterPoliciesEditor';

interface AdminPageProps {
  onNavigate: (page: string, param?: string) => void;
}

interface ToastState {
  show: boolean;
  type: 'success' | 'error' | 'info' | 'loading';
  message: string;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { user, isAdmin, login, logout } = useAuth();

  // Admin Login form state
  const [adminEmail, setAdminEmail] = useState('admin@daivatech.com');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Dashboard states
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'zoho' | 'ledger' | 'reviews' | 'returns' | 'footer_policies'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [zohoStatus, setZohoStatus] = useState<ZohoStatus | null>(null);

  // Reviews Moderation states (Tab 5)
  const [adminReviews, setAdminReviews] = useState<ProductReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewFilterStatus, setReviewFilterStatus] = useState<'ALL' | 'VISIBLE' | 'HIDDEN'>('ALL');
  const [reviewRatingFilter, setReviewRatingFilter] = useState<number | 'ALL'>('ALL');
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [previewReviewPhoto, setPreviewReviewPhoto] = useState<string | null>(null);
  const [togglingReviewId, setTogglingReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Stock Audit & Ledger states
  const [auditProduct, setAuditProduct] = useState<Product | null>(null);
  const [auditHistory, setAuditHistory] = useState<StockMovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [adjustMode, setAdjustMode] = useState<'add' | 'set'>('add');
  const [adjustQuantity, setAdjustQuantity] = useState<number>(10);
  const [adjustNotes, setAdjustNotes] = useState('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  // Batch states
  const [productBatches, setProductBatches] = useState<ProductBatch[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [batchActionTab, setBatchActionTab] = useState<'newBatch' | 'adjustBatch' | 'quickAdjust'>('newBatch');
  const [newBatchQty, setNewBatchQty] = useState<number>(10);
  const [newBatchCustomId, setNewBatchCustomId] = useState('');
  const [newBatchExpiry, setNewBatchExpiry] = useState('2027-12');
  const [newBatchSupplier, setNewBatchSupplier] = useState('');
  const [newBatchNotes, setNewBatchNotes] = useState('');
  const [submittingNewBatch, setSubmittingNewBatch] = useState(false);

  // Adjust batch fields
  const [selectedBatchNumber, setSelectedBatchNumber] = useState('');
  const [batchAdjustType, setBatchAdjustType] = useState<'DEFECTIVE' | 'CORRECTION' | 'ADD_TO_BATCH'>('DEFECTIVE');
  const [batchAdjustQty, setBatchAdjustQty] = useState<number>(1);
  const [batchAdjustReason, setBatchAdjustReason] = useState('');
  const [submittingBatchAdjust, setSubmittingBatchAdjust] = useState(false);
  const [batchSearchQuery, setBatchSearchQuery] = useState('');

  // Global Ledger state (Tab 4)
  const [globalMovements, setGlobalMovements] = useState<StockMovement[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<string>('ALL');
  const [globalLedgerSearch, setGlobalLedgerSearch] = useState('');

  // Toast state
  const [toast, setToast] = useState<ToastState>({
    show: false,
    type: 'info',
    message: '',
  });

  const showToast = (message: string, type: ToastState['type'], duration = 4000) => {
    setToast({ show: true, type, message });
    if (type !== 'loading') {
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, duration);
    }
  };

  // Stock edit tracking
  const [stockEdits, setStockEdits] = useState<{ [id: number]: number }>({});
  const [savingStockId, setSavingStockId] = useState<number | null>(null);
  const [singleSyncingId, setSingleSyncingId] = useState<number | null>(null);

  // Add Product Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submittingProduct, setSubmittingProduct] = useState(false);
  const [uploadingAddImages, setUploadingAddImages] = useState(false);
  const [uploadingEditImages, setUploadingEditImages] = useState(false);

  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: 'Aura Luxe',
    subCategory: 'Serums & Treatments',
    price: 999,
    originalPrice: 1399,
    discountPercent: 28,
    stockQuantity: 25,
    sku: '',
    volume: '30 ml',
    skinType: 'All Skin Types',
    imageUrl: '',
    galleryImages: '',
    description: '',
    keyIngredients: '',
    howToUse: '',
    isBestSeller: false,
    isFeatured: true,
  });

  const getGalleryArray = (galleryStr?: string, fallbackImg?: string): string[] => {
    if (!galleryStr) return fallbackImg ? [fallbackImg] : [];
    return galleryStr.split(',').map((s) => s.trim()).filter(Boolean);
  };

  const handleUploadForAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploadingAddImages(true);
      showToast(`Uploading and auto-resizing ${files.length} image(s)...`, 'loading');
      const uploaded = await api.uploadProductImages(Array.from(files));

      const currentList = getGalleryArray(newProduct.galleryImages, newProduct.imageUrl);
      // Remove default unsplash placeholder if this is first real upload
      const filtered = currentList.filter((url) => !url.includes('unsplash.com'));
      const newPdpUrls = uploaded.map((u) => u.pdpUrl);
      const combined = [...filtered, ...newPdpUrls];

      // Primary image defaults to first uploaded PLP thumbnail
      const primary = (!newProduct.imageUrl || newProduct.imageUrl.includes('unsplash.com'))
        ? uploaded[0].plpUrl
        : newProduct.imageUrl;

      setNewProduct((prev) => ({
        ...prev,
        imageUrl: primary,
        galleryImages: combined.join(','),
      }));

      showToast(`Uploaded ${uploaded.length} photo(s)! Auto-resized: PLP (600px) & PDP (1200px)`, 'success', 4000);
    } catch (err: any) {
      showToast('Image upload failed: ' + (err.message || 'Error occurred'), 'error');
    } finally {
      setUploadingAddImages(false);
      e.target.value = '';
    }
  };

  const handleUploadForEdit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !editingProduct) return;
    try {
      setUploadingEditImages(true);
      showToast(`Uploading and auto-resizing ${files.length} image(s)...`, 'loading');
      const uploaded = await api.uploadProductImages(Array.from(files));

      const currentList = getGalleryArray(editingProduct.galleryImages, editingProduct.imageUrl);
      const newPdpUrls = uploaded.map((u) => u.pdpUrl);
      const combined = [...currentList, ...newPdpUrls];

      const primary = editingProduct.imageUrl || uploaded[0].plpUrl;

      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              imageUrl: primary,
              galleryImages: combined.join(','),
            }
          : null
      );

      showToast(`Uploaded ${uploaded.length} photo(s)! Auto-resized: PLP (600px) & PDP (1200px)`, 'success', 4000);
    } catch (err: any) {
      showToast('Image upload failed: ' + (err.message || 'Error occurred'), 'error');
    } finally {
      setUploadingEditImages(false);
      e.target.value = '';
    }
  };

  const setAddPrimary = (pdpUrl: string) => {
    const plpUrl = pdpUrl.includes('_pdp.jpg') ? pdpUrl.replace('_pdp.jpg', '_plp.jpg') : pdpUrl;
    setNewProduct((prev) => ({ ...prev, imageUrl: plpUrl }));
  };

  const removeAddImage = (imgUrl: string) => {
    const list = getGalleryArray(newProduct.galleryImages, newProduct.imageUrl);
    const updated = list.filter((item) => item !== imgUrl && item !== imgUrl.replace('_pdp.jpg', '_plp.jpg'));
    const isCurrentPrimary =
      newProduct.imageUrl === imgUrl ||
      newProduct.imageUrl === imgUrl.replace('_pdp.jpg', '_plp.jpg') ||
      newProduct.imageUrl.replace('_plp.jpg', '_pdp.jpg') === imgUrl;
    const newPrimary = isCurrentPrimary
      ? updated[0]
        ? updated[0].includes('_pdp.jpg')
          ? updated[0].replace('_pdp.jpg', '_plp.jpg')
          : updated[0]
        : ''
      : newProduct.imageUrl;

    setNewProduct((prev) => ({
      ...prev,
      imageUrl: newPrimary,
      galleryImages: updated.join(','),
    }));
  };

  const setEditPrimary = (pdpUrl: string) => {
    const plpUrl = pdpUrl.includes('_pdp.jpg') ? pdpUrl.replace('_pdp.jpg', '_plp.jpg') : pdpUrl;
    setEditingProduct((prev) => (prev ? { ...prev, imageUrl: plpUrl } : null));
  };

  const removeEditImage = (imgUrl: string) => {
    if (!editingProduct) return;
    const list = getGalleryArray(editingProduct.galleryImages, editingProduct.imageUrl);
    const updated = list.filter((item) => item !== imgUrl && item !== imgUrl.replace('_pdp.jpg', '_plp.jpg'));
    const isCurrentPrimary =
      editingProduct.imageUrl === imgUrl ||
      editingProduct.imageUrl === imgUrl.replace('_pdp.jpg', '_plp.jpg') ||
      editingProduct.imageUrl.replace('_plp.jpg', '_pdp.jpg') === imgUrl;
    const newPrimary = isCurrentPrimary
      ? updated[0]
        ? updated[0].includes('_pdp.jpg')
          ? updated[0].replace('_pdp.jpg', '_plp.jpg')
          : updated[0]
        : ''
      : editingProduct.imageUrl;

    setEditingProduct((prev) =>
      prev
        ? {
            ...prev,
            imageUrl: newPrimary,
            galleryImages: updated.join(','),
          }
        : null
    );
  };

  // Edit Product Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodData, orderData, statusData, reviewData] = await Promise.all([
        api.getAdminProducts(),
        api.getAdminOrders(),
        api.getZohoStatus(),
        api.getAdminReviews().catch(() => []),
      ]);
      setProducts(prodData);
      setOrders(orderData);
      setZohoStatus(statusData);
      setAdminReviews(reviewData || []);
    } catch (err: any) {
      showToast('Failed to load store data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await api.getAdminReviews();
      setAdminReviews(data);
    } catch (err: any) {
      showToast('Failed to load reviews: ' + err.message, 'error');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleToggleReviewVisibility = async (review: ProductReview) => {
    try {
      setTogglingReviewId(review.id);
      const updated = await api.toggleReviewVisibility(review.id);
      setAdminReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, visible: updated.visible } : r))
      );
      const isNowVisible = updated.visible !== false;
      showToast(
        isNowVisible
          ? `Review is now visible on the PDP page!`
          : `Review hidden from the PDP page.`,
        'success',
        3000
      );
    } catch (err: any) {
      showToast('Failed to toggle review visibility: ' + err.message, 'error');
    } finally {
      setTogglingReviewId(null);
    }
  };

  const handleDeleteReview = async (review: ProductReview) => {
    const confirmDelete = window.confirm(
      `Permanently delete this review by ${review.reviewerName}? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      setDeletingReviewId(review.id);
      await api.deleteReview(review.id);
      setAdminReviews((prev) => prev.filter((r) => r.id !== review.id));
      showToast('Review permanently deleted from database.', 'success', 3000);
    } catch (err: any) {
      showToast('Failed to delete review: ' + err.message, 'error');
    } finally {
      setDeletingReviewId(null);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  // Lock background body scroll when any modal is open
  useEffect(() => {
    const hasOpenModal = isAddModalOpen || isEditModalOpen || !!auditProduct;
    if (hasOpenModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddModalOpen, isEditModalOpen, auditProduct]);

  // Handle Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      setLoginLoading(true);
      const res = await login(adminEmail.trim(), adminPassword.trim());
      if (res.role !== 'ADMIN') {
        logout();
        setLoginError('Access denied: Your account does not have Store Administrator privileges.');
        return;
      }
      showToast('Welcome back, Store Administrator!', 'success');
    } catch (err: any) {
      setLoginError(err.message || 'Invalid administrator email or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  // 1. PUSH TO ZOHO with Toast
  const handlePushToZoho = async () => {
    try {
      setSyncing(true);
      showToast('Pushing cosmetics products to Zoho Inventory API...', 'loading');

      const res = await api.pushProductsToZoho();
      showToast(res.message, 'success', 5000);

      const updated = await api.getAdminProducts();
      setProducts(updated);
    } catch (err: any) {
      showToast('Failed to push to Zoho: ' + (err.message || 'Error occurred'), 'error', 5000);
    } finally {
      setSyncing(false);
    }
  };

  // 2. TWO-WAY SYNC WITH ZOHO with Toast
  const handleSyncFromZoho = async () => {
    try {
      setSyncing(true);
      showToast('Connecting to Zoho Inventory... Synchronizing catalog & live stock...', 'loading');

      const res = await api.syncZohoCatalog();
      showToast(res.message || 'Synced successfully with Zoho Inventory!', 'success', 5000);

      const updated = await api.getAdminProducts();
      setProducts(updated);
    } catch (err: any) {
      showToast('Zoho sync failed: ' + (err.message || 'Error occurred'), 'error', 5000);
    } finally {
      setSyncing(false);
    }
  };

  // 2b. SYNC SINGLE PRODUCT TO ZOHO with Toast
  const handleSyncSingleProduct = async (id: number) => {
    try {
      setSingleSyncingId(id);
      showToast('Pushing product to Zoho Inventory API...', 'loading');
      const res = await api.syncSingleProduct(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, zohoItemId: res.zohoItemId } : p))
      );
      showToast(res.message || 'Product synced to Zoho Inventory!', 'success', 5000);
    } catch (err: any) {
      showToast('Zoho sync failed: ' + (err.message || 'Error occurred'), 'error', 5000);
    } finally {
      setSingleSyncingId(null);
    }
  };

  // 3. UPDATE STOCK with Toast
  const handleUpdateStock = async (id: number) => {
    const newStock = stockEdits[id];
    if (newStock === undefined) return;

    try {
      setSavingStockId(id);
      await api.updateAdminStock(id, newStock);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stockQuantity: newStock } : p))
      );
      const updated = { ...stockEdits };
      delete updated[id];
      setStockEdits(updated);
      showToast(`Stock updated to ${newStock} units`, 'success');
    } catch (err: any) {
      showToast('Failed to update stock: ' + err.message, 'error');
    } finally {
      setSavingStockId(null);
    }
  };

  // 4. RETRY ORDER SYNC with Toast
  const handleRetryOrderSync = async (orderId: number) => {
    try {
      showToast('Retrying order sync with Zoho Inventory...', 'loading');
      const updatedOrder = await api.retryZohoSync(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      if (updatedOrder.zohoSyncStatus === 'SYNCED') {
        showToast(`Order synced! Zoho Sales Order #${updatedOrder.zohoSalesOrderNumber || updatedOrder.zohoSalesOrderId}`, 'success');
      } else {
        showToast('Zoho sync attempted but returned: ' + updatedOrder.zohoSyncStatus, 'info');
      }
    } catch (err: any) {
      showToast('Retry sync failed: ' + err.message, 'error');
    }
  };

  // 4b. LOGISTICS (Xpressbees) & REFUND (Razorpay) ACTIONS
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState<CustomerOrder | null>(null);
  const [trackingData, setTrackingData] = useState<ShipmentTracking | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [selectedSimulateOrder, setSelectedSimulateOrder] = useState<CustomerOrder | null>(null);

  // Return & Exchange Requests State
  const [allReturns, setAllReturns] = useState<OrderReturnExchange[]>([]);
  const [loadingReturns, setLoadingReturns] = useState(false);
  const [verifyingReturnId, setVerifyingReturnId] = useState<number | null>(null);

  const fetchReturns = async () => {
    try {
      setLoadingReturns(true);
      const data = await api.getAllReturnExchanges();
      setAllReturns(data);
    } catch (e) {
      console.error('Failed to fetch returns', e);
    } finally {
      setLoadingReturns(false);
    }
  };

  const handleVerifyPickup = async (returnId: number, passed: boolean) => {
    try {
      showToast(passed ? 'Verifying reverse pickup & issuing instant refund...' : 'Rejecting return request...', 'loading');
      setVerifyingReturnId(returnId);
      const updated = await api.verifyPickupReturn(returnId, passed, passed ? 'Courier confirmed cosmetic batch and seal intact.' : 'Customer item opened / damaged during pickup examination.');
      setAllReturns((prev) => prev.map((r) => (r.id === returnId ? updated : r)));
      // Refresh orders
      const freshOrders = await api.getAdminOrders();
      setOrders(freshOrders);
      showToast(passed ? 'Reverse pickup passed! Instant refund issued & inventory synced.' : 'Pickup rejected.', passed ? 'success' : 'info');
    } catch (err: any) {
      showToast('Verification failed: ' + err.message, 'error');
    } finally {
      setVerifyingReturnId(null);
    }
  };

  const [clearingOrders, setClearingOrders] = useState(false);

  const handleClearAllOrders = async () => {
    if (!window.confirm("⚠️ PERMANENT CLEANUP WARNING:\n\nAre you sure you want to delete ALL customer orders, returns, reverse tracking, and customer order history across Local Database, customer profiles, and Zoho Inventory?\n\nThis cannot be undone.")) {
      return;
    }
    setClearingOrders(true);
    showToast('Clearing all order and return records...', 'loading');
    try {
      const res = await api.clearAllOrders();
      showToast(`Cleared ${res.clearedOrdersCount} orders successfully!`, 'success');
      await loadData();
      await fetchReturns();
    } catch (err: any) {
      showToast(err.message || 'Failed to clear orders', 'error');
    } finally {
      setClearingOrders(false);
    }
  };

  const handleSimulateReturnOutForPickup = async (returnId: number) => {
    try {
      showToast('Simulating courier out for reverse pickup...', 'loading');
      setVerifyingReturnId(returnId);
      const updated = await api.simulateReturnStatus(returnId, 'OUT_FOR_PICKUP');
      setAllReturns((prev) => prev.map((r) => (r.id === returnId ? updated : r)));
      showToast('Status updated: Agent is out for doorstep pickup!', 'success');
    } catch (err: any) {
      showToast('Failed to update status: ' + err.message, 'error');
    } finally {
      setVerifyingReturnId(null);
    }
  };

  const handleDispatchOrder = async (orderId: number) => {
    try {
      showToast('Booking forward shipment with Xpressbees...', 'loading');
      const updatedOrder = await api.manifestShipment(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      showToast(`Shipment booked! AWB: ${updatedOrder.awbNumber}`, 'success');
    } catch (err: any) {
      showToast('Dispatch failed: ' + err.message, 'error');
    }
  };

  const handleRefundOrder = async (orderId: number, orderNum: string) => {
    const confirmRefund = window.confirm(`Initiate Razorpay refund for Order #${orderNum}? Restocked units will be returned to inventory.`);
    if (!confirmRefund) return;

    try {
      showToast(`Processing refund for Order #${orderNum}...`, 'loading');
      const updatedOrder = await api.refundOrder(orderId, 'Store Admin Cancellation');
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
      showToast(`Order #${orderNum} refunded! Batch stock restored.`, 'success');
    } catch (err: any) {
      showToast('Refund failed: ' + err.message, 'error');
    }
  };

  const handleOpenTracking = async (order: CustomerOrder) => {
    setSelectedTrackingOrder(order);
    setLoadingTracking(true);
    try {
      const data = await api.trackOrderShipment(order.id);
      setTrackingData(data);
    } catch (err: any) {
      setTrackingData(null);
      showToast('Could not fetch tracking: ' + err.message, 'error');
    } finally {
      setLoadingTracking(false);
    }
  };

  // 4c. STOCK AUDIT & LEDGER ACTIONS
  const openStockAudit = async (prod: Product) => {
    setAuditProduct(prod);
    setAdjustMode('add');
    setAdjustQuantity(10);
    setAdjustNotes('');
    setBatchActionTab('newBatch');
    setSelectedBatchNumber('');
    setBatchAdjustType('DEFECTIVE');
    setBatchAdjustQty(1);
    setBatchAdjustReason('');
    setBatchSearchQuery('');
    setNewBatchQty(10);
    setNewBatchCustomId('');
    setNewBatchNotes('');

    try {
      setLoadingHistory(true);
      setLoadingBatches(true);
      const [history, batches] = await Promise.all([
        api.getProductStockHistory(prod.id),
        api.getProductBatches(prod.id),
      ]);
      setAuditHistory(history);
      setProductBatches(batches);
      if (batches && batches.length > 0) {
        setSelectedBatchNumber(batches[0].batchNumber);
      }
    } catch (err: any) {
      showToast('Could not fetch stock/batch history: ' + err.message, 'error');
    } finally {
      setLoadingHistory(false);
      setLoadingBatches(false);
    }
  };

  const handleCreateNewBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditProduct) return;
    try {
      setSubmittingNewBatch(true);
      showToast(`Receiving and recording new batch of ${newBatchQty} units...`, 'loading');

      const res = await api.createProductBatch(auditProduct.id, {
        quantity: newBatchQty,
        customBatchNumber: newBatchCustomId.trim() || undefined,
        expiryDate: newBatchExpiry.trim() || undefined,
        supplierName: newBatchSupplier.trim() || undefined,
        notes: newBatchNotes.trim() || 'Warehouse stock replenishment',
        performedBy: user?.email || 'admin@daivatech.com',
      });

      // Update product & batches
      setProducts((prev) => prev.map((p) => (p.id === res.product.id ? res.product : p)));
      setAuditProduct(res.product);
      setProductBatches((prev) => [res.batch, ...prev]);
      setSelectedBatchNumber(res.batch.batchNumber);

      // Refresh history
      const history = await api.getProductStockHistory(res.product.id);
      setAuditHistory(history);

      showToast(`Batch "${res.batch.batchNumber}" created (+${newBatchQty} units)! Total stock: ${res.product.stockQuantity}`, 'success', 5000);
      setNewBatchQty(10);
      setNewBatchCustomId('');
      setNewBatchNotes('');
    } catch (err: any) {
      showToast('Failed to create batch: ' + err.message, 'error');
    } finally {
      setSubmittingNewBatch(false);
    }
  };

  const handleAdjustSpecificBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatchNumber.trim()) {
      showToast('Please select or type a valid Batch ID', 'error');
      return;
    }
    try {
      setSubmittingBatchAdjust(true);
      showToast(`Adjusting batch ${selectedBatchNumber}...`, 'loading');

      const res = await api.adjustBatch(selectedBatchNumber.trim(), {
        adjustmentType: batchAdjustType,
        quantity: batchAdjustQty,
        reason: batchAdjustReason.trim() || (batchAdjustType === 'DEFECTIVE' ? 'Defective stock write-off' : 'Manual batch recount'),
        performedBy: user?.email || 'admin@daivatech.com',
      });

      // Update local product & batch lists
      setProducts((prev) => prev.map((p) => (p.id === res.product.id ? res.product : p)));
      setAuditProduct(res.product);
      setProductBatches((prev) => prev.map((b) => (b.id === res.batch.id ? res.batch : b)));
      setAuditHistory((prev) => [res.movement, ...prev]);

      showToast(
        batchAdjustType === 'DEFECTIVE'
          ? `Batch ${res.batch.batchNumber}: ${batchAdjustQty} defective units written off. Remaining in this batch: ${res.batch.currentQuantity} units`
          : `Batch ${res.batch.batchNumber} reconciled to ${res.batch.currentQuantity} units! Total stock: ${res.product.stockQuantity}`,
        'success',
        5000
      );
      setBatchAdjustReason('');
    } catch (err: any) {
      showToast('Batch adjustment failed: ' + err.message, 'error');
    } finally {
      setSubmittingBatchAdjust(false);
    }
  };

  const handlePerformStockAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditProduct) return;
    try {
      setSubmittingAdjust(true);
      showToast('Updating stock and recording audit movement...', 'loading');

      const isAdditive = adjustMode === 'add';
      const payload = {
        delta: isAdditive ? adjustQuantity : undefined,
        targetStock: !isAdditive ? adjustQuantity : undefined,
        isAdditive,
        notes: adjustNotes.trim() || (isAdditive ? `Restocked +${adjustQuantity} units` : `Reconciled stock count to ${adjustQuantity} units`),
        performedBy: user?.email || 'admin@daivatech.com',
        movementType: isAdditive ? 'RESTOCK' : (adjustQuantity >= auditProduct.stockQuantity ? 'RESTOCK' : 'ADJUSTMENT'),
      };

      const res = await api.adjustProductStock(auditProduct.id, payload);

      setProducts((prev) => prev.map((p) => (p.id === res.product.id ? res.product : p)));
      setAuditProduct(res.product);
      setAuditHistory((prev) => [res.movement, ...prev]);

      try {
        const updatedBatches = await api.getProductBatches(auditProduct.id);
        setProductBatches(updatedBatches);
      } catch (e) {
        // ignore batch reload error
      }

      showToast(`Stock updated! New in-stock balance: ${res.product.stockQuantity} units`, 'success', 4000);
      setAdjustNotes('');
    } catch (err: any) {
      showToast('Failed to adjust stock: ' + err.message, 'error');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const loadGlobalLedger = async () => {
    try {
      setLoadingLedger(true);
      const data = await api.getAllStockHistory();
      setGlobalMovements(data);
    } catch (err: any) {
      showToast('Failed to load stock ledger: ' + err.message, 'error');
    } finally {
      setLoadingLedger(false);
    }
  };

  // 5. POST NEW PRODUCT with Toast
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingAddImages) {
      showToast('Please wait for product images to finish uploading', 'info');
      return;
    }

    if (!newProduct.name || !newProduct.name.trim()) {
      showToast('Please enter a product name', 'error');
      return;
    }

    const priceNum = parseFloat(newProduct.price.toString()) || 0;
    if (priceNum <= 0) {
      showToast('Please enter a valid selling price greater than ₹0', 'error');
      return;
    }

    try {
      setSubmittingProduct(true);
      showToast('Creating product in database & syncing to Zoho...', 'loading');

      const origPriceNum = parseFloat((newProduct.originalPrice || newProduct.price).toString()) || priceNum;

      let discount = newProduct.discountPercent;
      if (origPriceNum > priceNum) {
        discount = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
      }

      const defaultFallbackImg = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80';
      const cleanImg = (newProduct.imageUrl && newProduct.imageUrl.trim()) || defaultFallbackImg;
      const cleanGallery = (newProduct.galleryImages && newProduct.galleryImages.trim()) || cleanImg;

      const payload = {
        name: newProduct.name.trim(),
        brand: newProduct.brand.trim() || 'Aura Luxe',
        category: 'Cosmetics',
        subCategory: newProduct.subCategory || 'Serums & Treatments',
        price: priceNum,
        originalPrice: origPriceNum,
        discountPercent: discount,
        stockQuantity: Math.max(0, parseInt((newProduct.stockQuantity || 0).toString()) || 0),
        sku: newProduct.sku.trim() || undefined,
        volume: newProduct.volume.trim() || '30 ml',
        skinType: newProduct.skinType || 'All Skin Types',
        imageUrl: cleanImg,
        galleryImages: cleanGallery,
        description: newProduct.description.trim(),
        keyIngredients: newProduct.keyIngredients.trim(),
        howToUse: newProduct.howToUse.trim(),
        isBestSeller: Boolean(newProduct.isBestSeller),
        isFeatured: Boolean(newProduct.isFeatured),
      };

      const created = await api.createAdminProduct(payload);
      setProducts((prev) => [created, ...prev]);
      setIsAddModalOpen(false);

      // Reset form
      setNewProduct({
        name: '',
        brand: 'Aura Luxe',
        subCategory: 'Serums & Treatments',
        price: 999,
        originalPrice: 1399,
        discountPercent: 28,
        stockQuantity: 25,
        sku: '',
        volume: '30 ml',
        skinType: 'All Skin Types',
        imageUrl: '',
        galleryImages: '',
        description: '',
        keyIngredients: '',
        howToUse: '',
        isBestSeller: false,
        isFeatured: true,
      });

      showToast(`Product "${created.name}" published to store and synced to Zoho!`, 'success', 5000);
    } catch (err: any) {
      showToast('Failed to create product: ' + (err.message || 'Error occurred'), 'error', 6000);
    } finally {
      setSubmittingProduct(false);
    }
  };

  // 6. UPDATE EXISTING PRODUCT with Toast
  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setSubmittingEdit(true);
      showToast(`Saving changes to "${editingProduct.name}" & updating Zoho...`, 'loading');

      const priceNum = parseFloat(editingProduct.price.toString()) || 0;
      const origPriceNum = parseFloat((editingProduct.originalPrice || editingProduct.price).toString()) || priceNum;

      let discount = editingProduct.discountPercent || 0;
      if (origPriceNum > priceNum) {
        discount = Math.round(((origPriceNum - priceNum) / origPriceNum) * 100);
      }

      const payload = {
        name: editingProduct.name.trim(),
        brand: editingProduct.brand ? editingProduct.brand.trim() : 'Aura Luxe',
        subCategory: editingProduct.subCategory,
        price: priceNum,
        originalPrice: origPriceNum,
        discountPercent: discount,
        stockQuantity: parseInt((editingProduct.stockQuantity || 0).toString()) || 0,
        volume: editingProduct.volume ? editingProduct.volume.trim() : '30 ml',
        skinType: editingProduct.skinType || 'All Skin Types',
        imageUrl: editingProduct.imageUrl ? editingProduct.imageUrl.trim() : '',
        galleryImages: editingProduct.galleryImages ? editingProduct.galleryImages.trim() : (editingProduct.imageUrl || '').trim(),
        description: editingProduct.description ? editingProduct.description.trim() : '',
        keyIngredients: editingProduct.keyIngredients ? editingProduct.keyIngredients.trim() : '',
        howToUse: editingProduct.howToUse ? editingProduct.howToUse.trim() : '',
        isActive: editingProduct.isActive ?? true,
        isFeatured: editingProduct.isFeatured ?? false,
        isBestSeller: editingProduct.isBestSeller ?? false,
      };

      const updated = await api.updateAdminProduct(editingProduct.id, payload);
      setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setIsEditModalOpen(false);
      setEditingProduct(null);

      showToast(`Updated "${updated.name}" successfully!`, 'success', 5000);
    } catch (err: any) {
      showToast('Failed to update product: ' + (err.message || 'Error occurred'), 'error', 6000);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Quick preset cosmetics images
  const imagePresets = [
    { label: 'Serum Bottle', url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80' },
    { label: 'Red Lipstick', url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80' },
    { label: 'Luxury Cream Jar', url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80' },
    { label: 'SPF Tube', url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80' },
    { label: 'Foundation Glow', url: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80' },
    { label: 'Foam Cleanser', url: 'https://images.unsplash.com/photo-1556228722-d0b5de70d70c?auto=format&fit=crop&w=800&q=80' },
  ];

  // -------------------------------------------------------------
  // VIEW A: ADMIN LOGIN REQUIRED GATE
  // -------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#120D0A] flex flex-col justify-center items-center p-4 selection:bg-rose-900 selection:text-white relative">
        <div className="absolute top-6 right-6">
          <ThemeToggle
            showLabel={true}
            className="bg-white/15 hover:bg-white/25 text-white hover:text-amber-300 border border-white/30 text-xs py-1.5 px-3 rounded-lg shadow-xs transition"
          />
        </div>
        <div className="max-w-md w-full bg-[#1C1510] border border-[#2e231c] rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-white">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-wide text-white">
              AURA LUXE ADMIN
            </h1>
            <p className="text-xs text-neutral-400">
              Restricted Store Management Portal & Zoho ERP Control
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Administrator Email</label>
              <input
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@daivatech.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[#281e17] border border-[#3d2e23] text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1">Password</label>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#281e17] border border-[#3d2e23] text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 rounded-xl bg-rose-700 hover:bg-rose-800 font-semibold text-xs tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Admin Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="pt-4 border-t border-[#2e231c] flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                setAdminEmail('admin@daivatech.com');
                setAdminPassword('admin123');
              }}
              className="w-full py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs transition border border-white/10 flex items-center justify-center gap-2"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fill Demo Credentials (admin@daivatech.com / admin123)</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full text-center text-xs text-neutral-400 hover:text-white transition py-1 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Public Storefront</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW B: AUTHENTICATED ADMIN DASHBOARD (ISOLATED PORTAL)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#F6F4EE] dark:bg-[#0F0C0A] text-neutral-800 dark:text-[#EDE4DA] flex flex-col selection:bg-rose-100 selection:text-rose-900 transition-colors duration-200">
      {/* FLOATING TOAST NOTIFICATION (ALWAYS ON TOP OF MODALS) */}
      {toast.show && (
        <div className="fixed top-6 right-6 z-[9999] max-w-md animate-in slide-in-from-top-4 duration-300 pointer-events-auto shadow-2xl">
          <div
            className={`p-4 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/60'
                : toast.type === 'error'
                ? 'bg-rose-950/90 text-rose-100 border-rose-700/60'
                : toast.type === 'loading'
                ? 'bg-[#1E1611]/95 text-white border-neutral-700'
                : 'bg-neutral-900/90 text-white border-neutral-700'
            }`}
          >
            {toast.type === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-rose-400 flex-shrink-0" />}
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-amber-400 flex-shrink-0" />}

            <p className="text-xs font-medium flex-1">{toast.message}</p>

            {toast.type !== 'loading' && (
              <button
                onClick={() => setToast((prev) => ({ ...prev, show: false }))}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* DEDICATED INDIVIDUAL ADMIN HEADER */}
      <header className="bg-[#19120E] text-white border-b border-[#2e231c] px-4 sm:px-8 py-3.5 sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base tracking-wider text-white">AURA LUXE</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Management Console
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">Zoho Inventory Live Sync • Org #{zohoStatus?.isConnected ? '60094669110' : 'Offline'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Appearance Theme Toggle */}
            <ThemeToggle
              showLabel={true}
              className="bg-white/15 hover:bg-white/25 text-white hover:text-amber-300 border border-white/30 text-xs py-1.5 px-3 rounded-lg shadow-xs transition"
            />

            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 border border-white/10"
              title="Open customer storefront in preview"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Storefront</span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-neutral-700">
              <div className="hidden md:block text-right">
                <p className="text-xs font-semibold text-white leading-tight">{user?.fullName || 'Store Administrator'}</p>
                <p className="text-[10px] text-neutral-400 font-mono">{user?.email || 'admin@daivatech.com'}</p>
              </div>

              <button
                onClick={() => {
                  logout();
                  showToast('Logged out of admin console', 'info');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800 text-xs font-semibold transition flex items-center gap-1.5 shadow"
                title="End administrator session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ADMIN BODY */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 flex-1 w-full">
        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-[#2C211A] gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-5 py-3 rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'bg-white dark:bg-[#1A1410] border-t border-l border-r border-neutral-200 dark:border-[#2C211A] text-rose-800 dark:text-rose-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Product Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('zoho')}
            className={`px-5 py-3 rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'zoho'
                ? 'bg-white dark:bg-[#1A1410] border-t border-l border-r border-neutral-200 dark:border-[#2C211A] text-rose-800 dark:text-rose-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Zoho ERP Integration</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-3 rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-white dark:bg-[#1A1410] border-t border-l border-r border-neutral-200 dark:border-[#2C211A] text-rose-800 dark:text-rose-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ledger');
              loadGlobalLedger();
            }}
            className={`px-5 py-3 rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'ledger'
                ? 'bg-white dark:bg-[#1A1410] border-t border-l border-r border-neutral-200 dark:border-[#2C211A] text-rose-800 dark:text-rose-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Stock Audit Ledger</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('reviews');
              loadAdminReviews();
            }}
            className={`px-5 py-3 rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-white dark:bg-[#1A1410] border-t border-l border-r border-neutral-200 dark:border-[#2C211A] text-rose-800 dark:text-rose-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Product Reviews ({adminReviews.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('returns');
              fetchReturns();
            }}
            className={`px-5 py-3 rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'returns'
                ? 'bg-white dark:bg-[#1A1410] border-t border-l border-r border-neutral-200 dark:border-[#2C211A] text-rose-800 dark:text-rose-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-600" />
            <span>Returns & Exchanges ({allReturns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('footer_policies')}
            className={`px-5 py-3 rounded-t-xl transition flex items-center gap-2 ${
              activeTab === 'footer_policies'
                ? 'bg-white dark:bg-[#1A1410] border-t border-l border-r border-neutral-200 dark:border-[#2C211A] text-purple-700 dark:text-purple-400 shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Footer & Policies CMS</span>
          </button>
        </div>

        {/* TAB 1: PRODUCT CATALOG & INVENTORY TABLE */}
        {activeTab === 'inventory' && (
          <div className="bg-white dark:bg-[#16100C] rounded-3xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden shadow-sm space-y-0">
            <div className="p-5 border-b border-neutral-100 dark:border-[#2C211A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FAF9F6] dark:bg-[#1A130E]">
              <div>
                <h3 className="font-serif text-lg font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                  Cosmetics Product Catalog
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Post new cosmetic items, edit existing product details, update stock, or sync live with Zoho Inventory.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 bg-rose-700 text-white text-xs font-semibold rounded-xl hover:bg-rose-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Product</span>
                </button>
                <button
                  onClick={handleSyncFromZoho}
                  disabled={syncing}
                  className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-sm"
                  title="Synchronize all items & stock with Zoho Inventory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>Sync with Zoho</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-[#FAF5EF] dark:bg-[#1E1712] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-[#2C211A]">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">SubCategory</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Zoho Item ID</th>
                    <th className="py-3 px-4">Price (₹)</th>
                    <th className="py-3 px-4">Stock Qty</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-[#251B15]">
                  {products.map((p) => {
                    const isEdited = stockEdits[p.id] !== undefined;
                    const currentStock = isEdited ? stockEdits[p.id] : p.stockQuantity;

                    return (
                      <tr key={p.id} className="hover:bg-[#FAF9F6] dark:hover:bg-[#201813]/60 transition">
                        <td className="py-3.5 px-4 flex items-center gap-3">
                          <img
                            src={getFullImageUrl(p.imageUrl)}
                            alt={p.name}
                            className="w-10 h-12 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-[#2C211A]"
                            onError={handleImageError}
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-neutral-900 dark:text-[#EDE4DA] truncate max-w-xs">{p.name}</p>
                            <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{p.brand} • {p.volume}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">{p.subCategory}</td>
                        <td className="py-3.5 px-4 font-mono text-neutral-800 dark:text-neutral-200 font-semibold">{p.sku}</td>
                        <td className="py-3.5 px-4 font-mono text-neutral-500 dark:text-neutral-400">
                          {p.zohoItemId ? (
                            <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-semibold text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              {p.zohoItemId}
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded text-[10px] font-medium">Unsynced</span>
                              <button
                                onClick={() => handleSyncSingleProduct(p.id)}
                                disabled={singleSyncingId === p.id}
                                className="px-2 py-0.5 bg-rose-700 text-white text-[10px] font-semibold rounded hover:bg-rose-800 transition flex items-center gap-1 shadow-sm"
                                title="Sync this product to Zoho now"
                              >
                                {singleSyncingId === p.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Database className="w-2.5 h-2.5" />}
                                <span>Sync</span>
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-neutral-900 dark:text-[#EDE4DA]">₹{p.price.toLocaleString()}</td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="0"
                              value={currentStock}
                              onChange={(e) =>
                                setStockEdits({
                                  ...stockEdits,
                                  [p.id]: Math.max(0, parseInt(e.target.value) || 0),
                                })
                              }
                              className={`w-16 p-1.5 rounded-lg border text-xs font-bold text-center ${
                                isEdited ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-neutral-200 bg-white'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-semibold ${
                                currentStock <= 0 ? 'text-red-600' : currentStock <= 5 ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            >
                              {currentStock <= 0 ? 'Out' : currentStock <= 5 ? 'Low' : 'OK'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isEdited && (
                              <button
                                onClick={() => handleUpdateStock(p.id)}
                                disabled={savingStockId === p.id}
                                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 transition flex items-center gap-1 shadow"
                              >
                                <Save className="w-3 h-3" />
                                <span>Save</span>
                              </button>
                            )}

                            <button
                              onClick={() => openStockAudit(p)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm"
                              title="View stock audit trail & restock"
                            >
                              <History className="w-3 h-3 text-amber-700" />
                              <span>History</span>
                            </button>

                            <button
                              onClick={() => {
                                setEditingProduct({ ...p });
                                setIsEditModalOpen(true);
                              }}
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-neutral-200"
                              title="Edit product details"
                            >
                              <Edit3 className="w-3 h-3 text-neutral-600" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => onNavigate('pdp', p.slug)}
                              className="text-neutral-400 hover:text-neutral-800 p-1 rounded hover:bg-neutral-100"
                              title="Preview on Storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ZOHO ERP SYNC HUB */}
        {activeTab === 'zoho' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Zoho Connection Card */}
              <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-neutral-200 dark:border-[#2C211A] shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-bold">API Status</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      zohoStatus?.isConnected ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {zohoStatus?.isConnected ? 'ONLINE & ACTIVE' : 'CONFIGURED'}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                  Zoho Inventory / Books
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {zohoStatus?.statusMessage}
                </p>
                <div className="pt-2 text-xs space-y-1 text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-[#2C211A]">
                  <p><strong className="text-neutral-800 dark:text-neutral-200">Domain:</strong> accounts.zoho.in (India DC)</p>
                  <p><strong className="text-neutral-800 dark:text-neutral-200">Org ID:</strong> 60094669110</p>
                  <p><strong className="text-neutral-800 dark:text-neutral-200">Auth Method:</strong> OAuth 2.0 Refresh Token</p>
                </div>
              </div>

              {/* Push to Zoho Card */}
              <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 shadow-sm space-y-4">
                <span className="text-xs uppercase tracking-widest text-rose-700 dark:text-rose-400 font-bold">1. Upload Catalog</span>
                <h3 className="font-serif text-xl font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                  Push Products to Zoho
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Uploads all {products.length} cosmetics items from the database directly into your Zoho Inventory account with SKUs, rates, and stock quantities.
                </p>
                <button
                  onClick={handlePushToZoho}
                  disabled={syncing}
                  className={`w-full py-3 rounded-full bg-rose-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-md ${
                    syncing ? 'opacity-60 cursor-wait' : 'hover:bg-rose-800'
                  }`}
                >
                  <Database className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing...' : 'Push All Products to Zoho'}</span>
                </button>
              </div>

              {/* Two-Way Sync Card */}
              <div className="bg-white dark:bg-[#16100C] rounded-3xl p-6 border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/20 dark:bg-emerald-950/10 shadow-sm space-y-4">
                <span className="text-xs uppercase tracking-widest text-emerald-700 dark:text-emerald-400 font-bold">2. Two-Way Sync</span>
                <h3 className="font-serif text-xl font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                  Sync All with Zoho
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Automatically pushes any unsynced products to Zoho Inventory, and pulls current stock quantities & price updates back into the storefront database.
                </p>
                <button
                  onClick={handleSyncFromZoho}
                  disabled={syncing}
                  className={`w-full py-3 rounded-full bg-emerald-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-md ${
                    syncing ? 'opacity-60 cursor-wait' : 'hover:bg-emerald-800'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Syncing with Zoho...' : 'Run Full Two-Way Sync'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOMER ORDERS & ZOHO SALES ORDER AUDIT */}
        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-[#16100C] rounded-3xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden shadow-sm space-y-0">
            <div className="p-5 border-b border-neutral-100 dark:border-[#2C211A] flex justify-between items-center bg-[#FAF9F6] dark:bg-[#1A130E]">
              <div>
                <h3 className="font-serif text-lg font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                  Store Orders & Zoho Sales Order Audit
                </h3>
                <p className="text-xs text-neutral-400 dark:text-neutral-500">All consumer purchases and their automated Zoho ERP Sales Order numbers.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearAllOrders}
                  disabled={clearingOrders || orders.length === 0}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 border border-red-200 dark:border-red-800 disabled:opacity-40 cursor-pointer"
                  title="Purge all test orders, returns, and customer history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{clearingOrders ? 'Cleaning...' : 'Clear All Orders'}</span>
                </button>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 bg-neutral-100 dark:bg-[#251B15] hover:bg-neutral-200 dark:hover:bg-[#33241C] text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center text-xs text-neutral-500 dark:text-neutral-400">
                No orders placed yet. Place a test order through the storefront checkout!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[850px]">
                  <thead className="bg-[#FAF5EF] dark:bg-[#1E1712] text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold border-b border-neutral-200 dark:border-[#2C211A]">
                    <tr>
                      <th className="py-3 px-4">Order #</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Products</th>
                      <th className="py-3 px-4 text-center">Units</th>
                      <th className="py-3 px-4">Total</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Logistics (Xpressbees)</th>
                      <th className="py-3 px-4">Zoho Sync</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-[#251B15]">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#FAF9F6] dark:hover:bg-[#201813]/60 transition">
                        <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                          <div>{o.orderNumber}</div>
                          <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-sans">{new Date(o.createdAt).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-neutral-900 dark:text-[#EDE4DA]">{o.customerName}</p>
                          <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{o.customerPhone || o.customerEmail}</p>
                          <p className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{o.city} - {o.pincode}</p>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-700 dark:text-neutral-300">
                          <div className="text-[11px] font-bold text-neutral-900 dark:text-[#EDE4DA] mb-1 h-5 flex items-center">
                            {o.items.length} Product{o.items.length > 1 ? 's' : ''}
                          </div>
                          <div className="space-y-1">
                            {o.items.map((it) => (
                              <div
                                key={it.id}
                                className="text-[11px] truncate max-w-[220px] text-neutral-800 dark:text-neutral-200 h-5 flex items-center"
                                title={it.productName}
                              >
                                {it.productName}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center text-neutral-700 dark:text-neutral-300">
                          <div className="text-[11px] font-bold text-rose-800 dark:text-rose-400 mb-1 h-5 flex items-center justify-center">
                            {o.items.reduce((sum, it) => sum + (it.quantity || 1), 0)} Total
                          </div>
                          <div className="space-y-1">
                            {o.items.map((it) => (
                              <div
                                key={it.id}
                                className="text-[11px] font-mono font-semibold text-neutral-700 dark:text-neutral-300 h-5 flex items-center justify-center"
                              >
                                {it.quantity}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-rose-800 dark:text-rose-400">₹{o.totalAmount.toLocaleString()}</td>
                        
                        {/* Payment Status & Details */}
                        <td className="py-3.5 px-4">
                          {o.refundStatus === 'REFUNDED' ? (
                            <div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1 w-max">
                                <RotateCcw className="w-2.5 h-2.5" />
                                REFUNDED
                              </span>
                              <p className="text-[9px] font-mono text-neutral-400 mt-0.5">{o.refundId}</p>
                            </div>
                          ) : o.paymentStatus === 'PAID' ? (
                            <div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1 w-max">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                PAID ({o.paymentMethod || 'ONLINE'})
                              </span>
                              {o.razorpayPaymentId && (
                                <p className="text-[9px] font-mono text-neutral-400 mt-0.5">{o.razorpayPaymentId}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 w-max inline-block">
                              COD (PENDING)
                            </span>
                          )}
                        </td>

                        {/* Logistics (Xpressbees) */}
                        <td className="py-3.5 px-4">
                          {o.awbNumber ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-neutral-800">
                                <Truck className="w-3.5 h-3.5 text-amber-600" />
                                <span>{o.awbNumber}</span>
                              </div>
                              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                                {o.courierStatus || 'MANIFESTED'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                              READY TO DISPATCH
                            </span>
                          )}
                        </td>

                        {/* Zoho Sync */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              o.zohoSyncStatus === 'SYNCED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.zohoSyncStatus}
                          </span>
                          {o.zohoSalesOrderNumber && (
                            <p className="text-[9px] font-mono text-neutral-500 mt-0.5">#{o.zohoSalesOrderNumber}</p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* XpressBees Interactive Simulation Modal Trigger */}
                            <button
                              onClick={() => setSelectedSimulateOrder(o)}
                              className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[11px] font-bold hover:opacity-90 transition flex items-center gap-1 shadow-xs cursor-pointer"
                              title="Open XpressBees Simulator to emulate dispatch, deliver, doorstep NDR, or RTO"
                            >
                              <Truck className="w-3 h-3" />
                              <span>Simulate XpressBees</span>
                            </button>

                            {/* Xpressbees Dispatch or Print Label */}
                            {!o.awbNumber ? (
                              <button
                                onClick={() => handleDispatchOrder(o.id)}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white text-[11px] font-semibold hover:bg-amber-700 transition flex items-center gap-1 shadow-xs"
                                title="Book shipment with Xpressbees and generate AWB"
                              >
                                <Truck className="w-3 h-3" />
                                <span>Dispatch Xpressbees</span>
                              </button>
                            ) : (
                              <>
                                <a
                                  href={`/api/shipping/labels/${o.awbNumber}.pdf`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-200 text-[11px] font-semibold hover:bg-neutral-200 transition flex items-center gap-1"
                                  title="Print Xpressbees Barcode Label PDF"
                                >
                                  <Printer className="w-3 h-3 text-neutral-600" />
                                  <span>Print Label</span>
                                </a>
                                <button
                                  onClick={() => handleOpenTracking(o)}
                                  className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold hover:bg-blue-100 transition flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Track</span>
                                </button>
                              </>
                            )}

                            {/* Razorpay Refund Action */}
                            {o.paymentStatus === 'PAID' && o.refundStatus !== 'REFUNDED' && (
                              <button
                                onClick={() => handleRefundOrder(o.id, o.orderNumber)}
                                className="px-2 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 text-[11px] font-semibold hover:bg-red-100 transition flex items-center gap-1"
                                title="Issue online refund via Razorpay & restore batch stock"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Refund</span>
                              </button>
                            )}

                            {/* Zoho Retry */}
                            {o.zohoSyncStatus !== 'SYNCED' && (
                              <button
                                onClick={() => handleRetryOrderSync(o.id)}
                                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold hover:bg-amber-100 transition"
                              >
                                Retry Zoho
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GLOBAL STOCK AUDIT LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-[#16100C] rounded-3xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden shadow-sm space-y-0">
              <div className="p-5 border-b border-neutral-100 dark:border-[#2C211A] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FAF9F6] dark:bg-[#1A130E]">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                    <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span>Inventory Movement Ledger & Stock Audit Trail</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Immutable event log of every restock, order sale deduction, manual adjustment, and initial stock allocation across all cosmetics.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search Batch ID, SKU, Product, or Order..."
                      value={globalLedgerSearch}
                      onChange={(e) => setGlobalLedgerSearch(e.target.value)}
                      className="pl-8 pr-7 py-1.5 rounded-xl border border-neutral-200 dark:border-[#33261D] bg-white dark:bg-[#201813] text-xs text-neutral-800 dark:text-[#EDE4DA] placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-amber-500 w-56 sm:w-64"
                    />
                    {globalLedgerSearch && (
                      <button
                        onClick={() => setGlobalLedgerSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center bg-white dark:bg-[#201813] border border-neutral-200 dark:border-[#33261D] rounded-xl p-1 text-xs">
                    <button
                      onClick={() => setLedgerFilter('ALL')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        ledgerFilter === 'ALL' ? 'bg-[#1E1611] dark:bg-rose-900/60 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      All Events
                    </button>
                    <button
                      onClick={() => setLedgerFilter('RESTOCK')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        ledgerFilter === 'RESTOCK' ? 'bg-emerald-700 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Restocks (+)
                    </button>
                    <button
                      onClick={() => setLedgerFilter('ORDER_SALE')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        ledgerFilter === 'ORDER_SALE' ? 'bg-rose-700 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Orders (-)
                    </button>
                    <button
                      onClick={() => setLedgerFilter('DEFECTIVE_WRITE_OFF')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        ledgerFilter === 'DEFECTIVE_WRITE_OFF' ? 'bg-red-700 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Defectives (-)
                    </button>
                    <button
                      onClick={() => setLedgerFilter('ADJUSTMENT')}
                      className={`px-3 py-1 rounded-lg font-medium transition ${
                        ledgerFilter === 'ADJUSTMENT' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      Adjustments
                    </button>
                  </div>
                  <button
                    onClick={loadGlobalLedger}
                    disabled={loadingLedger}
                    className="px-3 py-1.5 bg-neutral-100 dark:bg-[#251B15] hover:bg-neutral-200 dark:hover:bg-[#33241C] text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingLedger ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {loadingLedger ? (
                <div className="p-12 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
                  <span>Loading inventory ledger history...</span>
                </div>
              ) : globalMovements.length === 0 ? (
                <div className="p-12 text-center text-neutral-400 text-xs">
                  No stock movement records found yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[800px]">
                    <thead className="bg-[#FAF9F6] text-neutral-400 uppercase tracking-wider text-[10px] font-bold border-b border-neutral-100">
                      <tr>
                        <th className="py-3 px-4">Date & Time</th>
                        <th className="py-3 px-4">Product Name & SKU</th>
                        <th className="py-3 px-4">Event Type</th>
                        <th className="py-3 px-4">Quantity Change</th>
                        <th className="py-3 px-4">Stock Balance</th>
                        <th className="py-3 px-4">Reference / Order</th>
                        <th className="py-3 px-4">Performed By</th>
                        <th className="py-3 px-4">Notes / Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {globalMovements
                        .filter((m) => {
                          const matchesFilter = ledgerFilter === 'ALL' || m.movementType === ledgerFilter;
                          if (!matchesFilter) return false;
                          if (!globalLedgerSearch.trim()) return true;
                          const q = globalLedgerSearch.toLowerCase();
                          return (
                            (m.productName && m.productName.toLowerCase().includes(q)) ||
                            (m.productSku && m.productSku.toLowerCase().includes(q)) ||
                            (m.referenceId && m.referenceId.toLowerCase().includes(q)) ||
                            (m.notes && m.notes.toLowerCase().includes(q)) ||
                            (m.performedBy && m.performedBy.toLowerCase().includes(q))
                          );
                        })
                        .map((m) => {
                          const isPositive = m.quantityDelta > 0;
                          return (
                            <tr key={m.id} className="hover:bg-neutral-50/50 transition">
                              <td className="py-3.5 px-4 font-mono text-neutral-500 whitespace-nowrap">
                                {new Date(m.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3.5 px-4">
                                <p className="font-semibold text-neutral-900">{m.productName}</p>
                                {m.productSku && <p className="text-[10px] font-mono text-neutral-400">{m.productSku}</p>}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                    m.movementType === 'RESTOCK'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : m.movementType === 'ORDER_SALE'
                                      ? 'bg-rose-100 text-rose-800'
                                      : m.movementType === 'INITIAL'
                                      ? 'bg-purple-100 text-purple-800'
                                      : m.movementType === 'DEFECTIVE_WRITE_OFF'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {m.movementType === 'RESTOCK' && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                                  {m.movementType === 'ORDER_SALE' && <TrendingDown className="w-3 h-3 text-rose-600" />}
                                  {m.movementType === 'INITIAL' && <Sparkles className="w-3 h-3 text-purple-600" />}
                                  {m.movementType === 'DEFECTIVE_WRITE_OFF' && <AlertCircle className="w-3 h-3 text-red-600" />}
                                  <span>{m.movementType}</span>
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-bold font-mono text-sm">
                                <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                                  {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-neutral-600 whitespace-nowrap">
                                <span className="text-neutral-400">{m.previousStock}</span>
                                <span className="mx-1 text-neutral-300">→</span>
                                <strong className="text-neutral-900">{m.newStock}</strong>
                              </td>
                              <td className="py-3.5 px-4 font-mono text-neutral-500">
                                {m.referenceId || '—'}
                              </td>
                              <td className="py-3.5 px-4 text-neutral-600 truncate max-w-[160px]" title={m.performedBy}>
                                {m.performedBy || 'System'}
                              </td>
                              <td className="py-3.5 px-4 text-neutral-500 max-w-xs truncate" title={m.notes}>
                                {m.notes || '—'}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: CUSTOMER REVIEWS & PDP MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Header & Metrics */}
            <div className="bg-white dark:bg-[#16100C] rounded-3xl border border-neutral-200 dark:border-[#2C211A] p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-neutral-100 dark:border-[#2C211A]">
                <div>
                  <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-[#EDE4DA] flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                    <span>Customer Reviews & PDP Moderation</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                    Manage customer reviews, inspect buyer photo attachments, and toggle visibility on the store Product Details Page (PDP).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadAdminReviews}
                    disabled={loadingReviews}
                    className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-[#251B15] text-neutral-700 dark:text-neutral-300 text-xs font-semibold hover:bg-neutral-200 dark:hover:bg-[#33241C] transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingReviews ? 'animate-spin' : ''}`} />
                    <span>Refresh Reviews</span>
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#1E1712] border border-neutral-200/80 dark:border-[#2C211A] space-y-1">
                  <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                    <span>Total Feedback</span>
                    <MessageSquare className="w-4 h-4 text-neutral-400" />
                  </div>
                  <p className="font-serif text-2xl font-bold text-neutral-900 dark:text-[#EDE4DA]">{adminReviews.length}</p>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">All submitted reviews</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                    <span>Visible on PDP</span>
                    <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <p className="font-serif text-2xl font-bold text-emerald-950 dark:text-emerald-200">
                    {adminReviews.filter((r) => r.visible !== false).length}
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">Live on storefront pages</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                  <div className="flex items-center justify-between text-amber-800 dark:text-amber-300 text-xs font-semibold">
                    <span>Hidden from Store</span>
                    <EyeOff className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <p className="font-serif text-2xl font-bold text-amber-950 dark:text-amber-200">
                    {adminReviews.filter((r) => r.visible === false).length}
                  </p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400">Moderated / offline</p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/40 space-y-1">
                  <div className="flex items-center justify-between text-rose-800 dark:text-rose-300 text-xs font-semibold">
                    <span>Average Store Rating</span>
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                  <p className="font-serif text-2xl font-bold text-neutral-900 dark:text-[#EDE4DA]">
                    {(() => {
                      const visibleOnes = adminReviews.filter((r) => r.visible !== false);
                      if (visibleOnes.length === 0) return '5.0';
                      const sum = visibleOnes.reduce((acc, r) => acc + (r.rating || 5), 0);
                      return (sum / visibleOnes.length).toFixed(1);
                    })()}
                    <span className="text-xs text-neutral-400 font-sans font-normal ml-1">/ 5.0</span>
                  </p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">Calculated from visible reviews</p>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="pt-2 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by product, SKU, reviewer, or review text..."
                    value={reviewSearchQuery}
                    onChange={(e) => setReviewSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#FAF9F6] dark:bg-[#201813] border border-neutral-200 dark:border-[#33261D] text-neutral-800 dark:text-[#EDE4DA] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  {reviewSearchQuery && (
                    <button
                      onClick={() => setReviewSearchQuery('')}
                      className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Visibility Filter */}
                  <div className="flex items-center rounded-xl bg-neutral-100 dark:bg-[#201813] p-0.5 border border-neutral-200 dark:border-[#33261D] text-xs">
                    {(['ALL', 'VISIBLE', 'HIDDEN'] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setReviewFilterStatus(status)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition ${
                          reviewFilterStatus === status
                            ? 'bg-white dark:bg-rose-900/60 text-neutral-900 dark:text-white shadow-2xs font-bold'
                            : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                      >
                        {status === 'ALL'
                          ? `All (${adminReviews.length})`
                          : status === 'VISIBLE'
                          ? `Visible (${adminReviews.filter((r) => r.visible !== false).length})`
                          : `Hidden (${adminReviews.filter((r) => r.visible === false).length})`}
                      </button>
                    ))}
                  </div>

                  {/* Rating Filter */}
                  <select
                    value={reviewRatingFilter}
                    onChange={(e) =>
                      setReviewRatingFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                    }
                    className="px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">All Stars</option>
                    <option value="5">5 Stars ★★★★★</option>
                    <option value="4">4 Stars ★★★★</option>
                    <option value="3">3 Stars ★★★</option>
                    <option value="2">2 Stars ★★</option>
                    <option value="1">1 Star ★</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Reviews List Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-sm">
              {loadingReviews ? (
                <div className="p-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-700 mx-auto" />
                  <p className="text-xs text-neutral-500">Loading customer reviews...</p>
                </div>
              ) : (
                (() => {
                  const filtered = adminReviews.filter((r) => {
                    if (reviewFilterStatus === 'VISIBLE' && r.visible === false) return false;
                    if (reviewFilterStatus === 'HIDDEN' && r.visible !== false) return false;
                    if (reviewRatingFilter !== 'ALL' && r.rating !== reviewRatingFilter) return false;
                    if (reviewSearchQuery.trim()) {
                      const q = reviewSearchQuery.toLowerCase();
                      const matchProd =
                        (r.productName || '').toLowerCase().includes(q) ||
                        (r.productSku || '').toLowerCase().includes(q);
                      const matchReviewer = (r.reviewerName || '').toLowerCase().includes(q);
                      const matchTitle = (r.title || '').toLowerCase().includes(q);
                      const matchComment = (r.comment || '').toLowerCase().includes(q);
                      if (!matchProd && !matchReviewer && !matchTitle && !matchComment) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-16 text-center space-y-3">
                        <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto" />
                        <h4 className="font-serif text-base font-semibold text-neutral-800">
                          No reviews found matching criteria
                        </h4>
                        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                          Try adjusting your search keywords, star rating filter, or visibility toggle.
                        </p>
                        {(reviewSearchQuery || reviewFilterStatus !== 'ALL' || reviewRatingFilter !== 'ALL') && (
                          <button
                            onClick={() => {
                              setReviewSearchQuery('');
                              setReviewFilterStatus('ALL');
                              setReviewRatingFilter('ALL');
                            }}
                            className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
                          >
                            Reset All Filters
                          </button>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y divide-neutral-100">
                      {filtered.map((rev) => {
                        const isVisible = rev.visible !== false;
                        const isToggling = togglingReviewId === rev.id;
                        const isDeleting = deletingReviewId === rev.id;

                        // Parse photos
                        let photos: string[] = [];
                        if (rev.imagesJson) {
                          try {
                            const parsed = JSON.parse(rev.imagesJson);
                            if (Array.isArray(parsed)) photos = parsed;
                          } catch {}
                        }

                        return (
                          <div
                            key={rev.id}
                            className={`p-6 transition-colors flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
                              isVisible ? 'bg-white' : 'bg-neutral-50/70'
                            }`}
                          >
                            {/* Left: Product & Review Info */}
                            <div className="flex items-start gap-4 flex-1">
                              {/* Product Thumbnail */}
                              <div className="w-16 h-20 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0">
                                {rev.productImageUrl ? (
                                  <img
                                    src={getFullImageUrl(rev.productImageUrl)}
                                    alt={rev.productName || 'Product'}
                                    className="w-full h-full object-cover"
                                    onError={handleImageError}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                    <Package className="w-6 h-6" />
                                  </div>
                                )}
                              </div>

                              {/* Review Content */}
                              <div className="space-y-2 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-semibold text-xs text-neutral-900">
                                    {rev.productName || `Product #${rev.productId}`}
                                  </span>
                                  {rev.productSku && (
                                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
                                      {rev.productSku}
                                    </span>
                                  )}
                                  <span className="text-[11px] text-neutral-300">•</span>
                                  <span className="text-[11px] text-neutral-500">
                                    by <strong className="text-neutral-800">{rev.reviewerName}</strong>
                                  </span>
                                  {rev.verifiedBuyer && (
                                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      Verified Buyer
                                    </span>
                                  )}
                                  <span className="text-[11px] text-neutral-400 font-mono">
                                    {new Date(rev.createdAt).toLocaleDateString(undefined, {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </div>

                                {/* Star Rating */}
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center text-amber-500">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3.5 h-3.5 ${
                                          star <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'
                                        }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-bold text-neutral-800">
                                    {rev.rating}.0 / 5.0
                                  </span>
                                  {rev.title && (
                                    <span className="text-xs font-semibold text-neutral-900 border-l border-neutral-200 pl-2">
                                      "{rev.title}"
                                    </span>
                                  )}
                                </div>

                                {/* Comment text */}
                                <p className="text-xs text-neutral-700 leading-relaxed max-w-2xl bg-neutral-50/80 p-3 rounded-xl border border-neutral-100">
                                  {rev.comment}
                                </p>

                                {/* Customer Attached Photos */}
                                {photos.length > 0 && (
                                  <div className="flex items-center gap-2 pt-1">
                                    <span className="text-[11px] font-semibold text-neutral-500">
                                      {photos.length} Photo{photos.length > 1 ? 's' : ''}:
                                    </span>
                                    <div className="flex items-center gap-2">
                                      {photos.map((photoUrl, pIdx) => (
                                        <button
                                          key={pIdx}
                                          onClick={() => setPreviewReviewPhoto(photoUrl)}
                                          className="w-10 h-10 rounded-lg overflow-hidden border border-neutral-200 hover:border-rose-500 transition group relative"
                                          title="Click to view photo full size"
                                        >
                                          <img
                                            src={photoUrl}
                                            alt={`Customer photo ${pIdx + 1}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition"
                                          />
                                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                            <Eye className="w-3.5 h-3.5 text-white" />
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Right: Moderation Controls & Visibility Toggle */}
                            <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-neutral-100">
                              {/* Visibility Toggle Control */}
                              <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-neutral-200 shadow-2xs">
                                <div className="text-right">
                                  <span
                                    className={`text-xs font-bold block ${
                                      isVisible ? 'text-emerald-700' : 'text-neutral-500'
                                    }`}
                                  >
                                    {isVisible ? 'Visible on PDP' : 'Hidden from PDP'}
                                  </span>
                                  <span className="text-[10px] text-neutral-400 block">
                                    {isVisible ? 'Live for shoppers' : 'Excluded from PDP'}
                                  </span>
                                </div>

                                {/* Interactive Switch Button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleReviewVisibility(rev)}
                                  disabled={isToggling}
                                  title={isVisible ? 'Click to hide review from PDP' : 'Click to show review on PDP'}
                                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                                    isVisible ? 'bg-emerald-600' : 'bg-neutral-300'
                                  }`}
                                >
                                  <span
                                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                                      isVisible ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                                  >
                                    {isToggling ? (
                                      <Loader2 className="w-3 h-3 animate-spin text-neutral-500" />
                                    ) : isVisible ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <EyeOff className="w-3 h-3 text-neutral-400" />
                                    )}
                                  </span>
                                </button>
                              </div>

                              {/* Delete Action Button */}
                              <button
                                onClick={() => handleDeleteReview(rev)}
                                disabled={isDeleting}
                                title="Permanently delete review"
                                className="p-2.5 rounded-xl border border-neutral-200 text-neutral-400 hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition disabled:opacity-50"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* TAB 6: RETURNS & EXCHANGES MANAGEMENT */}
        {activeTab === 'returns' && (
          <div className="bg-white dark:bg-[#16100C] rounded-3xl border border-neutral-200 dark:border-[#2C211A] overflow-hidden shadow-sm space-y-0">
            <div className="p-5 border-b border-neutral-100 dark:border-[#2C211A] flex justify-between items-center bg-[#FAF9F6] dark:bg-[#1A130E]">
              <div>
                <h3 className="font-serif text-lg font-semibold text-neutral-900 dark:text-[#EDE4DA]">
                  Customer Returns & Exchanges (Amazon / Flipkart Flow)
                </h3>
                <p className="text-xs text-neutral-500">
                  Track reverse pickups with XpressBees, inspect products at doorstep, issue instant refunds, or dispatch exchanges.
                </p>
              </div>
              <button
                onClick={fetchReturns}
                className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#251D18] flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingReturns ? 'animate-spin' : ''}`} />
                <span>Refresh Requests</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-400">
                <thead className="bg-[#FAF9F6] dark:bg-[#1A1410] text-[10px] text-neutral-500 uppercase tracking-wider border-b border-neutral-200 dark:border-[#2C211A]">
                  <tr>
                    <th className="py-3 px-4">Req # / Type</th>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Item & Reason</th>
                    <th className="py-3 px-4">Reverse Logistics (XpressBees)</th>
                    <th className="py-3 px-4">Inspection & Refund</th>
                    <th className="py-3 px-4 text-right">Doorstep Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-[#2C211A]">
                  {allReturns.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-neutral-400 font-serif">
                        No return or exchange requests logged yet.
                      </td>
                    </tr>
                  ) : (
                    allReturns.map((r) => (
                      <tr key={r.id} className="hover:bg-neutral-50/50 dark:hover:bg-[#1F1712] transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-neutral-900 dark:text-white block">#{r.id}</span>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider mt-1 ${
                            r.type === 'RETURN' ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-neutral-900 dark:text-white">
                          #{r.orderNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-neutral-900 dark:text-white">{r.originalProductName || 'Cosmetic item'}</p>
                          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-medium block">
                            Reason: {r.reasonCategory}
                          </span>
                          {r.detailedReason && (
                            <p className="text-[10px] text-neutral-500 italic max-w-xs truncate">{r.detailedReason}</p>
                          )}
                          {r.type === 'EXCHANGE' && r.exchangeProductName && (
                            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                              → Exchange for: {r.exchangeProductName}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-neutral-900 dark:text-neutral-200 block font-semibold">
                            {r.reverseAwbNumber || 'Pickup Pending'}
                          </span>
                          <span className="text-[10px] text-neutral-500 block">
                            Status: <strong className="text-amber-600">{r.courierStatus}</strong>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.inspectionStatus === 'VERIFIED_PASSED' ? 'bg-emerald-100 text-emerald-800' :
                            r.inspectionStatus === 'VERIFIED_FAILED' ? 'bg-red-100 text-red-800' : 'bg-neutral-100 text-neutral-700'
                          }`}>
                            {r.inspectionStatus}
                          </span>
                          {r.refundStatus === 'REFUNDED' && (
                            <span className="text-[10px] text-emerald-600 block font-semibold mt-0.5">
                              Refunded: ₹{r.refundAmount?.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {r.status === 'PICKUP_SCHEDULED' ? (
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                onClick={() => handleSimulateReturnOutForPickup(r.id)}
                                disabled={verifyingReturnId === r.id}
                                className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                                title="Simulate courier agent on the way to customer doorstep"
                              >
                                Out for Pickup
                              </button>
                              <button
                                onClick={() => handleVerifyPickup(r.id, true)}
                                disabled={verifyingReturnId === r.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                                title="Courier confirms product seal & initiates instant refund / exchange"
                              >
                                {verifyingReturnId === r.id ? 'Processing...' : (r.type === 'EXCHANGE' ? 'Verify & Dispatch' : 'Pass & Refund')}
                              </button>
                              <button
                                onClick={() => handleVerifyPickup(r.id, false)}
                                disabled={verifyingReturnId === r.id}
                                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition shadow-xs cursor-pointer"
                                title="Reject pickup if item opened or damaged by customer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : r.status === 'OUT_FOR_PICKUP' ? (
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold text-amber-600 mr-1 animate-pulse">Out for Pickup</span>
                              <button
                                onClick={() => handleVerifyPickup(r.id, true)}
                                disabled={verifyingReturnId === r.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition shadow-xs cursor-pointer"
                                title="Courier confirms product seal & completes doorstep handover"
                              >
                                {verifyingReturnId === r.id ? 'Processing...' : (r.type === 'EXCHANGE' ? 'Verify & Dispatch' : 'Pass & Refund')}
                              </button>
                              <button
                                onClick={() => handleVerifyPickup(r.id, false)}
                                disabled={verifyingReturnId === r.id}
                                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition shadow-xs cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-semibold text-neutral-400">
                              {r.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: FOOTER & LEGAL POLICIES CMS */}
        {activeTab === 'footer_policies' && (
          <AdminFooterPoliciesEditor onNavigate={onNavigate} showToast={showToast} />
        )}
      </main>

      {/* MODAL 0: PRODUCT STOCK AUDIT TRAIL & RESTOCK DIALOG */}
      {auditProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div
            className="fixed inset-0"
            onClick={() => setAuditProduct(null)}
          />
          <div className="relative bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 z-10">
            {/* Modal Header */}
            <div className="flex justify-between items-start px-6 py-4 border-b border-neutral-100 bg-[#FAF9F6] flex-shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={getFullImageUrl(auditProduct.imageUrl)}
                  alt={auditProduct.name}
                  className="w-14 h-16 rounded-xl object-cover border border-neutral-200 bg-neutral-100 flex-shrink-0"
                  onError={handleImageError}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-serif text-lg font-semibold text-neutral-900">{auditProduct.name}</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 font-bold">
                      {auditProduct.sku}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="text-neutral-500">Total In-Stock:</span>
                    <span className="font-bold text-sm text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
                      {auditProduct.stockQuantity} units
                    </span>
                    <span className="text-neutral-400">|</span>
                    <span className="text-neutral-600 font-medium">
                      Active Lots: {productBatches.filter(b => b.status === 'ACTIVE' && b.currentQuantity > 0).length}
                    </span>
                    {auditProduct.zohoItemId && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Zoho ID: {auditProduct.zohoItemId}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setAuditProduct(null)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0">
              {/* SECTION 1: PRODUCT BATCHES & STOCK LOTS */}
              <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-neutral-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-neutral-900 text-white flex items-center justify-center">
                      <Barcode className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider">
                        Inventory Batches & Stock Lots ({productBatches.length})
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Tracked by unique batch IDs. Orders automatically deduct from oldest active batch (FIFO).
                      </p>
                    </div>
                  </div>
                  {productBatches.length > 2 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search Batch ID, supplier..."
                        value={batchSearchQuery}
                        onChange={(e) => setBatchSearchQuery(e.target.value)}
                        className="pl-7 pr-3 py-1 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                    </div>
                  )}
                </div>

                {loadingBatches ? (
                  <div className="p-6 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                    <span>Loading batches...</span>
                  </div>
                ) : productBatches.length === 0 ? (
                  <div className="p-6 text-center text-neutral-500 text-xs bg-white rounded-xl border border-neutral-200">
                    No batches found for this product. Use the action box below to receive your first batch.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                    {productBatches
                      .filter((b) => {
                        if (!batchSearchQuery.trim()) return true;
                        const q = batchSearchQuery.toLowerCase();
                        return (
                          b.batchNumber.toLowerCase().includes(q) ||
                          (b.supplierName && b.supplierName.toLowerCase().includes(q)) ||
                          (b.notes && b.notes.toLowerCase().includes(q))
                        );
                      })
                      .map((batch) => {
                        const isDepleted = batch.currentQuantity === 0;
                        const isSelected = selectedBatchNumber === batch.batchNumber;
                        return (
                          <div
                            key={batch.id}
                            className={`p-3.5 rounded-xl border transition ${
                              isSelected
                                ? 'bg-amber-50/60 border-amber-400 shadow-sm'
                                : isDepleted
                                ? 'bg-neutral-100/60 border-neutral-200 opacity-75'
                                : 'bg-white border-neutral-200 hover:border-neutral-300'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-xs text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                  {batch.batchNumber}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                    batch.status === 'ACTIVE'
                                      ? batch.currentQuantity > 0
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-neutral-200 text-neutral-600'
                                      : batch.status === 'DEPLETED'
                                      ? 'bg-neutral-200 text-neutral-600'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {batch.currentQuantity === 0 ? 'DEPLETED' : batch.status}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedBatchNumber(batch.batchNumber);
                                  setBatchActionTab('adjustBatch');
                                }}
                                className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200 transition"
                              >
                                Adjust / Defective
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-neutral-100 text-center">
                              <div className="bg-neutral-50 p-1.5 rounded-lg">
                                <span className="block text-[10px] text-neutral-400">In Stock</span>
                                <strong className={`text-xs ${batch.currentQuantity > 0 ? 'text-emerald-700' : 'text-neutral-400'}`}>
                                  {batch.currentQuantity} units
                                </strong>
                              </div>
                              <div className="bg-neutral-50 p-1.5 rounded-lg">
                                <span className="block text-[10px] text-neutral-400">Initial Lot</span>
                                <span className="text-xs font-semibold text-neutral-700">{batch.initialQuantity} units</span>
                              </div>
                              <div className="bg-neutral-50 p-1.5 rounded-lg">
                                <span className="block text-[10px] text-neutral-400">Defectives</span>
                                <strong className={`text-xs ${batch.defectiveQuantity > 0 ? 'text-rose-700 font-bold' : 'text-neutral-400'}`}>
                                  {batch.defectiveQuantity} units
                                </strong>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-1 mt-2 text-[10px] text-neutral-400">
                              <span>Exp: {batch.expiryDate || 'N/A'}</span>
                              <span>Supplier: {batch.supplierName || 'Standard'}</span>
                              <span>Added: {new Date(batch.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* SECTION 2: BATCH ACTIONS (TABS: RECEIVE NEW BATCH | ADJUST SPECIFIC BATCH | QUICK OVERRIDE) */}
              <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                <div className="flex items-center border-b border-neutral-200 bg-[#FAF9F6] p-1.5 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setBatchActionTab('newBatch')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
                      batchActionTab === 'newBatch'
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Receive New Batch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchActionTab('adjustBatch')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
                      batchActionTab === 'adjustBatch'
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    <span>Adjust Specific Batch (Defective / Recount)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchActionTab('quickAdjust')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition ${
                      batchActionTab === 'quickAdjust'
                        ? 'bg-neutral-900 text-white shadow-sm'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Direct Stock Override</span>
                  </button>
                </div>

                <div className="p-5">
                  {/* TAB 1: RECEIVE NEW BATCH */}
                  {batchActionTab === 'newBatch' && (
                    <form onSubmit={handleCreateNewBatch} className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Box className="w-4 h-4 text-emerald-600" />
                          <span>Intake New Stock Batch</span>
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Adds new physical units under a unique Batch ID. Total product stock will increase by this quantity.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Units to Receive (+) *
                          </label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={newBatchQty}
                            onChange={(e) => setNewBatchQty(parseInt(e.target.value) || 0)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] font-bold text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Custom Batch ID (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Leave blank to auto-generate unique ID"
                            value={newBatchCustomId}
                            onChange={(e) => setNewBatchCustomId(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] font-mono text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 2027-12 or Dec 2027"
                            value={newBatchExpiry}
                            onChange={(e) => setNewBatchExpiry(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Supplier / Manufacturer
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Aura Luxe Labs India"
                            value={newBatchSupplier}
                            onChange={(e) => setNewBatchSupplier(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Intake Notes / PO Reference
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. PO #8921 - Fresh factory batch"
                            value={newBatchNotes}
                            onChange={(e) => setNewBatchNotes(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="submit"
                            disabled={submittingNewBatch || newBatchQty <= 0}
                            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
                          >
                            {submittingNewBatch ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Plus className="w-3.5 h-3.5" />
                            )}
                            <span>+ Receive Batch</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-neutral-600 flex items-center gap-2 border-t border-neutral-100">
                        <span className="font-medium text-neutral-400">Calculation Preview:</span>
                        <span>
                          Current Total ({auditProduct.stockQuantity}) + New Batch ({newBatchQty}) ={' '}
                          <strong className="text-emerald-700 font-bold">{auditProduct.stockQuantity + newBatchQty} units</strong>
                        </span>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: ADJUST SPECIFIC BATCH (DEFECTIVES / RECOUNT) */}
                  {batchActionTab === 'adjustBatch' && (
                    <form onSubmit={handleAdjustSpecificBatch} className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-xs text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span>Adjust Specific Batch Lot</span>
                        </h4>
                        <p className="text-[11px] text-neutral-500 mt-0.5">
                          Write off damaged/defective bottles from a particular batch or reconcile its physical count.
                        </p>
                      </div>

                      {/* Batch Selection Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Select Active Batch *
                          </label>
                          <select
                            value={selectedBatchNumber}
                            onChange={(e) => setSelectedBatchNumber(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] font-mono text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                          >
                            <option value="">-- Choose Batch to Adjust --</option>
                            {productBatches.map((b) => (
                              <option key={b.id} value={b.batchNumber}>
                                {b.batchNumber} — {b.currentQuantity} in-stock {b.defectiveQuantity > 0 ? `(${b.defectiveQuantity} def)` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Or Type / Paste Unique Batch ID
                          </label>
                          <input
                            type="text"
                            placeholder="Type unique ID e.g. BATCH-20261111-..."
                            value={selectedBatchNumber}
                            onChange={(e) => setSelectedBatchNumber(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] font-mono text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                          />
                        </div>
                      </div>

                      {/* Adjustment Type Selection */}
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 mb-1.5">
                          Select Adjustment Type *
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setBatchAdjustType('DEFECTIVE')}
                            className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                              batchAdjustType === 'DEFECTIVE'
                                ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-sm'
                                : 'bg-[#FAF9F6] border-neutral-200 text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${batchAdjustType === 'DEFECTIVE' ? 'border-rose-600 bg-rose-600' : 'border-neutral-300'}`}>
                              {batchAdjustType === 'DEFECTIVE' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <strong className="block text-xs font-semibold">Write-Off Defectives (-)</strong>
                              <span className="text-[10px] text-neutral-500">Record damaged/broken units from this batch</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBatchAdjustType('CORRECTION')}
                            className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                              batchAdjustType === 'CORRECTION'
                                ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm'
                                : 'bg-[#FAF9F6] border-neutral-200 text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${batchAdjustType === 'CORRECTION' ? 'border-amber-600 bg-amber-600' : 'border-neutral-300'}`}>
                              {batchAdjustType === 'CORRECTION' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <strong className="block text-xs font-semibold">Physical Count Recount</strong>
                              <span className="text-[10px] text-neutral-500">Set exact remaining units for this batch</span>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setBatchAdjustType('ADD_TO_BATCH')}
                            className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                              batchAdjustType === 'ADD_TO_BATCH'
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-sm'
                                : 'bg-[#FAF9F6] border-neutral-200 text-neutral-700 hover:border-neutral-300'
                            }`}
                          >
                            <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${batchAdjustType === 'ADD_TO_BATCH' ? 'border-emerald-600 bg-emerald-600' : 'border-neutral-300'}`}>
                              {batchAdjustType === 'ADD_TO_BATCH' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <strong className="block text-xs font-semibold">Add Units to Batch (+)</strong>
                              <span className="text-[10px] text-neutral-500">Add units directly into this batch ID</span>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Quantity, Reason & Submit */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            {batchAdjustType === 'DEFECTIVE'
                              ? 'Defective Units (-)'
                              : batchAdjustType === 'CORRECTION'
                              ? 'New Exact Count'
                              : 'Units to Add (+)'}
                          </label>
                          <input
                            type="number"
                            required
                            min={batchAdjustType === 'CORRECTION' ? '0' : '1'}
                            value={batchAdjustQty}
                            onChange={(e) => setBatchAdjustQty(parseInt(e.target.value) || 0)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] font-bold text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Reason / Defect Description *
                          </label>
                          <input
                            type="text"
                            placeholder={
                              batchAdjustType === 'DEFECTIVE'
                                ? 'e.g. Broken dropper seal, leakage during unboxing'
                                : 'e.g. Physical inventory recount'
                            }
                            value={batchAdjustReason}
                            onChange={(e) => setBatchAdjustReason(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="submit"
                            disabled={submittingBatchAdjust || !selectedBatchNumber.trim()}
                            className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
                          >
                            {submittingBatchAdjust ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>Apply Adjustment</span>
                          </button>
                        </div>
                      </div>

                      {/* Dynamic Preview */}
                      {selectedBatchNumber && (
                        <div className="pt-2 text-xs text-neutral-600 flex items-center gap-2 border-t border-neutral-100">
                          <span className="font-medium text-neutral-400">Action Preview:</span>
                          {batchAdjustType === 'DEFECTIVE' ? (
                            <span>
                              Will deduct <strong className="text-rose-700 font-bold">{batchAdjustQty} defective units</strong> from batch{' '}
                              <strong className="font-mono">{selectedBatchNumber}</strong>. Total stock will reduce by {batchAdjustQty}.
                            </span>
                          ) : batchAdjustType === 'CORRECTION' ? (
                            <span>
                              Will set batch <strong className="font-mono">{selectedBatchNumber}</strong> stock to{' '}
                              <strong className="text-amber-700 font-bold">{batchAdjustQty} units</strong> and recalculate total stock.
                            </span>
                          ) : (
                            <span>
                              Will add <strong className="text-emerald-700 font-bold">+{batchAdjustQty} units</strong> to batch{' '}
                              <strong className="font-mono">{selectedBatchNumber}</strong>.
                            </span>
                          )}
                        </div>
                      )}
                    </form>
                  )}

                  {/* TAB 3: DIRECT STOCK OVERRIDE */}
                  {batchActionTab === 'quickAdjust' && (
                    <form onSubmit={handlePerformStockAdjust} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-xs text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-700" />
                            <span>Direct Stock Balance Override</span>
                          </h4>
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Directly adjust total product stock count.
                          </p>
                        </div>
                        <div className="flex items-center bg-[#FAF9F6] border border-neutral-200 rounded-lg p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustMode('add');
                              setAdjustQuantity(10);
                            }}
                            className={`px-3 py-1 rounded-md font-semibold transition ${
                              adjustMode === 'add' ? 'bg-emerald-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                            }`}
                          >
                            + Add Stock
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustMode('set');
                              setAdjustQuantity(auditProduct.stockQuantity);
                            }}
                            className={`px-3 py-1 rounded-md font-semibold transition ${
                              adjustMode === 'set' ? 'bg-[#1E1611] text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-900'
                            }`}
                          >
                            Set Exact Count
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-4">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            {adjustMode === 'add' ? 'Units to Add (+)' : 'Physical Inventory Count'}
                          </label>
                          <input
                            type="number"
                            required
                            min={adjustMode === 'add' ? '1' : '0'}
                            value={adjustQuantity}
                            onChange={(e) => setAdjustQuantity(parseInt(e.target.value) || 0)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] font-bold text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-semibold text-neutral-700 mb-1">
                            Reason / Audit Note
                          </label>
                          <input
                            type="text"
                            placeholder={adjustMode === 'add' ? 'e.g. Received new shipment' : 'e.g. Physical inventory recount'}
                            value={adjustNotes}
                            onChange={(e) => setAdjustNotes(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <button
                            type="submit"
                            disabled={submittingAdjust}
                            className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow disabled:opacity-50"
                          >
                            {submittingAdjust ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Save className="w-3.5 h-3.5" />
                            )}
                            <span>Apply & Record</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-neutral-600 flex items-center gap-2 border-t border-neutral-100">
                        <span className="font-medium text-neutral-400">Calculation Preview:</span>
                        {adjustMode === 'add' ? (
                          <span>
                            Current ({auditProduct.stockQuantity}) + Added ({adjustQuantity}) ={' '}
                            <strong className="text-emerald-700 font-bold">{auditProduct.stockQuantity + adjustQuantity} units</strong>
                          </span>
                        ) : (
                          <span>
                            Current ({auditProduct.stockQuantity}) → New ({adjustQuantity}) ={' '}
                            <strong className={adjustQuantity - auditProduct.stockQuantity >= 0 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                              Difference: {adjustQuantity - auditProduct.stockQuantity >= 0 ? `+${adjustQuantity - auditProduct.stockQuantity}` : adjustQuantity - auditProduct.stockQuantity} units
                            </strong>
                          </span>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* SECTION 3: PRODUCT AUDIT TIMELINE TABLE */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-xs text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-neutral-500" />
                    <span>Stock Movement Timeline & Audit History ({auditHistory.length} events)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => openStockAudit(auditProduct)}
                    disabled={loadingHistory}
                    className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingHistory ? 'animate-spin' : ''}`} />
                    <span>Refresh Log</span>
                  </button>
                </div>

                {loadingHistory ? (
                  <div className="p-8 text-center text-neutral-400 text-xs flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
                    <span>Loading audit log...</span>
                  </div>
                ) : auditHistory.length === 0 ? (
                  <div className="p-8 text-center text-neutral-400 text-xs rounded-2xl bg-neutral-50 border border-neutral-100">
                    No stock movement history recorded for this product yet.
                  </div>
                ) : (
                  <div className="max-h-64 overflow-y-auto overflow-x-auto rounded-2xl border border-neutral-200">
                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead className="bg-[#FAF9F6] text-neutral-400 uppercase tracking-wider text-[10px] font-bold sticky top-0 border-b border-neutral-100">
                        <tr>
                          <th className="py-2.5 px-3">Date & Time</th>
                          <th className="py-2.5 px-3">Event</th>
                          <th className="py-2.5 px-3">Delta</th>
                          <th className="py-2.5 px-3">Balance</th>
                          <th className="py-2.5 px-3">Batch / Reference</th>
                          <th className="py-2.5 px-3">Performed By</th>
                          <th className="py-2.5 px-3">Reason / Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {auditHistory.map((m) => {
                          const isPositive = m.quantityDelta > 0;
                          return (
                            <tr key={m.id} className="hover:bg-neutral-50/50">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                                {new Date(m.createdAt).toLocaleString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                    m.movementType === 'RESTOCK'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : m.movementType === 'ORDER_SALE'
                                      ? 'bg-rose-100 text-rose-800'
                                      : m.movementType === 'INITIAL'
                                      ? 'bg-purple-100 text-purple-800'
                                      : m.movementType === 'DEFECTIVE_WRITE_OFF'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {m.movementType}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-bold font-mono">
                                <span className={isPositive ? 'text-emerald-700' : 'text-rose-700'}>
                                  {isPositive ? `+${m.quantityDelta}` : m.quantityDelta}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap text-neutral-600">
                                <span className="text-neutral-400">{m.previousStock}</span>
                                <span className="mx-1 text-neutral-300">→</span>
                                <strong className="text-neutral-900">{m.newStock}</strong>
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px] text-neutral-700">
                                {m.referenceId ? (
                                  <span className="bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                                    {m.referenceId}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-neutral-600 truncate max-w-[120px]" title={m.performedBy}>
                                {m.performedBy || 'System'}
                              </td>
                              <td className="py-2.5 px-3 text-neutral-500 truncate max-w-[160px]" title={m.notes}>
                                {m.notes || '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Pinned */}
            <div className="flex justify-end px-6 py-4 border-t border-neutral-100 bg-[#FAF9F6] flex-shrink-0">
              <button
                type="button"
                onClick={() => setAuditProduct(null)}
                className="px-5 py-2.5 rounded-xl bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-semibold text-xs transition"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD NEW PRODUCT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div
            className="fixed inset-0"
            onClick={() => setIsAddModalOpen(false)}
          />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 z-10">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-[#FAF9F6] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-900">Post New Cosmetic Product</h3>
                  <p className="text-xs text-neutral-400">Publishes item to the storefront and syncs immediately to Zoho Inventory.</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateProduct} noValidate className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-neutral-700 block mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Velvet Tint Lip & Cheek Oil"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={newProduct.brand}
                    onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">SubCategory</label>
                  <select
                    value={newProduct.subCategory}
                    onChange={(e) => setNewProduct({ ...newProduct, subCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="Serums & Treatments">Serums & Treatments</option>
                    <option value="Moisturizers">Moisturizers</option>
                    <option value="Lip Care & Makeup">Lip Care & Makeup</option>
                    <option value="Sun Care">Sun Care</option>
                    <option value="Face Makeup">Face Makeup</option>
                    <option value="Cleansers">Cleansers</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={newProduct.originalPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, originalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProduct.stockQuantity}
                    onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">SKU (Leave blank to auto-generate)</label>
                  <input
                    type="text"
                    placeholder="e.g. AL-OIL-009"
                    value={newProduct.sku}
                    onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Volume / Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 30 ml or 50 g"
                    value={newProduct.volume}
                    onChange={(e) => setNewProduct({ ...newProduct, volume: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Skin Type Suitability</label>
                  <select
                    value={newProduct.skinType}
                    onChange={(e) => setNewProduct({ ...newProduct, skinType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="All Skin Types">All Skin Types</option>
                    <option value="Dry & Sensitive">Dry & Sensitive</option>
                    <option value="Oily / Acne-Prone">Oily / Acne-Prone</option>
                    <option value="Mature & Normal">Mature & Normal</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-semibold text-neutral-800 text-xs uppercase tracking-wider block">
                        Product Imagery & Gallery (Multi-Upload)
                      </label>
                      <p className="text-[11px] text-neutral-500">
                        Upload high-res images. System automatically creates high-definition PDP views (1200px) and fast PLP cards (600px).
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-rose-600" />
                      Auto-Resizing
                    </span>
                  </div>

                  {/* Multi-File Upload Dropzone */}
                  <div className="border-2 border-dashed border-rose-300/80 hover:border-rose-500 rounded-2xl p-4 bg-rose-50/20 text-center transition flex flex-col items-center justify-center gap-2">
                    <input
                      type="file"
                      id="add-product-images-input"
                      multiple
                      accept="image/*"
                      onChange={handleUploadForAdd}
                      disabled={uploadingAddImages}
                      className="hidden"
                    />
                    <label
                      htmlFor="add-product-images-input"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition ${
                        uploadingAddImages
                          ? 'bg-neutral-200 text-neutral-500 cursor-wait'
                          : 'bg-rose-700 hover:bg-rose-800 text-white'
                      }`}
                    >
                      {uploadingAddImages ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading & Resizing Images...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload High-Res Pictures (Multiple Supported)</span>
                        </>
                      )}
                    </label>
                    <p className="text-[10px] text-neutral-400">
                      Supports JPG, PNG, WEBP. Upload multiple pictures for the product detail gallery.
                    </p>
                  </div>

                  {/* Gallery Pictures Preview & Primary Selector */}
                  {getGalleryArray(newProduct.galleryImages, newProduct.imageUrl).length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-neutral-600">
                        Selected Gallery Images ({getGalleryArray(newProduct.galleryImages, newProduct.imageUrl).length}):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {getGalleryArray(newProduct.galleryImages, newProduct.imageUrl).map((imgUrl, idx) => {
                          const isPrimary =
                            newProduct.imageUrl === imgUrl ||
                            newProduct.imageUrl === imgUrl.replace('_pdp.jpg', '_plp.jpg') ||
                            newProduct.imageUrl.replace('_plp.jpg', '_pdp.jpg') === imgUrl;
                          return (
                            <div
                              key={idx}
                              className={`relative rounded-xl overflow-hidden border-2 bg-neutral-50 p-1 group flex flex-col items-center justify-between transition ${
                                isPrimary ? 'border-rose-600 shadow-sm' : 'border-neutral-200 hover:border-neutral-400'
                              }`}
                            >
                              <div className="w-full aspect-square rounded-lg overflow-hidden relative">
                                <img
                                  src={getFullImageUrl(imgUrl)}
                                  alt={`preview-${idx}`}
                                  className="w-full h-full object-cover"
                                  onError={handleImageError}
                                />
                                {isPrimary && (
                                  <div className="absolute top-1 left-1 bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-white text-white" />
                                    <span>Primary (PLP)</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeAddImage(imgUrl)}
                                  title="Remove image"
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-80 hover:opacity-100 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="w-full mt-1.5 pt-1 border-t border-neutral-100 flex items-center justify-center">
                                {!isPrimary ? (
                                  <button
                                    type="button"
                                    onClick={() => setAddPrimary(imgUrl)}
                                    className="w-full py-1 text-[10px] font-medium text-neutral-600 hover:text-rose-700 hover:bg-rose-50 rounded transition text-center"
                                  >
                                    Set as Primary
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-rose-600 font-semibold py-1">
                                    Main Storefront Card
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Manual URL / Quick Presets Option */}
                  <details className="text-xs text-neutral-500 pt-1 group">
                    <summary className="cursor-pointer font-medium hover:text-neutral-800 transition select-none flex items-center gap-1">
                      <span>Or enter custom image URL / choose preset</span>
                    </summary>
                    <div className="mt-2 space-y-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={newProduct.imageUrl}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewProduct({
                              ...newProduct,
                              imageUrl: val,
                              galleryImages: newProduct.galleryImages ? `${newProduct.galleryImages},${val}` : val,
                            });
                          }}
                          className="flex-1 p-2 rounded-lg border border-neutral-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-neutral-400 font-medium">Quick Presets:</span>
                        {imagePresets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              setNewProduct({
                                ...newProduct,
                                imageUrl: preset.url,
                                galleryImages: preset.url,
                              })
                            }
                            className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 hover:bg-rose-50 hover:text-rose-700 text-[10px] font-medium transition"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-neutral-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short product overview..."
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Key Ingredients</label>
                  <input
                    type="text"
                    placeholder="e.g. Squalane, Vitamin C, Rose Extract"
                    value={newProduct.keyIngredients}
                    onChange={(e) => setNewProduct({ ...newProduct, keyIngredients: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">How To Use</label>
                  <input
                    type="text"
                    placeholder="e.g. Apply 2 drops morning and night"
                    value={newProduct.howToUse}
                    onChange={(e) => setNewProduct({ ...newProduct, howToUse: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

              {/* Action Buttons Pinned Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-[#FAF9F6] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProduct}
                  className="px-6 py-2.5 rounded-xl bg-rose-700 text-white font-semibold hover:bg-rose-800 transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {submittingProduct ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Posting to Store & Zoho...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Publish Product</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT EXISTING PRODUCT */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-hidden">
          <div
            className="fixed inset-0"
            onClick={() => {
              setIsEditModalOpen(false);
              setEditingProduct(null);
            }}
          />
          <div className="relative bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-neutral-200 overflow-hidden my-auto animate-in zoom-in-95 duration-200 z-10">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-100 bg-[#FAF9F6] flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-neutral-100 text-neutral-800 flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-neutral-900">Edit Product: {editingProduct.name}</h3>
                  <p className="text-xs text-neutral-400">
                    Modifications will update the storefront and synchronize with Zoho Inventory {editingProduct.zohoItemId ? `(ID: ${editingProduct.zohoItemId})` : ''}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingProduct(null);
                }}
                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-full hover:bg-neutral-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleUpdateProduct} noValidate className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-neutral-700 block mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingProduct.brand || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">SubCategory</label>
                  <select
                    value={editingProduct.subCategory || 'Serums & Treatments'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subCategory: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="Serums & Treatments">Serums & Treatments</option>
                    <option value="Moisturizers">Moisturizers</option>
                    <option value="Lip Care & Makeup">Lip Care & Makeup</option>
                    <option value="Sun Care">Sun Care</option>
                    <option value="Face Makeup">Face Makeup</option>
                    <option value="Cleansers">Cleansers</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500 font-semibold text-rose-800"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Original Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={editingProduct.originalPrice || editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Stock Quantity *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.stockQuantity}
                    onChange={(e) => setEditingProduct({ ...editingProduct, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500 font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">SKU</label>
                  <input
                    type="text"
                    disabled
                    value={editingProduct.sku || ''}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-neutral-100 font-mono text-neutral-500 cursor-not-allowed"
                    title="SKU cannot be changed once mapped"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Volume / Size</label>
                  <input
                    type="text"
                    value={editingProduct.volume || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, volume: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Skin Type Suitability</label>
                  <select
                    value={editingProduct.skinType || 'All Skin Types'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, skinType: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="All Skin Types">All Skin Types</option>
                    <option value="Dry & Sensitive">Dry & Sensitive</option>
                    <option value="Oily / Acne-Prone">Oily / Acne-Prone</option>
                    <option value="Mature & Normal">Mature & Normal</option>
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-semibold text-neutral-800 text-xs uppercase tracking-wider block">
                        Product Imagery & Gallery (Multi-Upload)
                      </label>
                      <p className="text-[11px] text-neutral-500">
                        Upload high-res images. System automatically generates PDP high-definition views (1200px) and fast PLP cards (600px).
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      Auto-Resizing
                    </span>
                  </div>

                  {/* Multi-File Upload Dropzone */}
                  <div className="border-2 border-dashed border-neutral-300 hover:border-emerald-600 rounded-2xl p-4 bg-neutral-50/50 text-center transition flex flex-col items-center justify-center gap-2">
                    <input
                      type="file"
                      id="edit-product-images-input"
                      multiple
                      accept="image/*"
                      onChange={handleUploadForEdit}
                      disabled={uploadingEditImages}
                      className="hidden"
                    />
                    <label
                      htmlFor="edit-product-images-input"
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm cursor-pointer transition ${
                        uploadingEditImages
                          ? 'bg-neutral-200 text-neutral-500 cursor-wait'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white'
                      }`}
                    >
                      {uploadingEditImages ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading & Resizing Images...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload High-Res Pictures (Multiple Supported)</span>
                        </>
                      )}
                    </label>
                    <p className="text-[10px] text-neutral-400">
                      Supports JPG, PNG, WEBP. Upload multiple pictures to build the PDP gallery carousel.
                    </p>
                  </div>

                  {/* Gallery Pictures Preview & Primary Selector */}
                  {getGalleryArray(editingProduct.galleryImages, editingProduct.imageUrl).length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-neutral-600">
                        Active Gallery Images ({getGalleryArray(editingProduct.galleryImages, editingProduct.imageUrl).length}):
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {getGalleryArray(editingProduct.galleryImages, editingProduct.imageUrl).map((imgUrl, idx) => {
                          const isPrimary =
                            editingProduct.imageUrl === imgUrl ||
                            editingProduct.imageUrl === imgUrl.replace('_pdp.jpg', '_plp.jpg') ||
                            editingProduct.imageUrl.replace('_plp.jpg', '_pdp.jpg') === imgUrl;
                          return (
                            <div
                              key={idx}
                              className={`relative rounded-xl overflow-hidden border-2 bg-neutral-50 p-1 group flex flex-col items-center justify-between transition ${
                                isPrimary ? 'border-emerald-600 shadow-sm' : 'border-neutral-200 hover:border-neutral-400'
                              }`}
                            >
                              <div className="w-full aspect-square rounded-lg overflow-hidden relative">
                                <img
                                  src={getFullImageUrl(imgUrl)}
                                  alt={`preview-${idx}`}
                                  className="w-full h-full object-cover"
                                  onError={handleImageError}
                                />
                                {isPrimary && (
                                  <div className="absolute top-1 left-1 bg-emerald-700 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                                    <Star className="w-2.5 h-2.5 fill-white text-white" />
                                    <span>Primary (PLP)</span>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeEditImage(imgUrl)}
                                  title="Remove image"
                                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center opacity-80 hover:opacity-100 transition"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="w-full mt-1.5 pt-1 border-t border-neutral-100 flex items-center justify-center">
                                {!isPrimary ? (
                                  <button
                                    type="button"
                                    onClick={() => setEditPrimary(imgUrl)}
                                    className="w-full py-1 text-[10px] font-medium text-neutral-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition text-center"
                                  >
                                    Set as Primary
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-700 font-semibold py-1">
                                    Main Storefront Card
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Manual URL / Quick Presets Option */}
                  <details className="text-xs text-neutral-500 pt-1 group">
                    <summary className="cursor-pointer font-medium hover:text-neutral-800 transition select-none flex items-center gap-1">
                      <span>Or enter custom image URL / choose preset</span>
                    </summary>
                    <div className="mt-2 space-y-2 p-3 rounded-xl bg-neutral-50 border border-neutral-200">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="https://..."
                          value={editingProduct.imageUrl || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingProduct({
                              ...editingProduct,
                              imageUrl: val,
                              galleryImages: editingProduct.galleryImages ? `${editingProduct.galleryImages},${val}` : val,
                            });
                          }}
                          className="flex-1 p-2 rounded-lg border border-neutral-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] text-neutral-400 font-medium">Quick Presets:</span>
                        {imagePresets.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              setEditingProduct({
                                ...editingProduct,
                                imageUrl: preset.url,
                                galleryImages: preset.url,
                              })
                            }
                            className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] font-medium transition"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-neutral-700 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Key Ingredients</label>
                  <input
                    type="text"
                    value={editingProduct.keyIngredients || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, keyIngredients: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">How To Use</label>
                  <input
                    type="text"
                    value={editingProduct.howToUse || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, howToUse: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-neutral-200 bg-[#FAF9F6] focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>

              {/* Action Buttons Pinned Footer */}
              <div className="flex justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-[#FAF9F6] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 text-neutral-700 font-semibold hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold hover:bg-emerald-800 transition flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {submittingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE XPRESSBEES TRACKING MODAL */}
      {selectedTrackingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 text-sm">
                    Xpressbees Live Shipment Tracker
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-500">
                    AWB: {selectedTrackingOrder.awbNumber}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTrackingOrder(null);
                  setTrackingData(null);
                }}
                className="w-7 h-7 rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingTracking ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                <span className="text-xs">Querying Xpressbees status...</span>
              </div>
            ) : trackingData ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Current Status</span>
                    <p className="font-bold text-neutral-900 text-sm">{trackingData.currentStatus || 'IN TRANSIT'}</p>
                  </div>
                  {trackingData.expectedDelivery && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Est. Delivery</span>
                      <p className="font-semibold text-neutral-800 text-xs">{trackingData.expectedDelivery}</p>
                    </div>
                  )}
                </div>

                {/* Milestone Progression */}
                <div className="space-y-3 pl-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Transit Milestones</p>
                  <div className="space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-neutral-200">
                    {trackingData.milestones?.map((m: any, idx: number) => (
                      <div key={idx} className="relative flex items-start gap-3 text-xs">
                        <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center z-10 shrink-0 shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900">{m.title}</p>
                          <p className="text-[11px] text-neutral-500">{m.location} • {m.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <a
                    href={`/api/shipping/labels/${selectedTrackingOrder.awbNumber}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-700 text-xs font-semibold hover:bg-neutral-200 transition flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Shipping Label</span>
                  </a>
                </div>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 py-6 text-center">Tracking data is currently unavailable.</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: CUSTOMER REVIEW PHOTO FULL RESOLUTION PREVIEW */}
      {previewReviewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewReviewPhoto(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] bg-white rounded-3xl overflow-hidden shadow-2xl p-2 border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewReviewPhoto(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewReviewPhoto}
              alt="Customer photo attachment"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* MODAL 6: XPRESSBEES LOGISTICS SIMULATOR (Requirement 2 & 5) */}
      {selectedSimulateOrder && (
        <XpressBeesSimulatorModal
          order={selectedSimulateOrder}
          isOpen={true}
          onClose={() => setSelectedSimulateOrder(null)}
          onOrderUpdated={(updated) => {
            setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
            setSelectedSimulateOrder(updated);
          }}
        />
      )}
    </div>
  );
};

export default AdminPage;
