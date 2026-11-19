package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.CartItem;
import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.repository.CartItemRepository;
import com.daivatech.ecommerce.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private static final Logger log = LoggerFactory.getLogger(CartController.class);

    private final CartItemRepository cartRepository;
    private final ProductRepository productRepository;

    public CartController(CartItemRepository cartRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.productRepository = productRepository;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<CartItem>> getUserCart(@PathVariable Long userId) {
        List<CartItem> items = cartRepository.findByUserIdOrderByCreatedAtAsc(userId);
        return ResponseEntity.ok(items);
    }

    @PostMapping("/{userId}")
    @Transactional
    public ResponseEntity<CartItem> addToCart(@PathVariable Long userId, @RequestBody Map<String, Object> payload) {
        Long productId = ((Number) payload.get("productId")).longValue();
        int quantity = payload.containsKey("quantity") ? ((Number) payload.get("quantity")).intValue() : 1;
        boolean selected = !payload.containsKey("selected") || (Boolean) payload.get("selected");
        boolean fromWishlist = payload.containsKey("fromWishlist") && (Boolean) payload.get("fromWishlist");

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        Optional<CartItem> existing = cartRepository.findByUserIdAndProductId(userId, productId);
        CartItem item;
        if (existing.isPresent()) {
            item = existing.get();
            item.setQuantity(item.getQuantity() + quantity);
            item.setSelected(true);
            if (fromWishlist) {
                item.setFromWishlist(true);
            }
            item.setUpdatedAt(LocalDateTime.now());
        } else {
            item = new CartItem(null, userId, product, quantity, selected, fromWishlist);
        }

        CartItem saved = cartRepository.save(item);
        log.info("Saved cart item for user {}: product {}, qty {}", userId, productId, saved.getQuantity());
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{userId}/item/{productId}")
    @Transactional
    public ResponseEntity<CartItem> updateCartItem(@PathVariable Long userId, @PathVariable Long productId, @RequestBody Map<String, Object> payload) {
        Optional<CartItem> existing = cartRepository.findByUserIdAndProductId(userId, productId);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        CartItem item = existing.get();
        if (payload.containsKey("quantity")) {
            int qty = ((Number) payload.get("quantity")).intValue();
            if (qty <= 0) {
                cartRepository.delete(item);
                return ResponseEntity.noContent().build();
            }
            item.setQuantity(qty);
        }
        if (payload.containsKey("selected")) {
            item.setSelected((Boolean) payload.get("selected"));
        }
        item.setUpdatedAt(LocalDateTime.now());
        CartItem saved = cartRepository.save(item);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{userId}/select-all")
    @Transactional
    public ResponseEntity<List<CartItem>> selectAllItems(@PathVariable Long userId, @RequestBody Map<String, Boolean> payload) {
        boolean selected = payload.getOrDefault("selected", true);
        List<CartItem> items = cartRepository.findByUserIdOrderByCreatedAtAsc(userId);
        for (CartItem item : items) {
            item.setSelected(selected);
            item.setUpdatedAt(LocalDateTime.now());
        }
        List<CartItem> saved = cartRepository.saveAll(items);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{userId}/item/{productId}")
    @Transactional
    public ResponseEntity<Void> removeFromCart(@PathVariable Long userId, @PathVariable Long productId) {
        cartRepository.deleteByUserIdAndProductId(userId, productId);
        log.info("Removed product {} from user {} cart", productId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/clear")
    @Transactional
    public ResponseEntity<Void> clearCart(@PathVariable Long userId) {
        cartRepository.deleteByUserId(userId);
        log.info("Cleared cart for user {}", userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/clear-selected")
    @Transactional
    public ResponseEntity<Void> clearSelectedItems(@PathVariable Long userId) {
        cartRepository.deleteByUserIdAndSelectedTrue(userId);
        log.info("Cleared selected cart items for user {}", userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{userId}/merge")
    @Transactional
    public ResponseEntity<List<CartItem>> mergeGuestCart(@PathVariable Long userId, @RequestBody List<Map<String, Object>> guestItems) {
        if (guestItems == null || guestItems.isEmpty()) {
            return ResponseEntity.ok(cartRepository.findByUserIdOrderByCreatedAtAsc(userId));
        }

        for (Map<String, Object> gItem : guestItems) {
            try {
                Object pObj = gItem.get("productId");
                if (pObj == null && gItem.get("product") instanceof Map) {
                    pObj = ((Map<?, ?>) gItem.get("product")).get("id");
                }
                if (pObj == null) continue;
                Long productId = ((Number) pObj).longValue();
                int qty = gItem.containsKey("quantity") ? ((Number) gItem.get("quantity")).intValue() : 1;
                boolean selected = !gItem.containsKey("selected") || Boolean.TRUE.equals(gItem.get("selected"));
                boolean fromWishlist = Boolean.TRUE.equals(gItem.get("fromWishlist"));

                Optional<CartItem> existing = cartRepository.findByUserIdAndProductId(userId, productId);
                if (existing.isPresent()) {
                    CartItem item = existing.get();
                    item.setQuantity(Math.max(item.getQuantity(), qty));
                    item.setSelected(selected);
                    item.setUpdatedAt(LocalDateTime.now());
                    cartRepository.save(item);
                } else {
                    productRepository.findById(productId).ifPresent(p -> {
                        CartItem newItem = new CartItem(null, userId, p, qty, selected, fromWishlist);
                        cartRepository.save(newItem);
                    });
                }
            } catch (Exception e) {
                log.warn("Error merging guest cart item: {}", e.getMessage());
            }
        }

        List<CartItem> updated = cartRepository.findByUserIdOrderByCreatedAtAsc(userId);
        log.info("Merged guest cart into user {} cart. Total items: {}", userId, updated.size());
        return ResponseEntity.ok(updated);
    }
}
