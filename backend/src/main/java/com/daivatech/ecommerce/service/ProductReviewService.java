package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.entity.CustomerOrder;
import com.daivatech.ecommerce.entity.OrderItem;
import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.entity.ProductReview;
import com.daivatech.ecommerce.repository.CustomerOrderRepository;
import com.daivatech.ecommerce.repository.ProductRepository;
import com.daivatech.ecommerce.repository.ProductReviewRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class ProductReviewService {

    private static final Logger log = LoggerFactory.getLogger(ProductReviewService.class);

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final CustomerOrderRepository orderRepository;
    private final ProfanityFilterService profanityFilterService;
    private final ObjectMapper objectMapper;

    public ProductReviewService(ProductReviewRepository reviewRepository,
                                ProductRepository productRepository,
                                CustomerOrderRepository orderRepository,
                                ProfanityFilterService profanityFilterService,
                                ObjectMapper objectMapper) {
        this.reviewRepository = reviewRepository;
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.profanityFilterService = profanityFilterService;
        this.objectMapper = objectMapper;
    }

    /**
     * Checks if a user is eligible to review a product.
     * Must have purchased the product in a confirmed order, and not already reviewed it.
     */
    public Map<String, Object> checkReviewEligibility(Long userId, Long productId) {
        if (userId == null) {
            return Map.of(
                    "eligible", false,
                    "reason", "Please log in to your account. Reviews can only be submitted for products you have purchased."
            );
        }

        // Check if user already reviewed this product
        if (reviewRepository.existsByUserIdAndProductId(userId, productId)) {
            return Map.of(
                    "eligible", false,
                    "alreadyReviewed", true,
                    "reason", "You have already reviewed this item from your Order History. Thank you for your feedback!"
            );
        }

        // Check customer order history for this product
        List<CustomerOrder> userOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        boolean hasPurchased = false;
        CustomerOrder matchedOrder = null;

        for (CustomerOrder order : userOrders) {
            if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus())) continue;
            if (order.getItems() != null) {
                for (OrderItem item : order.getItems()) {
                    if (Objects.equals(item.getProductId(), productId)) {
                        hasPurchased = true;
                        matchedOrder = order;
                        break;
                    }
                }
            }
            if (hasPurchased) break;
        }

        if (!hasPurchased) {
            return Map.of(
                    "eligible", false,
                    "hasPurchased", false,
                    "reason", "Only customers who have ordered this item can leave a review. Reviews can be submitted directly from your Order History after purchase."
            );
        }

        Map<String, Object> res = new HashMap<>();
        res.put("eligible", true);
        res.put("hasPurchased", true);
        res.put("reason", "Verified Purchase");
        if (matchedOrder != null) {
            res.put("orderNumber", matchedOrder.getOrderNumber());
            res.put("orderDate", matchedOrder.getCreatedAt() != null ? matchedOrder.getCreatedAt().toString() : "");
        }
        return res;
    }

    /**
     * Get all reviews submitted by a specific customer.
     */
    public List<ProductReview> getUserReviews(Long userId) {
        if (userId == null) return List.of();
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Retrieves all reviews and rating breakdown for a product (only visible reviews shown on PDP).
     */
    public Map<String, Object> getProductReviewSummary(Long productId) {
        List<ProductReview> rawReviews = reviewRepository.findByProductIdAndVisibleTrueOrderByCreatedAtDesc(productId);
        List<ProductReview> reviews = new ArrayList<>(rawReviews);
        // Sort: 5-star reviews on top, then descending by stars, then newest
        reviews.sort((a, b) -> {
            int rA = a.getRating() != null ? a.getRating() : 0;
            int rB = b.getRating() != null ? b.getRating() : 0;
            if (rB != rA) return Integer.compare(rB, rA);
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        int totalReviews = reviews.size();
        double averageRating = 5.0;
        int[] ratingDistribution = new int[6]; // index 1 to 5
        List<String> allPhotos = new ArrayList<>();

        if (!reviews.isEmpty()) {
            int sum = 0;
            for (ProductReview r : reviews) {
                int star = Math.max(1, Math.min(5, r.getRating() != null ? r.getRating() : 5));
                ratingDistribution[star]++;
                sum += star;

                // Extract customer photos
                if (r.getImagesJson() != null && !r.getImagesJson().isBlank()) {
                    try {
                        List<String> images = objectMapper.readValue(r.getImagesJson(), new TypeReference<List<String>>() {});
                        if (images != null) {
                            allPhotos.addAll(images);
                        }
                    } catch (Exception ignored) {}
                }
            }
            averageRating = BigDecimal.valueOf((double) sum / totalReviews)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        Map<String, Object> response = new HashMap<>();
        response.put("productId", productId);
        response.put("totalReviews", totalReviews);
        response.put("averageRating", averageRating);
        response.put("reviews", reviews);
        response.put("customerPhotos", allPhotos);
        response.put("distribution", Map.of(
                "fiveStar", ratingDistribution[5],
                "fourStar", ratingDistribution[4],
                "threeStar", ratingDistribution[3],
                "twoStar", ratingDistribution[2],
                "oneStar", ratingDistribution[1]
        ));

        return response;
    }

    /**
     * Admin: Get all reviews across all products with product details and visibility status.
     */
    public List<Map<String, Object>> getAllReviewsForAdmin() {
        List<ProductReview> allReviews = reviewRepository.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();

        // Cache products to avoid redundant lookups
        Map<Long, Product> productCache = new HashMap<>();

        for (ProductReview r : allReviews) {
            Product prod = productCache.computeIfAbsent(r.getProductId(), id -> productRepository.findById(id).orElse(null));

            Map<String, Object> item = new HashMap<>();
            item.put("id", r.getId());
            item.put("productId", r.getProductId());
            item.put("userId", r.getUserId());
            item.put("reviewerName", r.getReviewerName());
            item.put("rating", r.getRating());
            item.put("title", r.getTitle());
            item.put("comment", r.getComment());
            item.put("imagesJson", r.getImagesJson());
            item.put("verifiedBuyer", r.getVerifiedBuyer());
            item.put("visible", r.getVisible() != null ? r.getVisible() : true);
            item.put("createdAt", r.getCreatedAt());

            if (prod != null) {
                item.put("productName", prod.getName());
                item.put("productSku", prod.getSku());
                item.put("productImageUrl", prod.getImageUrl());
                item.put("productPrice", prod.getPrice());
            } else {
                item.put("productName", "Product #" + r.getProductId());
                item.put("productSku", "");
                item.put("productImageUrl", "");
                item.put("productPrice", BigDecimal.ZERO);
            }

            result.add(item);
        }

        return result;
    }

    /**
     * Admin: Toggle visibility on/off for a review.
     */
    @Transactional
    public ProductReview toggleReviewVisibility(Long reviewId) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));

        boolean newVisibility = review.getVisible() == null || !review.getVisible();
        review.setVisible(newVisibility);
        ProductReview saved = reviewRepository.save(review);

        // Recalculate product rating considering only visible reviews
        productRepository.findById(review.getProductId()).ifPresent(this::recalculateProductRating);

        log.info("Review #{} visibility toggled to {}", reviewId, newVisibility);
        return saved;
    }

    /**
     * Admin: Permanently delete a review.
     */
    @Transactional
    public void deleteReview(Long reviewId) {
        ProductReview review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found with ID: " + reviewId));
        Long productId = review.getProductId();
        reviewRepository.delete(review);

        // Recalculate product rating
        productRepository.findById(productId).ifPresent(this::recalculateProductRating);
        log.info("Review #{} deleted by admin", reviewId);
    }

    /**
     * Submits a new review with image attachments and profanity sanitization.
     */
    @Transactional
    public ProductReview submitReview(Long productId,
                                      Long userId,
                                      String reviewerName,
                                      Integer rating,
                                      String title,
                                      String comment,
                                      List<String> imageUrls) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + productId));

        // 1. Verify Buyer Status (Strict Amazon Model: must be logged in and must have ordered product)
        if (userId == null) {
            throw new IllegalStateException("Authentication required. Reviews can only be submitted for items in your Order History.");
        }
        Map<String, Object> eligibility = checkReviewEligibility(userId, productId);
        if (!Boolean.TRUE.equals(eligibility.get("eligible"))) {
            throw new IllegalStateException((String) eligibility.get("reason"));
        }

        // 2. Validate Rating
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars.");
        }

        // 3. Validate Word Count (max 120 words)
        if (!profanityFilterService.isWithinWordLimit(comment)) {
            throw new IllegalArgumentException("Review comment exceeds the limit of " +
                    ProfanityFilterService.MAX_WORDS_ALLOWED + " words (current: " +
                    profanityFilterService.countWords(comment) + " words).");
        }

        // 4. Sanitize title and comment for vulgarity/abusive language
        String cleanTitle = profanityFilterService.sanitizeText(title != null ? title.trim() : "Verified Purchase");
        String cleanComment = profanityFilterService.sanitizeText(comment != null ? comment.trim() : "");

        // 5. Package customer photos (up to 4 images)
        String imagesJson = "[]";
        if (imageUrls != null && !imageUrls.isEmpty()) {
            List<String> trimmed = imageUrls.subList(0, Math.min(4, imageUrls.size()));
            try {
                imagesJson = objectMapper.writeValueAsString(trimmed);
            } catch (Exception e) {
                imagesJson = "[]";
            }
        }

        ProductReview review = new ProductReview(
                productId,
                userId,
                reviewerName != null && !reviewerName.isBlank() ? reviewerName.trim() : "Verified Customer",
                rating,
                cleanTitle,
                cleanComment,
                imagesJson,
                true // Verified Buyer
        );

        ProductReview savedReview = reviewRepository.save(review);

        // 6. Recalculate and update product's overall rating & reviewCount
        recalculateProductRating(product);

        log.info("New verified review submitted for product '{}' by {}", product.getName(), review.getReviewerName());
        return savedReview;
    }

    private void recalculateProductRating(Product product) {
        List<ProductReview> visibleReviews = reviewRepository.findByProductIdAndVisibleTrueOrderByCreatedAtDesc(product.getId());
        if (!visibleReviews.isEmpty()) {
            double avg = visibleReviews.stream().mapToInt(ProductReview::getRating).average().orElse(5.0);
            double roundedAvg = BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP).doubleValue();
            product.setRating(roundedAvg);
            product.setReviewCount(visibleReviews.size());
        } else {
            product.setRating(5.0);
            product.setReviewCount(0);
        }
        productRepository.save(product);
    }
}
