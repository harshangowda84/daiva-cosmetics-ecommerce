package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.entity.UserBrowsingHistory;
import com.daivatech.ecommerce.repository.ProductRepository;
import com.daivatech.ecommerce.repository.UserBrowsingHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/history")
@CrossOrigin(origins = "*")
public class BrowsingHistoryController {

    private static final Logger log = LoggerFactory.getLogger(BrowsingHistoryController.class);

    private final UserBrowsingHistoryRepository historyRepository;
    private final ProductRepository productRepository;

    public BrowsingHistoryController(UserBrowsingHistoryRepository historyRepository, ProductRepository productRepository) {
        this.historyRepository = historyRepository;
        this.productRepository = productRepository;
    }

    public static class HistoryItemDto {
        private Long id;
        private Product product;
        private LocalDateTime viewedAt;

        public HistoryItemDto(Long id, Product product, LocalDateTime viewedAt) {
            this.id = id;
            this.product = product;
            this.viewedAt = viewedAt;
        }

        public Long getId() {
            return id;
        }

        public Product getProduct() {
            return product;
        }

        public LocalDateTime getViewedAt() {
            return viewedAt;
        }
    }

    @GetMapping("/{userId}")
    public ResponseEntity<List<HistoryItemDto>> getUserHistory(@PathVariable Long userId) {
        List<UserBrowsingHistory> items = historyRepository.findByUserIdOrderByViewedAtDesc(userId);
        List<HistoryItemDto> dtoList = items.stream()
                .map(item -> new HistoryItemDto(item.getId(), item.getProduct(), item.getViewedAt()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<HistoryItemDto> recordProductView(@RequestBody Map<String, Long> payload) {
        Long userId = payload.get("userId");
        Long productId = payload.get("productId");

        if (userId == null || productId == null) {
            return ResponseEntity.badRequest().build();
        }

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found: " + productId));

        Optional<UserBrowsingHistory> existing = historyRepository.findByUserIdAndProductId(userId, productId);
        UserBrowsingHistory history;
        if (existing.isPresent()) {
            history = existing.get();
            history.setViewedAt(LocalDateTime.now());
        } else {
            history = new UserBrowsingHistory();
            history.setUserId(userId);
            history.setProduct(product);
            history.setViewedAt(LocalDateTime.now());
        }

        UserBrowsingHistory saved = historyRepository.save(history);
        return ResponseEntity.ok(new HistoryItemDto(saved.getId(), saved.getProduct(), saved.getViewedAt()));
    }

    @DeleteMapping("/{userId}/{productId}")
    @Transactional
    public ResponseEntity<Void> removeFromHistory(@PathVariable Long userId, @PathVariable Long productId) {
        historyRepository.deleteByUserIdAndProductId(userId, productId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{userId}/clear")
    @Transactional
    public ResponseEntity<Void> clearHistory(@PathVariable Long userId) {
        historyRepository.deleteByUserId(userId);
        return ResponseEntity.noContent().build();
    }
}
