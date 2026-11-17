package com.daivatech.ecommerce.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "order_return_exchanges")
public class OrderReturnExchange {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private String orderNumber;

    private Long userId;

    @Column(nullable = false)
    private String type; // "RETURN" or "EXCHANGE"

    @Column(nullable = false)
    private String reasonCategory; // e.g. "PRODUCT_DAMAGED", "WRONG_ITEM", "QUALITY_ISSUE", "SIZE_SHADE_ISSUE", "SKIN_SENSITIVITY", "MISTAKEN_ORDER", "OTHER"

    @Column(length = 1000)
    private String detailedReason;

    private String proofImageUrl;

    // Exchange specific
    private Long originalProductId;
    private String originalProductName;
    private Long exchangeProductId;
    private String exchangeProductName;

    // Status: "REQUESTED", "PICKUP_SCHEDULED", "OUT_FOR_PICKUP", "PICKED_UP_EXAMINED", "COMPLETED", "REJECTED"
    private String status = "REQUESTED";

    // Reverse Logistics (XpressBees)
    private String reverseAwbNumber;
    private String reverseTrackingUrl;
    private String courierStatus = "PENDING"; // "PENDING", "PICKUP_SCHEDULED", "PICKED_UP", "RTO_IN_TRANSIT", "RETURN_DELIVERED"
    private String inspectionStatus = "PENDING"; // "PENDING", "VERIFIED_PASSED", "VERIFIED_FAILED"
    private String inspectionNotes;

    // Refund details (if Return)
    private BigDecimal refundAmount = BigDecimal.ZERO;
    private String refundId;
    private String refundStatus = "NONE"; // "NONE", "INITIATED", "REFUNDED"

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt = LocalDateTime.now();

    public OrderReturnExchange() {}

    public OrderReturnExchange(Long orderId, String orderNumber, Long userId, String type, String reasonCategory, String detailedReason) {
        this.orderId = orderId;
        this.orderNumber = orderNumber;
        this.userId = userId;
        this.type = type;
        this.reasonCategory = reasonCategory;
        this.detailedReason = detailedReason;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }

    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getReasonCategory() { return reasonCategory; }
    public void setReasonCategory(String reasonCategory) { this.reasonCategory = reasonCategory; }

    public String getDetailedReason() { return detailedReason; }
    public void setDetailedReason(String detailedReason) { this.detailedReason = detailedReason; }

    public String getProofImageUrl() { return proofImageUrl; }
    public void setProofImageUrl(String proofImageUrl) { this.proofImageUrl = proofImageUrl; }

    public Long getOriginalProductId() { return originalProductId; }
    public void setOriginalProductId(Long originalProductId) { this.originalProductId = originalProductId; }

    public String getOriginalProductName() { return originalProductName; }
    public void setOriginalProductName(String originalProductName) { this.originalProductName = originalProductName; }

    public Long getExchangeProductId() { return exchangeProductId; }
    public void setExchangeProductId(Long exchangeProductId) { this.exchangeProductId = exchangeProductId; }

    public String getExchangeProductName() { return exchangeProductName; }
    public void setExchangeProductName(String exchangeProductName) { this.exchangeProductName = exchangeProductName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReverseAwbNumber() { return reverseAwbNumber; }
    public void setReverseAwbNumber(String reverseAwbNumber) { this.reverseAwbNumber = reverseAwbNumber; }

    public String getReverseTrackingUrl() { return reverseTrackingUrl; }
    public void setReverseTrackingUrl(String reverseTrackingUrl) { this.reverseTrackingUrl = reverseTrackingUrl; }

    public String getCourierStatus() { return courierStatus; }
    public void setCourierStatus(String courierStatus) { this.courierStatus = courierStatus; }

    public String getInspectionStatus() { return inspectionStatus; }
    public void setInspectionStatus(String inspectionStatus) { this.inspectionStatus = inspectionStatus; }

    public String getInspectionNotes() { return inspectionNotes; }
    public void setInspectionNotes(String inspectionNotes) { this.inspectionNotes = inspectionNotes; }

    public BigDecimal getRefundAmount() { return refundAmount; }
    public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }

    public String getRefundId() { return refundId; }
    public void setRefundId(String refundId) { this.refundId = refundId; }

    public String getRefundStatus() { return refundStatus; }
    public void setRefundStatus(String refundStatus) { this.refundStatus = refundStatus; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
