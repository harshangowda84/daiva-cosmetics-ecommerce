package com.daivatech.ecommerce.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_reviews", indexes = {
        @Index(name = "idx_review_product_id", columnList = "productId"),
        @Index(name = "idx_review_user_id", columnList = "userId")
})
public class ProductReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long productId;

    private Long userId;

    @Column(nullable = false)
    private String reviewerName;

    @Column(nullable = false)
    private Integer rating; // 1 to 5 stars

    private String title;

    @Column(length = 2000, nullable = false)
    private String comment;

    @Column(length = 2000)
    private String imagesJson; // Stores JSON array of photo URLs: ["url1", "url2", ...]

    @Column(nullable = false)
    private Boolean verifiedBuyer = true;

    @Column(nullable = false)
    private Boolean visible = true; // Admin moderation toggle: true = shown on PDP, false = hidden

    private LocalDateTime createdAt = LocalDateTime.now();

    public ProductReview() {}

    public ProductReview(Long productId, Long userId, String reviewerName, Integer rating, String title, String comment, String imagesJson, Boolean verifiedBuyer) {
        this.productId = productId;
        this.userId = userId;
        this.reviewerName = reviewerName;
        this.rating = rating;
        this.title = title;
        this.comment = comment;
        this.imagesJson = imagesJson;
        this.verifiedBuyer = verifiedBuyer != null ? verifiedBuyer : true;
        this.visible = true;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }

    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public String getImagesJson() { return imagesJson; }
    public void setImagesJson(String imagesJson) { this.imagesJson = imagesJson; }

    public Boolean getVerifiedBuyer() { return verifiedBuyer; }
    public void setVerifiedBuyer(Boolean verifiedBuyer) { this.verifiedBuyer = verifiedBuyer; }

    public Boolean getVisible() { return visible != null ? visible : true; }
    public void setVisible(Boolean visible) { this.visible = visible != null ? visible : true; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
