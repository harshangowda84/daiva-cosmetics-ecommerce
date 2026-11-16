package com.daivatech.ecommerce.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_batches")
public class ProductBatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String batchNumber; // e.g. BATCH-20261111-8421 or custom LOT code

    @Column(nullable = false)
    private Long productId;

    private String productName;

    private String productSku;

    @Column(nullable = false)
    private Integer initialQuantity;

    @Column(nullable = false)
    private Integer currentQuantity;

    @Column(nullable = false)
    private Integer defectiveQuantity = 0;

    private BigDecimal costPrice;

    private String expiryDate;

    private String supplierName;

    @Column(length = 1000)
    private String notes;

    @Column(nullable = false)
    private String status = "ACTIVE"; // ACTIVE, DEPLETED, RECALLED

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    public ProductBatch() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public ProductBatch(String batchNumber, Long productId, String productName, String productSku,
                        Integer initialQuantity, Integer currentQuantity, Integer defectiveQuantity,
                        BigDecimal costPrice, String expiryDate, String supplierName, String notes) {
        this.batchNumber = batchNumber;
        this.productId = productId;
        this.productName = productName;
        this.productSku = productSku;
        this.initialQuantity = initialQuantity;
        this.currentQuantity = currentQuantity;
        this.defectiveQuantity = defectiveQuantity != null ? defectiveQuantity : 0;
        this.costPrice = costPrice;
        this.expiryDate = expiryDate;
        this.supplierName = supplierName;
        this.notes = notes;
        this.status = (this.currentQuantity <= 0) ? "DEPLETED" : "ACTIVE";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        if (this.currentQuantity <= 0) {
            this.status = "DEPLETED";
        } else if (!"RECALLED".equals(this.status)) {
            this.status = "ACTIVE";
        }
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }

    public String getProductSku() { return productSku; }
    public void setProductSku(String productSku) { this.productSku = productSku; }

    public Integer getInitialQuantity() { return initialQuantity; }
    public void setInitialQuantity(Integer initialQuantity) { this.initialQuantity = initialQuantity; }

    public Integer getCurrentQuantity() { return currentQuantity; }
    public void setCurrentQuantity(Integer currentQuantity) {
        this.currentQuantity = currentQuantity;
        if (this.currentQuantity <= 0) {
            this.status = "DEPLETED";
        }
    }

    public Integer getDefectiveQuantity() { return defectiveQuantity; }
    public void setDefectiveQuantity(Integer defectiveQuantity) { this.defectiveQuantity = defectiveQuantity; }

    public BigDecimal getCostPrice() { return costPrice; }
    public void setCostPrice(BigDecimal costPrice) { this.costPrice = costPrice; }

    public String getExpiryDate() { return expiryDate; }
    public void setExpiryDate(String expiryDate) { this.expiryDate = expiryDate; }

    public String getSupplierName() { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
