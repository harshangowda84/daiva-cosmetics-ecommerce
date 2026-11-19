package com.daivatech.ecommerce.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_orders")
public class CustomerOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String orderNumber;

    private Long userId;

    @Column(nullable = false)
    private String customerName;

    @Column(nullable = false)
    private String customerEmail;

    @Column(nullable = false)
    private String customerPhone;

    // Shipping address
    private String addressLine;
    private String city;
    private String state;
    private String pincode;

    @Column(nullable = false)
    private BigDecimal subtotal;

    private BigDecimal shippingFee = BigDecimal.ZERO;

    private BigDecimal totalAmount;

    private String paymentMethod = "COD"; // "COD" or "RAZORPAY" / "ONLINE"

    private String paymentStatus = "PENDING"; // "PENDING", "PAID"

    private String orderStatus = "CONFIRMED"; // "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"

    // Razorpay Payment tracking fields
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;

    // Refund tracking
    private String refundId;
    private String refundStatus = "NONE"; // "NONE", "REFUND_INITIATED", "REFUNDED", "FAILED"
    private BigDecimal refundAmount = BigDecimal.ZERO;
    private String refundReason;

    // Xpressbees Logistics & Shipping fields
    private String courierName; // "Xpressbees"
    private String awbNumber;
    private String shippingLabelUrl;
    private String trackingUrl;
    private String courierStatus = "PENDING"; // "PENDING", "MANIFESTED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED", "UNDELIVERED_ATTEMPT", "RTO_INITIATED", "RTO_IN_TRANSIT", "RTO_DELIVERED", "NDR_PENDING"
    private String deliveryFailureReason; // e.g. "CUSTOMER_UNREACHABLE", "DOOR_STEP_REJECTED", "WRONG_ADDRESS", "ORDER_CANCELLED_IN_TRANSIT", "PREMISES_LOCKED", "ADDRESS_INCOMPLETE"
    private Integer deliveryAttempts = 1;
    private LocalDateTime deliveredAt;
    private LocalDateTime dispatchedAt;

    // Zoho Integration fields
    private String zohoCustomerId;
    private String zohoSalesOrderId;
    private String zohoSalesOrderNumber;
    private String zohoSyncStatus = "PENDING"; // "SYNCED", "PENDING", "FAILED"
    private String zohoErrorMessage;

    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    public CustomerOrder() {}

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }

    public String getAddressLine() { return addressLine; }
    public void setAddressLine(String addressLine) { this.addressLine = addressLine; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public BigDecimal getShippingFee() { return shippingFee; }
    public void setShippingFee(BigDecimal shippingFee) { this.shippingFee = shippingFee; }

    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }

    public String getRazorpayPaymentId() { return razorpayPaymentId; }
    public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }

    public String getRazorpaySignature() { return razorpaySignature; }
    public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }

    public String getRefundId() { return refundId; }
    public void setRefundId(String refundId) { this.refundId = refundId; }

    public String getRefundStatus() { return refundStatus; }
    public void setRefundStatus(String refundStatus) { this.refundStatus = refundStatus; }

    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }

    public String getRefundReason() { return refundReason; }
    public void setRefundReason(String refundReason) { this.refundReason = refundReason; }

    public String getCourierName() { return courierName; }
    public void setCourierName(String courierName) { this.courierName = courierName; }

    public String getAwbNumber() { return awbNumber; }
    public void setAwbNumber(String awbNumber) { this.awbNumber = awbNumber; }

    public String getShippingLabelUrl() { return shippingLabelUrl; }
    public void setShippingLabelUrl(String shippingLabelUrl) { this.shippingLabelUrl = shippingLabelUrl; }

    public String getTrackingUrl() { return trackingUrl; }
    public void setTrackingUrl(String trackingUrl) { this.trackingUrl = trackingUrl; }

    public String getCourierStatus() { return courierStatus; }
    public void setCourierStatus(String courierStatus) { this.courierStatus = courierStatus; }

    public String getDeliveryFailureReason() { return deliveryFailureReason; }
    public void setDeliveryFailureReason(String deliveryFailureReason) { this.deliveryFailureReason = deliveryFailureReason; }

    public Integer getDeliveryAttempts() { return deliveryAttempts != null ? deliveryAttempts : 1; }
    public void setDeliveryAttempts(Integer deliveryAttempts) { this.deliveryAttempts = deliveryAttempts; }

    public LocalDateTime getDeliveredAt() { return deliveredAt; }
    public void setDeliveredAt(LocalDateTime deliveredAt) { this.deliveredAt = deliveredAt; }

    public LocalDateTime getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(LocalDateTime dispatchedAt) { this.dispatchedAt = dispatchedAt; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public String getZohoCustomerId() { return zohoCustomerId; }
    public void setZohoCustomerId(String zohoCustomerId) { this.zohoCustomerId = zohoCustomerId; }

    public String getZohoSalesOrderId() { return zohoSalesOrderId; }
    public void setZohoSalesOrderId(String zohoSalesOrderId) { this.zohoSalesOrderId = zohoSalesOrderId; }

    public String getZohoSalesOrderNumber() { return zohoSalesOrderNumber; }
    public void setZohoSalesOrderNumber(String zohoSalesOrderNumber) { this.zohoSalesOrderNumber = zohoSalesOrderNumber; }

    public String getZohoSyncStatus() { return zohoSyncStatus; }
    public void setZohoSyncStatus(String zohoSyncStatus) { this.zohoSyncStatus = zohoSyncStatus; }

    public String getZohoErrorMessage() { return zohoErrorMessage; }
    public void setZohoErrorMessage(String zohoErrorMessage) { this.zohoErrorMessage = zohoErrorMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<OrderItem> getItems() { return items; }
    public void setItems(List<OrderItem> items) { this.items = items; }
}
