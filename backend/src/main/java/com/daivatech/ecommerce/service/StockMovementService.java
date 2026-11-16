package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.entity.StockMovement;
import com.daivatech.ecommerce.repository.ProductRepository;
import com.daivatech.ecommerce.repository.StockMovementRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class StockMovementService {

    private static final Logger log = LoggerFactory.getLogger(StockMovementService.class);

    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final ZohoInventoryService zohoInventoryService;

    public StockMovementService(StockMovementRepository stockMovementRepository,
                                ProductRepository productRepository,
                                ZohoInventoryService zohoInventoryService) {
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
        this.zohoInventoryService = zohoInventoryService;
    }

    @Transactional
    public StockMovement recordMovement(Product product,
                                         String movementType,
                                         int quantityDelta,
                                         int previousStock,
                                         int newStock,
                                         String referenceId,
                                         String performedBy,
                                         String notes) {
        StockMovement movement = new StockMovement(
                product.getId(),
                product.getName(),
                product.getSku(),
                movementType,
                quantityDelta,
                previousStock,
                newStock,
                referenceId,
                performedBy != null && !performedBy.isBlank() ? performedBy : "System",
                notes
        );
        StockMovement saved = stockMovementRepository.save(movement);
        log.info("Recorded stock movement for '{}' (ID: {}): {} delta ({} -> {}). Reason: {}",
                product.getName(), product.getId(), quantityDelta >= 0 ? "+" + quantityDelta : quantityDelta,
                previousStock, newStock, notes);
        return saved;
    }

    @Transactional
    public StockAdjustmentResult adjustStock(Long productId,
                                            Integer delta,
                                            Integer targetStock,
                                            boolean isAdditive,
                                            String performedBy,
                                            String notes,
                                            String movementType) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + productId));

        int prevStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int newStock;
        int actualDelta;

        if (isAdditive) {
            actualDelta = delta != null ? delta : 0;
            newStock = Math.max(0, prevStock + actualDelta);
        } else {
            newStock = Math.max(0, targetStock != null ? targetStock : 0);
            actualDelta = newStock - prevStock;
        }

        product.setStockQuantity(newStock);
        Product savedProduct = productRepository.save(product);

        String type = movementType != null && !movementType.isBlank()
                ? movementType
                : (actualDelta >= 0 ? "RESTOCK" : "ADJUSTMENT");

        StockMovement movement = recordMovement(
                savedProduct,
                type,
                actualDelta,
                prevStock,
                newStock,
                "MANUAL_AUDIT",
                performedBy != null && !performedBy.isBlank() ? performedBy : "Store Admin",
                notes != null && !notes.isBlank() ? notes : (actualDelta >= 0 ? "Stock replenishment" : "Inventory adjustment")
        );

        // Sync to Zoho if connected
        try {
            if (savedProduct.getZohoItemId() != null && !savedProduct.getZohoItemId().isBlank()) {
                zohoInventoryService.createOrUpdateItem(savedProduct);
            }
        } catch (Exception e) {
            log.warn("Could not sync stock change to Zoho: {}", e.getMessage());
        }

        return new StockAdjustmentResult(savedProduct, movement);
    }

    public List<StockMovement> getHistoryForProduct(Long productId) {
        return stockMovementRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public List<StockMovement> getAllHistory() {
        return stockMovementRepository.findAllByOrderByCreatedAtDesc();
    }

    public record StockAdjustmentResult(Product product, StockMovement movement) {}
}
