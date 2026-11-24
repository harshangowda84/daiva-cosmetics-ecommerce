package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.entity.ProductBatch;
import com.daivatech.ecommerce.entity.StockMovement;
import com.daivatech.ecommerce.repository.ProductBatchRepository;
import com.daivatech.ecommerce.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class BatchStockService {

    private static final Logger log = LoggerFactory.getLogger(BatchStockService.class);

    private final ProductBatchRepository batchRepository;
    private final ProductRepository productRepository;
    private final StockMovementService stockMovementService;
    private final ZohoInventoryService zohoInventoryService;

    public BatchStockService(ProductBatchRepository batchRepository,
                             ProductRepository productRepository,
                             StockMovementService stockMovementService,
                             ZohoInventoryService zohoInventoryService) {
        this.batchRepository = batchRepository;
        this.productRepository = productRepository;
        this.stockMovementService = stockMovementService;
        this.zohoInventoryService = zohoInventoryService;
    }

    public String generateBatchNumber(String sku) {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        int rand = 1000 + new Random().nextInt(9000);
        String cleanSku = (sku != null && !sku.isBlank()) ? sku.replaceAll("[^A-Za-z0-9]", "") : "PROD";
        if (cleanSku.length() > 6) cleanSku = cleanSku.substring(0, 6);
        return "BATCH-" + datePart + "-" + cleanSku.toUpperCase() + "-" + rand;
    }

    @Transactional
    public ProductBatch addNewBatch(Long productId,
                                    Integer quantity,
                                    String customBatchNumber,
                                    BigDecimal costPrice,
                                    String expiryDate,
                                    String supplierName,
                                    String performedBy,
                                    String notes) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found with ID: " + productId));

        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Batch quantity must be greater than zero.");
        }

        String batchNum = (customBatchNumber != null && !customBatchNumber.trim().isBlank())
                ? customBatchNumber.trim().toUpperCase()
                : generateBatchNumber(product.getSku());

        // Ensure unique batch number
        if (batchRepository.findByBatchNumber(batchNum).isPresent()) {
            batchNum = batchNum + "-" + (100 + new Random().nextInt(900));
        }

        ProductBatch batch = new ProductBatch(
                batchNum,
                product.getId(),
                product.getName(),
                product.getSku(),
                quantity,
                quantity,
                0,
                costPrice,
                expiryDate,
                supplierName,
                notes
        );

        ProductBatch savedBatch = batchRepository.save(batch);

        // Update total product stock
        int prevProductTotal = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int newProductTotal = prevProductTotal + quantity;
        product.setStockQuantity(newProductTotal);
        productRepository.save(product);

        // Record in StockMovement Audit Ledger
        stockMovementService.recordMovement(
                product,
                "RESTOCK",
                quantity,
                prevProductTotal,
                newProductTotal,
                savedBatch.getBatchNumber(),
                performedBy != null && !performedBy.isBlank() ? performedBy : "Store Admin",
                "New Batch " + savedBatch.getBatchNumber() + " added (+ " + quantity + " units)" +
                        (notes != null && !notes.isBlank() ? " • " + notes : "")
        );

        // Sync with Zoho
        syncProductToZoho(product);

        log.info("Created new batch {} for product '{}' with {} units", savedBatch.getBatchNumber(), product.getName(), quantity);
        return savedBatch;
    }

    @Transactional
    public BatchAdjustmentResult adjustBatch(String batchNumber,
                                            String adjustmentType,
                                            Integer quantity,
                                            String performedBy,
                                            String reason) {
        ProductBatch batch = batchRepository.findFirstByBatchNumberIgnoreCase(batchNumber.trim())
                .orElseThrow(() -> new IllegalArgumentException("Batch not found: " + batchNumber));

        Product product = productRepository.findById(batch.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Product not found for batch: " + batchNumber));

        int prevBatchQty = batch.getCurrentQuantity();
        int prevProductTotal = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int actualDelta;
        String movementType;
        String auditNote;

        String type = adjustmentType != null ? adjustmentType.toUpperCase().trim() : "DEFECTIVE";

        if ("DEFECTIVE".equals(type)) {
            // Write off defective units from this specific batch
            int writeOff = Math.min(prevBatchQty, Math.max(1, quantity != null ? quantity : 1));
            batch.setCurrentQuantity(prevBatchQty - writeOff);
            batch.setDefectiveQuantity(batch.getDefectiveQuantity() + writeOff);
            actualDelta = -writeOff;
            movementType = "DEFECTIVE_WRITE_OFF";
            auditNote = "Batch " + batch.getBatchNumber() + ": " + writeOff + " unit(s) marked DEFECTIVE" +
                    (reason != null && !reason.isBlank() ? " (" + reason + ")" : "");
        } else if ("CORRECTION".equals(type)) {
            // Set exact count for this batch
            int targetQty = Math.max(0, quantity != null ? quantity : 0);
            actualDelta = targetQty - prevBatchQty;
            batch.setCurrentQuantity(targetQty);
            movementType = "ADJUSTMENT";
            auditNote = "Batch " + batch.getBatchNumber() + ": Reconciled from " + prevBatchQty + " to " + targetQty + " units" +
                    (reason != null && !reason.isBlank() ? " (" + reason + ")" : "");
        } else if ("ADD_TO_BATCH".equals(type)) {
            // Add units directly to this batch
            int addQty = Math.max(1, quantity != null ? quantity : 1);
            batch.setCurrentQuantity(prevBatchQty + addQty);
            batch.setInitialQuantity(batch.getInitialQuantity() + addQty);
            actualDelta = addQty;
            movementType = "RESTOCK";
            auditNote = "Batch " + batch.getBatchNumber() + ": Replenished +" + addQty + " units" +
                    (reason != null && !reason.isBlank() ? " (" + reason + ")" : "");
        } else {
            throw new IllegalArgumentException("Unsupported adjustment type: " + adjustmentType);
        }

        ProductBatch savedBatch = batchRepository.save(batch);

        // Recalculate total product stock
        int newProductTotal = Math.max(0, prevProductTotal + actualDelta);
        product.setStockQuantity(newProductTotal);
        Product savedProduct = productRepository.save(product);

        // Record in StockMovement Audit Ledger
        StockMovement movement = stockMovementService.recordMovement(
                savedProduct,
                movementType,
                actualDelta,
                prevProductTotal,
                newProductTotal,
                savedBatch.getBatchNumber(),
                performedBy != null && !performedBy.isBlank() ? performedBy : "Store Admin",
                auditNote
        );

        // Sync with Zoho
        syncProductToZoho(savedProduct);

        return new BatchAdjustmentResult(savedBatch, savedProduct, movement);
    }

    /**
     * Deduct from batches using FIFO (First In, First Out) when orders are placed
     */
    @Transactional
    public List<BatchDeduction> deductStockFIFO(Long productId, int quantityToDeduct) {
        List<BatchDeduction> deductions = new ArrayList<>();
        int remainingToDeduct = quantityToDeduct;

        List<ProductBatch> activeBatches = batchRepository.findByProductIdAndStatusOrderByCreatedAtAsc(productId, "ACTIVE");

        for (ProductBatch b : activeBatches) {
            if (remainingToDeduct <= 0) break;
            int take = Math.min(b.getCurrentQuantity(), remainingToDeduct);
            b.setCurrentQuantity(b.getCurrentQuantity() - take);
            batchRepository.save(b);
            deductions.add(new BatchDeduction(b.getBatchNumber(), take));
            remainingToDeduct -= take;
        }

        return deductions;
    }

    @Transactional
    public void restoreBatchStock(Long productId, int quantity, String referenceNumber, String reason) {
        if (quantity <= 0) return;
        Product product = productRepository.findById(productId).orElse(null);
        if (product == null) return;

        List<ProductBatch> batches = batchRepository.findByProductIdOrderByCreatedAtDesc(productId);
        if (!batches.isEmpty()) {
            ProductBatch latest = batches.get(0);
            latest.setCurrentQuantity(latest.getCurrentQuantity() + quantity);
            batchRepository.save(latest);
        }

        int prevStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        int newStock = prevStock + quantity;
        product.setStockQuantity(newStock);
        productRepository.save(product);

        stockMovementService.recordMovement(
                product,
                "ORDER_REFUND",
                quantity,
                prevStock,
                newStock,
                referenceNumber,
                "Store Admin",
                "Order " + referenceNumber + " refund: Restocked " + quantity + " units (" + (reason != null ? reason : "Customer refund") + ")"
        );
        syncProductToZoho(product);
    }

    public List<ProductBatch> getBatchesForProduct(Long productId) {
        return batchRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    public Optional<ProductBatch> getBatchByNumber(String batchNumber) {
        return batchRepository.findFirstByBatchNumberIgnoreCase(batchNumber.trim());
    }

    public List<ProductBatch> searchBatches(String query) {
        if (query == null || query.isBlank()) {
            return batchRepository.findAll();
        }
        return batchRepository.findByBatchNumberContainingIgnoreCaseOrProductNameContainingIgnoreCase(query.trim(), query.trim());
    }

    @Transactional
    public void ensureInitialBatchesExist() {
        List<Product> products = productRepository.findAll();
        for (Product p : products) {
            if (batchRepository.countByProductId(p.getId()) == 0) {
                int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 20;
                String cleanSku = (p.getSku() != null && !p.getSku().isBlank()) ? p.getSku() : "PRD" + p.getId();
                String batchNum = "LOT-" + cleanSku.toUpperCase() + "-INIT";
                if (batchRepository.findByBatchNumber(batchNum).isPresent()) {
                    batchNum = batchNum + "-" + p.getId();
                }

                ProductBatch b = new ProductBatch(
                        batchNum,
                        p.getId(),
                        p.getName(),
                        p.getSku(),
                        stock,
                        stock,
                        0,
                        null,
                        "2027-12",
                        "Original Catalog Inventory",
                        "Initial batch creation from store catalog setup"
                );
                batchRepository.save(b);
                log.info("Initialized starting batch {} ({} units) for {}", batchNum, stock, p.getName());
            }
        }
    }

    private void syncProductToZoho(Product product) {
        try {
            if (product.getZohoItemId() != null && !product.getZohoItemId().isBlank()) {
                zohoInventoryService.createOrUpdateItem(product);
            }
        } catch (Exception e) {
            log.warn("Could not sync product batch change to Zoho: {}", e.getMessage());
        }
    }

    public record BatchAdjustmentResult(ProductBatch batch, Product product, StockMovement movement) {}
    public record BatchDeduction(String batchNumber, int quantity) {}
}
