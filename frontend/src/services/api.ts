import {
  Product,
  CartItem,
  CustomerOrder,
  ZohoStatus,
  User,
  UploadedImageInfo,
  StockMovement,
  ProductBatch,
  RazorpayOrderResponse,
  PaymentVerificationResponse,
  MockPaymentSimulationResponse,
  UserBrowsingHistoryItem,
} from '../types';
import { getFullImageUrl } from '../utils/image';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const normalizeProduct = (product: Product): Product => {
  if (!product) return product;
  const imageUrl = getFullImageUrl(product.imageUrl);
  let galleryImages = product.galleryImages;
  if (galleryImages) {
    galleryImages = galleryImages
      .split(',')
      .map((img) => getFullImageUrl(img.trim()))
      .filter(Boolean)
      .join(',');
  } else if (imageUrl) {
    galleryImages = imageUrl;
  }
  let variants = product.variants;
  if (!variants && product.variantsJson) {
    try {
      const parsed = JSON.parse(product.variantsJson);
      if (Array.isArray(parsed)) {
        variants = parsed;
      }
    } catch (_) {}
  }
  return {
    ...product,
    imageUrl,
    galleryImages,
    variants,
  };
};

export const api = {
  // Products
  async getProducts(params?: {
    subCategory?: string;
    skinType?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
  }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.subCategory && params.subCategory !== 'All') {
      try {
        query.append('subCategory', decodeURIComponent(params.subCategory));
      } catch {
        query.append('subCategory', params.subCategory);
      }
    }
    if (params?.skinType && params.skinType !== 'All' && params.skinType !== 'All Skin Types') {
      try {
        query.append('skinType', decodeURIComponent(params.skinType));
      } catch {
        query.append('skinType', params.skinType);
      }
    }
    if (params?.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
    if (params?.sortBy) query.append('sortBy', params.sortBy);

    const res = await fetch(`${BASE_URL}/products?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data: Product[] = await res.json();
    return data.map(normalizeProduct);
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const res = await fetch(`${BASE_URL}/products/slug/${slug}`);
    if (!res.ok) throw new Error('Product not found');
    const data: Product = await res.json();
    return normalizeProduct(data);
  },

  async searchProducts(query: string): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/products/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    const data: Product[] = await res.json();
    return data.map(normalizeProduct);
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/products/featured`);
    if (!res.ok) throw new Error('Failed to fetch featured products');
    const data: Product[] = await res.json();
    return data.map(normalizeProduct);
  },

  async getCategories(): Promise<{ mainCategory: string; subCategories: string[]; skinTypes: string[] }> {
    const res = await fetch(`${BASE_URL}/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
  },

  // Orders
  async placeOrder(payload: any): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to place order');
    }
    return res.json();
  },

  async getOrderByNumber(orderNumber: string): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/orders/${orderNumber}`);
    if (!res.ok) throw new Error('Order not found');
    return res.json();
  },

  async getUserOrders(userId: number): Promise<CustomerOrder[]> {
    const res = await fetch(`${BASE_URL}/orders/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch user orders');
    return res.json();
  },

  // Auth
  async login(payload: { email: string; password: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(payload: { fullName: string; email: string; password: string; phone?: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  async getProfile(id: number): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/profile/${id}`);
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  async updateProfile(id: number, payload: Partial<User>): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/profile/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  // User Addresses
  async getUserAddresses(userId: number): Promise<import('../types').UserAddress[]> {
    const res = await fetch(`${BASE_URL}/users/${userId}/addresses`);
    if (!res.ok) throw new Error('Failed to fetch addresses');
    return res.json();
  },

  async createUserAddress(userId: number, address: Partial<import('../types').UserAddress>): Promise<import('../types').UserAddress> {
    const res = await fetch(`${BASE_URL}/users/${userId}/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create address');
    }
    return res.json();
  },

  async updateUserAddress(userId: number, addressId: number, address: Partial<import('../types').UserAddress>): Promise<import('../types').UserAddress> {
    const res = await fetch(`${BASE_URL}/users/${userId}/addresses/${addressId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update address');
    }
    return res.json();
  },

  async deleteUserAddress(userId: number, addressId: number): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`${BASE_URL}/users/${userId}/addresses/${addressId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete address');
    }
    return res.json();
  },

  async setDefaultUserAddress(userId: number, addressId: number): Promise<import('../types').UserAddress> {
    const res = await fetch(`${BASE_URL}/users/${userId}/addresses/${addressId}/default`, {
      method: 'PUT',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to set default address');
    }
    return res.json();
  },

  // Admin & Zoho
  async getAdminProducts(): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/admin/products`);
    if (!res.ok) throw new Error('Failed to fetch admin products');
    const data: Product[] = await res.json();
    return data.map(normalizeProduct);
  },

  async createAdminProduct(product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${BASE_URL}/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      let errorMsg = 'Failed to create product';
      try {
        const err = await res.json();
        errorMsg = err.error || err.message || errorMsg;
      } catch {
        const text = await res.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }
    const data: Product = await res.json();
    return normalizeProduct(data);
  },

  async updateAdminProduct(id: number, product: Partial<Product>): Promise<Product> {
    const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      let errorMsg = 'Failed to update product';
      try {
        const err = await res.json();
        errorMsg = err.error || err.message || errorMsg;
      } catch {
        const text = await res.text();
        if (text) errorMsg = text;
      }
      throw new Error(errorMsg);
    }
    const data: Product = await res.json();
    return normalizeProduct(data);
  },

  async updateAdminStock(id: number, stockQuantity: number): Promise<Product> {
    const res = await fetch(`${BASE_URL}/admin/products/${id}/stock`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stockQuantity }),
    });
    if (!res.ok) throw new Error('Failed to update stock');
    const data: Product = await res.json();
    return normalizeProduct(data);
  },

  async getAdminOrders(): Promise<CustomerOrder[]> {
    const res = await fetch(`${BASE_URL}/admin/orders`);
    if (!res.ok) throw new Error('Failed to fetch admin orders');
    return res.json();
  },

  async clearAllOrders(): Promise<{ success: boolean; clearedOrdersCount: number; zohoCleanedCount: number; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/orders/clear-all`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to clear all orders');
    }
    return res.json();
  },

  async retryZohoSync(orderId: number): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/retry-zoho`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to retry Zoho sync');
    return res.json();
  },

  async getZohoStatus(): Promise<ZohoStatus> {
    const res = await fetch(`${BASE_URL}/admin/zoho/status`);
    if (!res.ok) throw new Error('Failed to fetch Zoho status');
    return res.json();
  },

  async syncZohoCatalog(): Promise<{ success: boolean; message: string; syncedCount: number }> {
    const res = await fetch(`${BASE_URL}/admin/zoho/sync`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Zoho sync failed');
    }
    return res.json();
  },

  async syncSingleProduct(id: number): Promise<{ success: boolean; zohoItemId: string; message: string }> {
    const res = await fetch(`${BASE_URL}/admin/products/${id}/sync-zoho`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to sync product to Zoho');
    }
    return res.json();
  },

  async pushProductsToZoho(): Promise<{ success: boolean; message: string; pushedCount: number }> {
    const res = await fetch(`${BASE_URL}/admin/zoho/push`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Pushing to Zoho failed');
    }
    return res.json();
  },

  async uploadProductImages(files: File[]): Promise<UploadedImageInfo[]> {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    const res = await fetch(`${BASE_URL}/admin/products/upload-images`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Image upload failed');
    }
    const data = await res.json();
    const list: UploadedImageInfo[] = data.images || [];
    return list.map((item) => ({
      ...item,
      pdpUrl: getFullImageUrl(item.pdpUrl),
      plpUrl: getFullImageUrl(item.plpUrl),
    }));
  },

  async uploadSingleProductImage(file: File): Promise<UploadedImageInfo> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/admin/products/upload-image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Image upload failed');
    }
    const data: UploadedImageInfo = await res.json();
    return {
      ...data,
      pdpUrl: getFullImageUrl(data.pdpUrl),
      plpUrl: getFullImageUrl(data.plpUrl),
    };
  },

  // Stock Movement & Audit Trail
  async getProductStockHistory(productId: number): Promise<StockMovement[]> {
    const res = await fetch(`${BASE_URL}/admin/products/${productId}/stock-history`);
    if (!res.ok) throw new Error('Failed to fetch product stock history');
    return res.json();
  },

  async getAllStockHistory(): Promise<StockMovement[]> {
    const res = await fetch(`${BASE_URL}/admin/stock-history`);
    if (!res.ok) throw new Error('Failed to fetch stock movement history');
    return res.json();
  },

  async adjustProductStock(
    productId: number,
    payload: {
      delta?: number;
      targetStock?: number;
      isAdditive: boolean;
      notes?: string;
      performedBy?: string;
      movementType?: string;
    }
  ): Promise<{ success: boolean; product: Product; movement: StockMovement }> {
    const res = await fetch(`${BASE_URL}/admin/products/${productId}/adjust-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to adjust stock');
    }
    return res.json();
  },

  // Batch-Level Inventory
  async getProductBatches(productId: number): Promise<ProductBatch[]> {
    const res = await fetch(`${BASE_URL}/admin/products/${productId}/batches`);
    if (!res.ok) throw new Error('Failed to fetch product batches');
    return res.json();
  },

  async getBatchByNumber(batchNumber: string): Promise<ProductBatch> {
    const res = await fetch(`${BASE_URL}/admin/batches/${encodeURIComponent(batchNumber)}`);
    if (!res.ok) throw new Error('Batch not found: ' + batchNumber);
    return res.json();
  },

  async searchBatches(query?: string): Promise<ProductBatch[]> {
    const res = await fetch(`${BASE_URL}/admin/batches/search?q=${encodeURIComponent(query || '')}`);
    if (!res.ok) throw new Error('Failed to search batches');
    return res.json();
  },

  async createProductBatch(
    productId: number,
    payload: {
      quantity: number;
      customBatchNumber?: string;
      costPrice?: number;
      expiryDate?: string;
      supplierName?: string;
      notes?: string;
      performedBy?: string;
    }
  ): Promise<{ success: boolean; batch: ProductBatch; product: Product }> {
    const res = await fetch(`${BASE_URL}/admin/products/${productId}/batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create batch');
    }
    return res.json();
  },

  async adjustBatch(
    batchNumber: string,
    payload: {
      adjustmentType: 'DEFECTIVE' | 'CORRECTION' | 'ADD_TO_BATCH';
      quantity: number;
      reason?: string;
      performedBy?: string;
    }
  ): Promise<{ success: boolean; batch: ProductBatch; product: Product; movement: StockMovement }> {
    const res = await fetch(`${BASE_URL}/admin/batches/${encodeURIComponent(batchNumber)}/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to adjust batch');
    }
    return res.json();
  },

  // Razorpay Payment APIs
  async getPaymentConfig(): Promise<{ keyId: string; currency: string; companyName: string; isMockMode: boolean }> {
    const res = await fetch(`${BASE_URL}/payments/config`);
    if (!res.ok) {
      throw new Error('Failed to fetch payment configuration');
    }
    return res.json();
  },

  async createRazorpayOrder(amount: number, receipt?: string): Promise<RazorpayOrderResponse> {
    const res = await fetch(`${BASE_URL}/payments/create-order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, receipt }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to initialize payment order');
    }
    return res.json();
  },

  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<PaymentVerificationResponse> {
    const res = await fetch(`${BASE_URL}/payments/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, paymentId, signature }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Cryptographic payment verification failed');
    }
    return res.json();
  },

  async simulateMockPayment(orderId: string): Promise<MockPaymentSimulationResponse> {
    const res = await fetch(`${BASE_URL}/payments/mock-simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Mock payment simulation failed');
    }
    return res.json();
  },

  // Razorpay Active Polling & Refund
  async checkOrderStatus(orderId: string): Promise<{ paid: boolean; paymentId?: string; status?: string; method?: string }> {
    const res = await fetch(`${BASE_URL}/payments/order-status/${encodeURIComponent(orderId)}`);
    if (!res.ok) {
      return { paid: false, status: 'error' };
    }
    return res.json();
  },

  async refundOrder(orderId: number, reason?: string): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Customer requested refund' }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to refund order');
    }
    return res.json();
  },

  // Requirement 2: Deliver order simulation (syncs DB, Zoho, Razorpay)
  async deliverOrder(orderId: number): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to mark order delivered');
    }
    return res.json();
  },

  // Requirement 3 & 4: Cancel order (Pre-dispatch or In-transit)
  async cancelOrder(orderId: number, reason?: string): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reason || 'Cancelled by customer' }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel order');
    }
    return res.json();
  },

  // Requirement 5: Doorstep NDR / Delivery Failure Emulation
  async failDoorstepDelivery(orderId: number, reasonCode: string, notes?: string): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/fail-delivery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCode, notes: notes || '' }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to simulate doorstep delivery failure');
    }
    return res.json();
  },

  async retryOrderDelivery(orderId: number): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/admin/orders/${orderId}/retry-delivery`, {
      method: 'POST',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to retry delivery');
    }
    return res.json();
  },

  async updateOrderAddress(
    orderId: number,
    address: { addressLine?: string; city?: string; state?: string; pincode?: string }
  ): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/address`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(address),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update delivery address');
    }
    return res.json();
  },

  // Requirement 6 & 7: Return and Exchange APIs
  async requestReturnOrExchange(orderId: number, data: {
    userId?: number;
    type: 'RETURN' | 'EXCHANGE';
    reasonCategory: string;
    detailedReason: string;
    proofImageUrl?: string;
    originalProductId?: number;
    exchangeProductId?: number;
    bankAccountNumber?: string;
    bankIfscCode?: string;
    bankAccountHolderName?: string;
    bankName?: string;
  }): Promise<import('../types').OrderReturnExchange> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/return-exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit return/exchange request');
    }
    return res.json();
  },

  async getOrderReturnExchanges(orderId: number): Promise<import('../types').OrderReturnExchange[]> {
    const res = await fetch(`${BASE_URL}/orders/${orderId}/return-exchange`);
    if (!res.ok) return [];
    return res.json();
  },

  async getAllReturnExchanges(): Promise<import('../types').OrderReturnExchange[]> {
    const res = await fetch(`${BASE_URL}/admin/returns`);
    if (!res.ok) return [];
    return res.json();
  },

  async verifyPickupReturn(returnId: number, passed: boolean, inspectionNotes?: string): Promise<import('../types').OrderReturnExchange> {
    const res = await fetch(`${BASE_URL}/admin/returns/${returnId}/verify-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passed, inspectionNotes: inspectionNotes || '' }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to verify reverse pickup');
    }
    return res.json();
  },

  async simulateReturnStatus(returnId: number, status: string): Promise<import('../types').OrderReturnExchange> {
    const res = await fetch(`${BASE_URL}/admin/returns/${returnId}/simulate-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to simulate return status');
    }
    return res.json();
  },

  async failReturnPickup(returnId: number, reasonCode: string, notes?: string): Promise<import('../types').OrderReturnExchange> {
    const res = await fetch(`${BASE_URL}/admin/returns/${returnId}/fail-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCode, notes }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to record return pickup failure');
    }
    return res.json();
  },

  async retryReturnPickup(returnId: number): Promise<import('../types').OrderReturnExchange> {
    const res = await fetch(`${BASE_URL}/admin/returns/${returnId}/retry-pickup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to retry return pickup');
    }
    return res.json();
  },

  async cancelReturnRequest(returnId: number): Promise<import('../types').OrderReturnExchange> {
    const res = await fetch(`${BASE_URL}/orders/returns/${returnId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to cancel return request');
    }
    return res.json();
  },

  async trackReturnShipment(returnId: number): Promise<import('../types').ReturnExchangeTrackingInfo> {
    const res = await fetch(`${BASE_URL}/shipping/returns/${returnId}/track`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch reverse tracking');
    }
    return res.json();
  },

  // Google OAuth Auth API
  async googleAuth(data: { email: string; fullName?: string; googleSub?: string; profilePictureUrl?: string }): Promise<import('../types').User> {
    try {
      const res = await fetch(`${BASE_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
      // If server returned 404 (endpoint not yet deployed to cloud), fall back to graceful local session
      if (res.status === 404) {
        console.warn('Backend /auth/google endpoint returned 404 (pending cloud deployment). Using client-side session fallback.');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Authentication failed (${res.status})`);
      }
    } catch (err: any) {
      if (!err.message?.includes('404') && !err.message?.includes('Failed to fetch')) {
        throw err;
      }
    }

    // Resilient fallback for preview/testing prior to cloud backend deploy
    const fallbackUser: import('../types').User = {
      id: Date.now(),
      fullName: data.fullName || 'Google Member',
      email: data.email,
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      role: 'CUSTOMER',
      authProvider: 'GOOGLE',
      profilePictureUrl: data.profilePictureUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      googleSub: data.googleSub || `sub_${Date.now()}`,
    };
    sessionStorage.setItem('aura_customer_session', JSON.stringify(fallbackUser));
    return fallbackUser;
  },

  // Apple OAuth Auth API
  async appleAuth(data: { email: string; fullName?: string; appleSub?: string; identityToken?: string }): Promise<import('../types').User> {
    try {
      const res = await fetch(`${BASE_URL}/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        return await res.json();
      }
      if (res.status === 404) {
        console.warn('Backend /auth/apple endpoint returned 404. Using client-side session fallback.');
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Apple authentication failed (${res.status})`);
      }
    } catch (err: any) {
      if (!err.message?.includes('404') && !err.message?.includes('Failed to fetch')) {
        throw err;
      }
    }

    const fallbackUser: import('../types').User = {
      id: Date.now(),
      fullName: data.fullName || 'Apple Member',
      email: data.email,
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      role: 'CUSTOMER',
      authProvider: 'APPLE',
      appleSub: data.appleSub || `apple_sub_${Date.now()}`,
    };
    sessionStorage.setItem('aura_customer_session', JSON.stringify(fallbackUser));
    return fallbackUser;
  },

  // Xpressbees Logistics APIs
  async checkPincodeServiceability(pincode: string): Promise<import('../types').ShippingServiceability> {
    const res = await fetch(`${BASE_URL}/shipping/serviceability?pincode=${encodeURIComponent(pincode)}`);
    if (!res.ok) {
      throw new Error('Failed to verify delivery pincode');
    }
    return res.json();
  },

  async manifestShipment(orderId: number): Promise<CustomerOrder> {
    const res = await fetch(`${BASE_URL}/shipping/orders/${orderId}/manifest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to dispatch shipment with Xpressbees');
    }
    return res.json();
  },

  async trackOrderShipment(orderId: number): Promise<import('../types').ShipmentTracking> {
    const res = await fetch(`${BASE_URL}/shipping/orders/${orderId}/track`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Tracking details not found');
    }
    return res.json();
  },

  async trackAwbShipment(awb: string): Promise<import('../types').ShipmentTracking> {
    const res = await fetch(`${BASE_URL}/shipping/track/${encodeURIComponent(awb)}`);
    if (!res.ok) {
      throw new Error('Tracking details not found');
    }
    return res.json();
  },

  // Customer Reviews & Ratings APIs
  async getProductReviews(productId: number): Promise<import('../types').ReviewSummaryResponse> {
    const res = await fetch(`${BASE_URL}/reviews/product/${productId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch product reviews');
    }
    return res.json();
  },

  async checkReviewEligibility(userId: number | undefined, productId: number): Promise<import('../types').ReviewEligibilityResponse> {
    const params = new URLSearchParams({ productId: productId.toString() });
    if (userId) {
      params.append('userId', userId.toString());
    }
    const res = await fetch(`${BASE_URL}/reviews/eligibility?${params.toString()}`);
    if (!res.ok) {
      return { eligible: false, reason: 'Could not verify purchase status' };
    }
    return res.json();
  },

  async getUserReviews(userId: number): Promise<import('../types').ProductReview[]> {
    const res = await fetch(`${BASE_URL}/reviews/user/${userId}`);
    if (!res.ok) {
      return [];
    }
    return res.json();
  },

  async uploadReviewImage(file: File): Promise<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${BASE_URL}/reviews/upload-image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to upload review image');
    }
    const data = await res.json();
    return { imageUrl: getFullImageUrl(data.imageUrl) };
  },

  async submitReview(payload: import('../types').SubmitReviewPayload): Promise<import('../types').ProductReview> {
    const res = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit review');
    }
    return res.json();
  },

  // Admin Reviews Moderation APIs
  async getAdminReviews(): Promise<import('../types').ProductReview[]> {
    const res = await fetch(`${BASE_URL}/reviews/admin/all`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch reviews for admin');
    }
    return res.json();
  },

  async toggleReviewVisibility(reviewId: number): Promise<import('../types').ProductReview> {
    const res = await fetch(`${BASE_URL}/reviews/admin/${reviewId}/toggle-visibility`, {
      method: 'PUT',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to toggle review visibility');
    }
    return res.json();
  },

  async deleteReview(reviewId: number): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/reviews/admin/${reviewId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete review');
    }
    return res.json();
  },

  // Customer Wishlist APIs
  async getUserWishlist(userId: number): Promise<Product[]> {
    const res = await fetch(`${BASE_URL}/wishlist/${userId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch wishlist');
    }
    return res.json();
  },

  async toggleWishlist(userId: number, productId: number): Promise<{ action: string; productId: number; inWishlist: boolean }> {
    const res = await fetch(`${BASE_URL}/wishlist/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update wishlist');
    }
    return res.json();
  },

  async removeFromWishlist(userId: number, productId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/wishlist/${userId}/${productId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to remove item from wishlist');
    }
  },

  async clearUserWishlist(userId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/wishlist/${userId}/clear`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to clear wishlist');
    }
  },

  // Customer Browsing History APIs
  async getUserHistory(userId: number): Promise<UserBrowsingHistoryItem[]> {
    const res = await fetch(`${BASE_URL}/history/${userId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch browsing history');
    }
    return res.json();
  },

  async recordProductView(userId: number, productId: number): Promise<UserBrowsingHistoryItem> {
    const res = await fetch(`${BASE_URL}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productId }),
    });
    if (!res.ok) {
      throw new Error('Failed to record product view');
    }
    return res.json();
  },

  async removeFromHistory(userId: number, productId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/history/${userId}/${productId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to remove item from history');
    }
  },

  async clearUserHistory(userId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/history/${userId}/clear`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to clear browsing history');
    }
  },

  // Customer Cart APIs
  async getUserCart(userId: number): Promise<CartItem[]> {
    const res = await fetch(`${BASE_URL}/cart/${userId}`);
    if (!res.ok) {
      throw new Error('Failed to fetch user cart');
    }
    return res.json();
  },

  async addToCart(
    userId: number,
    productId: number,
    quantity: number = 1,
    selected: boolean = true,
    fromWishlist: boolean = false
  ): Promise<CartItem> {
    const res = await fetch(`${BASE_URL}/cart/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, selected, fromWishlist }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add item to cart');
    }
    return res.json();
  },

  async updateCartItem(
    userId: number,
    productId: number,
    payload: { quantity?: number; selected?: boolean }
  ): Promise<CartItem> {
    const res = await fetch(`${BASE_URL}/cart/${userId}/item/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update cart item');
    }
    return res.json();
  },

  async selectAllCartItems(userId: number, selected: boolean): Promise<CartItem[]> {
    const res = await fetch(`${BASE_URL}/cart/${userId}/select-all`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selected }),
    });
    if (!res.ok) {
      throw new Error('Failed to update cart items selection');
    }
    return res.json();
  },

  async removeFromCart(userId: number, productId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/cart/${userId}/item/${productId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to remove item from cart');
    }
  },

  async clearUserCart(userId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/cart/${userId}/clear`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to clear cart');
    }
  },

  async clearSelectedCartItems(userId: number): Promise<void> {
    const res = await fetch(`${BASE_URL}/cart/${userId}/clear-selected`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error('Failed to clear selected cart items');
    }
  },

  async mergeGuestCart(userId: number, guestItems: any[]): Promise<CartItem[]> {
    const res = await fetch(`${BASE_URL}/cart/${userId}/merge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guestItems),
    });
    if (!res.ok) {
      throw new Error('Failed to merge guest cart');
    }
    return res.json();
  },
};
