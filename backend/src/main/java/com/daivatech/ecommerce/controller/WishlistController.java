package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.entity.WishlistItem;
import com.daivatech.ecommerce.repository.ProductRepository;
import com.daivatech.ecommerce.repository.WishlistItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*")
public class WishlistController {

    private static final Logger log = LoggerFactory.getLogger(WishlistController.class);

    private final WishlistItemRepository wishlistRepository;
    private final ProductRepository productRepository;

    public WishlistController(WishlistItemRepository wishlistRepository, ProductRepository productRepository) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<Product>> getUserWishlist(@PathVariable Long userId) {
        List<WishlistItem> items = wishlistRepository.findByUserIdOrderByCreatedAtDesc(userId);
        List<Product> products = items.stream().map(WishlistItem::getProduct).collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @PostMapping("/toggle")
    @Transactional
    public ResponseEntity<Map<String, Object>> toggleWishlist(@RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        Long productId = payload.get("productId");

        if (userId == null || productId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId and productId are required"));
        }

        boolean exists = wishlistRepository.existsByUserIdAndProductId(userId, productId);
        if (exists) {
            wishlistRepository.deleteByUserIdAndProductId(userId, productId);
            log.info("Removed product {} from user {} wishlist", productId, userId);
            return ResponseEntity.ok(Map.of("action", "removed", "productId", productId, "inWishlist", false));
        } else {
            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));
            WishlistItem item = new WishlistItem();
            item.setUserId(userId);
            item.setProduct(product);
            wishlistRepository.save(item);
            log.info("Added product {} to user {} wishlist", productId, userId);
            return ResponseEntity.ok(Map.of("action", "added", "productId", productId, "inWishlist", true));
        }
    }

    @DeleteMapping("/{userId}/{productId}")
    @Transactional
    public ResponseEntity<Void> removeFromWishlist(@PathVariable Long userId, @PathVariable Long productId) {
        wishlistRepository.deleteByUserIdAndProductId(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/clear")
    @Transactional
    public ResponseEntity<Void> clearWishlist(@PathVariable Long userId) {
        wishlistRepository.deleteByUserId(userId);
        return ResponseEntity.noContent().build();
    }
}
