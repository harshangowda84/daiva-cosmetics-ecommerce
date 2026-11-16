package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.ProductReview;
import com.daivatech.ecommerce.service.ImageStorageService;
import com.daivatech.ecommerce.service.ProductReviewService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    private final ProductReviewService reviewService;
    private final ImageStorageService imageStorageService;

    public ReviewController(ProductReviewService reviewService, ImageStorageService imageStorageService) {
        this.reviewService = reviewService;
        this.imageStorageService = imageStorageService;
    }

    /**
     * Get review summary and all customer reviews for a product.
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<?> getProductReviews(@PathVariable Long productId) {
        Map<String, Object> summary = reviewService.getProductReviewSummary(productId);
        return ResponseEntity.ok(summary);
    }

    /**
     * Check if a customer can review this product (must be a verified buyer).
     */
    @GetMapping("/eligibility")
    public ResponseEntity<?> checkEligibility(@RequestParam(required = false) Long userId,
                                              @RequestParam Long productId) {
        Map<String, Object> eligibility = reviewService.checkReviewEligibility(userId, productId);
        return ResponseEntity.ok(eligibility);
    }

    /**
     * Get all reviews written by a specific user (for Order History feedback state).
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserReviews(@PathVariable Long userId) {
        List<ProductReview> reviews = reviewService.getUserReviews(userId);
        return ResponseEntity.ok(reviews);
    }

    /**
     * Upload an image to attach to a customer review (max 4 per review).
     */
    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadReviewImage(@RequestParam("file") MultipartFile file) {
        try {
            String imageUrl = imageStorageService.storeReviewImage(file);
            return ResponseEntity.ok(Map.of("imageUrl", imageUrl));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Submit a customer review with profanity filtration and verified buyer check.
     */
    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> payload) {
        try {
            Long productId = Long.valueOf(payload.get("productId").toString());
            Long userId = payload.get("userId") != null ? Long.valueOf(payload.get("userId").toString()) : null;
            String reviewerName = (String) payload.get("reviewerName");
            Integer rating = Integer.valueOf(payload.get("rating").toString());
            String title = (String) payload.get("title");
            String comment = (String) payload.get("comment");

            @SuppressWarnings("unchecked")
            List<String> imageUrls = payload.get("imageUrls") != null ? (List<String>) payload.get("imageUrls") : List.of();

            ProductReview review = reviewService.submitReview(
                    productId,
                    userId,
                    reviewerName,
                    rating,
                    title,
                    comment,
                    imageUrls
            );

            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to submit review: " + e.getMessage()));
        }
    }

    /**
     * Admin: Get all reviews across all products for moderation.
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllReviewsForAdmin() {
        try {
            List<Map<String, Object>> reviews = reviewService.getAllReviewsForAdmin();
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Admin: Toggle visibility on/off for a review on the PDP page.
     */
    @PutMapping("/admin/{reviewId}/toggle-visibility")
    public ResponseEntity<?> toggleReviewVisibility(@PathVariable Long reviewId) {
        try {
            ProductReview updated = reviewService.toggleReviewVisibility(reviewId);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Admin: Delete a review permanently.
     */
    @DeleteMapping("/admin/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Review deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Serve review photo.
     */
    @GetMapping("/images/{filename}")
    public ResponseEntity<Resource> getReviewImage(@PathVariable String filename) {
        try {
            Path filePath = imageStorageService.getReviewImagePath(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "image/jpeg";
            }

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "max-age=86400, public")
                    .body(resource);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
