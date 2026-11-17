export interface Product {
  id: number;
  name: string;
  slug: string;
  brand: string;
  category: string;
  subCategory: string;
  description: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  stockQuantity: number;
  sku: string;
  zohoItemId?: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  galleryImages?: string;
  volume: string;
  skinType: string;
  keyIngredients: string;
  howToUse: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selected?: boolean;
  fromWishlist?: boolean;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  token?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface UserAddress {
  id: number;
  userId: number;
  addressType: 'HOME' | 'OFFICE' | 'OTHER';
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  zohoItemId?: string;
  imageUrl?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface CustomerOrder {
  id: number;
  orderNumber: string;
  userId?: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  refundId?: string;
  refundStatus?: string;
  refundAmount?: number;
  refundReason?: string;
  courierName?: string;
  awbNumber?: string;
  shippingLabelUrl?: string;
  trackingUrl?: string;
  courierStatus?: string;
  deliveryFailureReason?: string;
  deliveredAt?: string;
  dispatchedAt?: string;
  zohoCustomerId?: string;
  zohoSalesOrderId?: string;
  zohoSalesOrderNumber?: string;
  zohoSyncStatus: string;
  zohoErrorMessage?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface OrderReturnExchange {
  id: number;
  orderId: number;
  orderNumber: string;
  userId?: number;
  type: 'RETURN' | 'EXCHANGE';
  reasonCategory: string;
  detailedReason: string;
  proofImageUrl?: string;
  originalProductId?: number;
  originalProductName?: string;
  exchangeProductId?: number;
  exchangeProductName?: string;
  status: string; // "REQUESTED", "PICKUP_SCHEDULED", "OUT_FOR_PICKUP", "PICKED_UP_EXAMINED", "COMPLETED", "REJECTED", "EXCHANGE_DISPATCHED"
  reverseAwbNumber?: string;
  reverseTrackingUrl?: string;
  courierStatus?: string;
  inspectionStatus?: string;
  inspectionNotes?: string;
  refundAmount?: number;
  refundId?: string;
  refundStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ZohoStatus {
  isConfigured: boolean;
  isConnected: boolean;
  statusMessage: string;
}

export interface UploadedImageInfo {
  originalFileName: string;
  pdpUrl: string;
  plpUrl: string;
  pdpWidth: number;
  pdpHeight: number;
  plpWidth: number;
  plpHeight: number;
  fileSize: number;
}

export interface StockMovement {
  id: number;
  productId: number;
  productName: string;
  productSku?: string;
  movementType: 'RESTOCK' | 'ORDER_SALE' | 'ORDER_CANCEL' | 'ADJUSTMENT' | 'INITIAL' | string;
  quantityDelta: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  performedBy?: string;
  notes?: string;
  createdAt: string;
}

export interface ProductBatch {
  id: number;
  batchNumber: string;
  productId: number;
  productName?: string;
  productSku?: string;
  initialQuantity: number;
  currentQuantity: number;
  defectiveQuantity: number;
  costPrice?: number;
  expiryDate?: string;
  supplierName?: string;
  notes?: string;
  status: 'ACTIVE' | 'DEPLETED' | 'RECALLED' | string;
  createdAt: string;
  updatedAt?: string;
}

export interface RazorpayOrderResponse {
  orderId: string;
  amount: number;
  amountRupees: number;
  currency: string;
  keyId: string;
  companyName: string;
  isMockMode: boolean;
  receipt?: string;
}

export interface PaymentVerificationResponse {
  valid: boolean;
  message?: string;
  error?: string;
}

export interface MockPaymentSimulationResponse {
  orderId: string;
  paymentId: string;
  signature: string;
  status: string;
}

export interface ShippingServiceability {
  serviceable: boolean;
  pincode: string;
  originPincode?: string;
  courier?: string;
  isCodAvailable?: boolean;
  isPrepaidAvailable?: boolean;
  estimatedDays?: number;
  isMock?: boolean;
  message?: string;
}

export interface ShipmentMilestone {
  status: string;
  title: string;
  time: string;
  location: string;
}

export interface ShipmentTracking {
  awb: string;
  courierName?: string;
  currentStatus: string;
  expectedDelivery?: string;
  milestones?: ShipmentMilestone[];
  trackingUrl?: string;
  message?: string;
}

export interface ProductReview {
  id: number;
  productId: number;
  userId?: number;
  reviewerName: string;
  rating: number;
  title?: string;
  comment: string;
  imagesJson?: string;
  verifiedBuyer: boolean;
  visible?: boolean;
  productName?: string;
  productSku?: string;
  productImageUrl?: string;
  productPrice?: number;
  createdAt: string;
}

export interface ReviewDistribution {
  fiveStar: number;
  fourStar: number;
  threeStar: number;
  twoStar: number;
  oneStar: number;
}

export interface ReviewSummaryResponse {
  productId: number;
  totalReviews: number;
  averageRating: number;
  reviews: ProductReview[];
  customerPhotos: string[];
  distribution: ReviewDistribution;
}

export interface ReviewEligibilityResponse {
  eligible: boolean;
  hasPurchased?: boolean;
  alreadyReviewed?: boolean;
  reason?: string;
}

export interface SubmitReviewPayload {
  productId: number;
  userId?: number;
  reviewerName: string;
  rating: number;
  title: string;
  comment: string;
  imageUrls?: string[];
}

export interface UserBrowsingHistoryItem {
  id?: number;
  product: Product;
  viewedAt: string;
}



