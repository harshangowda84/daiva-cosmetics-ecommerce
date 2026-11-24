package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.CustomerOrder;
import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.entity.ProductBatch;
import com.daivatech.ecommerce.repository.ProductRepository;
import com.daivatech.ecommerce.service.*;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminController {

    private final ProductRepository productRepository;
    private final ProductService productService;
    private final OrderService orderService;
    private final ZohoAuthService zohoAuthService;
    private final ZohoInventoryService zohoInventoryService;
    private final ImageStorageService imageStorageService;
    private final StockMovementService stockMovementService;
    private final BatchStockService batchStockService;
    private final com.daivatech.ecommerce.service.EmailService emailService;
    private final com.daivatech.ecommerce.service.DataInitializer dataInitializer;

    public AdminController(ProductRepository productRepository,
                           ProductService productService,
                           OrderService orderService,
                           ZohoAuthService zohoAuthService,
                           ZohoInventoryService zohoInventoryService,
                           ImageStorageService imageStorageService,
                           StockMovementService stockMovementService,
                           BatchStockService batchStockService,
                           com.daivatech.ecommerce.service.EmailService emailService,
                           com.daivatech.ecommerce.service.DataInitializer dataInitializer) {
        this.productRepository = productRepository;
        this.productService = productService;
        this.orderService = orderService;
        this.zohoAuthService = zohoAuthService;
        this.zohoInventoryService = zohoInventoryService;
        this.imageStorageService = imageStorageService;
        this.stockMovementService = stockMovementService;
        this.batchStockService = batchStockService;
        this.emailService = emailService;
        this.dataInitializer = dataInitializer;
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getAdminProducts() {
        return ResponseEntity.ok(productRepository.findAll());
    }

    @PostMapping("/products")
    public ResponseEntity<?> createProduct(@RequestBody Map<String, Object> payload) {
        try {
            String name = (String) payload.get("name");
            if (name == null || name.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Product name is required"));
            }

            Object priceObj = payload.get("price");
            if (priceObj == null || priceObj.toString().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Price is required"));
            }
            BigDecimal price = new BigDecimal(priceObj.toString());

            Product product = new Product();
            product.setName(name.trim());
            product.setPrice(price);

            // Original price
            if (payload.get("originalPrice") != null && !payload.get("originalPrice").toString().isBlank()) {
                product.setOriginalPrice(new BigDecimal(payload.get("originalPrice").toString()));
            } else {
                product.setOriginalPrice(price);
            }

            // Discount
            if (payload.get("discountPercent") != null && !payload.get("discountPercent").toString().isBlank()) {
                product.setDiscountPercent(Double.valueOf(payload.get("discountPercent").toString()).intValue());
            } else {
                product.setDiscountPercent(0);
            }

            // Stock
            if (payload.get("stockQuantity") != null && !payload.get("stockQuantity").toString().isBlank()) {
                product.setStockQuantity(Double.valueOf(payload.get("stockQuantity").toString()).intValue());
            } else {
                product.setStockQuantity(20);
            }

            product.setCategory("Cosmetics");
            product.setBrand(payload.get("brand") != null ? payload.get("brand").toString() : "Aura Luxe");
            product.setSubCategory(payload.get("subCategory") != null ? payload.get("subCategory").toString() : "Serums & Treatments");
            product.setVolume(payload.get("volume") != null ? payload.get("volume").toString() : "30 ml");
            if (payload.get("variantsJson") != null) {
                product.setVariantsJson(payload.get("variantsJson").toString());
            }
            product.setSkinType(payload.get("skinType") != null ? payload.get("skinType").toString() : "All Skin Types");

            // Safe String truncation
            if (payload.get("description") != null) {
                String d = payload.get("description").toString();
                product.setDescription(d.length() > 1900 ? d.substring(0, 1900) : d);
            }
            if (payload.get("keyIngredients") != null) {
                String ki = payload.get("keyIngredients").toString();
                product.setKeyIngredients(ki.length() > 950 ? ki.substring(0, 950) : ki);
            }
            if (payload.get("howToUse") != null) {
                String htu = payload.get("howToUse").toString();
                product.setHowToUse(htu.length() > 950 ? htu.substring(0, 950) : htu);
            }

            String img = payload.get("imageUrl") != null ? payload.get("imageUrl").toString() : null;
            if (img == null || img.isBlank()) {
                img = "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80";
            }
            product.setImageUrl(img);

            if (payload.get("galleryImages") != null && !payload.get("galleryImages").toString().isBlank()) {
                product.setGalleryImages(payload.get("galleryImages").toString());
            } else {
                product.setGalleryImages(img);
            }

            product.setIsActive(payload.get("isActive") == null || Boolean.parseBoolean(payload.get("isActive").toString()));
            product.setIsFeatured(payload.get("isFeatured") != null && Boolean.parseBoolean(payload.get("isFeatured").toString()));
            product.setIsBestSeller(payload.get("isBestSeller") != null && Boolean.parseBoolean(payload.get("isBestSeller").toString()));
            product.setRating(4.8);
            product.setReviewCount(1);

            // Generate unique slug
            String baseSlug = name.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
            if (baseSlug.isBlank()) baseSlug = "cosmetic-product";
            String uniqueSlug = baseSlug;
            int slugIndex = 1;
            while (productRepository.findBySlug(uniqueSlug).isPresent()) {
                uniqueSlug = baseSlug + "-" + (slugIndex++);
            }
            product.setSlug(uniqueSlug);

            // Generate unique SKU
            String rawSku = payload.get("sku") != null ? payload.get("sku").toString().trim() : "";
            if (rawSku.isBlank()) {
                rawSku = "AL-" + (System.currentTimeMillis() % 1000000);
            }
            String uniqueSku = rawSku;
            int skuIndex = 1;
            while (productRepository.findBySku(uniqueSku).isPresent()) {
                uniqueSku = rawSku + "-" + (skuIndex++);
            }
            product.setSku(uniqueSku);

            Product saved = productRepository.save(product);

            // Create initial batch for new product
            if (saved.getStockQuantity() != null && saved.getStockQuantity() > 0) {
                try {
                    batchStockService.addNewBatch(
                            saved.getId(),
                            saved.getStockQuantity(),
                            "LOT-" + saved.getSku() + "-INIT",
                            null,
                            "2027-12",
                            "New Catalog Entry",
                            "Store Admin",
                            "Initial stock batch on creation"
                    );
                } catch (Exception be) {
                    // Ignore batch init error if duplicate
                }
            } else {
                // Record initial stock allocation in audit ledger
                stockMovementService.recordMovement(
                        saved,
                        "INITIAL",
                        0,
                        0,
                        0,
                        "NEW_PRODUCT",
                        "Store Admin",
                        "Initial product created with 0 stock"
                );
            }

            // Immediate push to Zoho Inventory
            try {
                String zohoId = zohoInventoryService.createOrUpdateItem(saved);
                if (zohoId != null) {
                    saved.setZohoItemId(zohoId);
                    saved = productRepository.save(saved);
                }
            } catch (Exception ze) {
                // Ignore Zoho sync error on creation
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to create product"));
        }
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        return productRepository.findById(id).map(p -> {
            try {
                if (payload.containsKey("name") && payload.get("name") != null && !payload.get("name").toString().isBlank()) {
                    p.setName(payload.get("name").toString().trim());
                }
                if (payload.containsKey("price") && payload.get("price") != null && !payload.get("price").toString().isBlank()) {
                    p.setPrice(new BigDecimal(payload.get("price").toString()));
                }
                if (payload.containsKey("originalPrice") && payload.get("originalPrice") != null && !payload.get("originalPrice").toString().isBlank()) {
                    p.setOriginalPrice(new BigDecimal(payload.get("originalPrice").toString()));
                }
                if (payload.containsKey("discountPercent") && payload.get("discountPercent") != null && !payload.get("discountPercent").toString().isBlank()) {
                    p.setDiscountPercent(Double.valueOf(payload.get("discountPercent").toString()).intValue());
                }
                if (payload.containsKey("stockQuantity") && payload.get("stockQuantity") != null && !payload.get("stockQuantity").toString().isBlank()) {
                    p.setStockQuantity(Double.valueOf(payload.get("stockQuantity").toString()).intValue());
                }
                if (payload.containsKey("brand") && payload.get("brand") != null) {
                    p.setBrand(payload.get("brand").toString());
                }
                if (payload.containsKey("subCategory") && payload.get("subCategory") != null) {
                    p.setSubCategory(payload.get("subCategory").toString());
                }
                if (payload.containsKey("volume") && payload.get("volume") != null) {
                    p.setVolume(payload.get("volume").toString());
                }
                if (payload.containsKey("variantsJson")) {
                    p.setVariantsJson(payload.get("variantsJson") != null ? payload.get("variantsJson").toString() : null);
                }
                if (payload.containsKey("skinType") && payload.get("skinType") != null) {
                    p.setSkinType(payload.get("skinType").toString());
                }
                if (payload.containsKey("description") && payload.get("description") != null) {
                    String d = payload.get("description").toString();
                    p.setDescription(d.length() > 1900 ? d.substring(0, 1900) : d);
                }
                if (payload.containsKey("keyIngredients") && payload.get("keyIngredients") != null) {
                    String ki = payload.get("keyIngredients").toString();
                    p.setKeyIngredients(ki.length() > 950 ? ki.substring(0, 950) : ki);
                }
                if (payload.containsKey("howToUse") && payload.get("howToUse") != null) {
                    String htu = payload.get("howToUse").toString();
                    p.setHowToUse(htu.length() > 950 ? htu.substring(0, 950) : htu);
                }
                if (payload.containsKey("imageUrl") && payload.get("imageUrl") != null && !payload.get("imageUrl").toString().isBlank()) {
                    p.setImageUrl(payload.get("imageUrl").toString());
                }
                if (payload.containsKey("galleryImages") && payload.get("galleryImages") != null) {
                    p.setGalleryImages(payload.get("galleryImages").toString());
                }
                if (payload.containsKey("isActive")) {
                    p.setIsActive(Boolean.parseBoolean(payload.get("isActive").toString()));
                }
                if (payload.containsKey("isFeatured")) {
                    p.setIsFeatured(Boolean.parseBoolean(payload.get("isFeatured").toString()));
                }
                if (payload.containsKey("isBestSeller")) {
                    p.setIsBestSeller(Boolean.parseBoolean(payload.get("isBestSeller").toString()));
                }

                Product saved = productRepository.save(p);

                // Push updated rates & info to Zoho
                try {
                    String zohoId = zohoInventoryService.createOrUpdateItem(saved);
                    if (zohoId != null && (saved.getZohoItemId() == null || saved.getZohoItemId().isBlank())) {
                        saved.setZohoItemId(zohoId);
                        saved = productRepository.save(saved);
                    }
                } catch (Exception ze) {
                    // Ignore
                }

                return ResponseEntity.ok(saved);
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to update product"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/products/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        return productRepository.findById(id).map(p -> {
            try {
                productRepository.delete(p);
                return ResponseEntity.ok(Map.of("success", true, "message", "Product deleted successfully"));
            } catch (Exception e) {
                p.setIsActive(false);
                productRepository.save(p);
                return ResponseEntity.ok(Map.of("success", true, "message", "Product deactivated"));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/products/{id}/stock")
    public ResponseEntity<?> updateStock(@PathVariable Long id, @RequestBody Map<String, Integer> payload) {
        return productRepository.findById(id).map(p -> {
            int prev = p.getStockQuantity() != null ? p.getStockQuantity() : 0;
            if (payload.containsKey("stockQuantity")) {
                int next = payload.get("stockQuantity");
                int delta = next - prev;
                p.setStockQuantity(next);
                if (delta != 0) {
                    stockMovementService.recordMovement(
                            p,
                            delta > 0 ? "RESTOCK" : "ADJUSTMENT",
                            delta,
                            prev,
                            next,
                            "QUICK_EDIT",
                            "Store Admin",
                            delta > 0 ? "Dashboard quick restock" : "Dashboard stock correction"
                    );
                }
            }
            if (payload.containsKey("isActive")) {
                p.setIsActive(payload.get("isActive") == 1);
            }
            Product saved = productRepository.save(p);
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/products/{id}/stock-history")
    public ResponseEntity<?> getProductStockHistory(@PathVariable Long id) {
        return ResponseEntity.ok(stockMovementService.getHistoryForProduct(id));
    }

    @GetMapping("/stock-history")
    public ResponseEntity<?> getAllStockHistory() {
        return ResponseEntity.ok(stockMovementService.getAllHistory());
    }

    @PostMapping("/products/{id}/adjust-stock")
    public ResponseEntity<?> adjustProductStock(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Integer delta = payload.get("delta") != null && !payload.get("delta").toString().isBlank()
                    ? Integer.valueOf(payload.get("delta").toString())
                    : null;
            Integer targetStock = payload.get("targetStock") != null && !payload.get("targetStock").toString().isBlank()
                    ? Integer.valueOf(payload.get("targetStock").toString())
                    : null;
            boolean isAdditive = payload.get("isAdditive") == null || Boolean.parseBoolean(payload.get("isAdditive").toString());
            String performedBy = payload.get("performedBy") != null ? payload.get("performedBy").toString() : "Store Admin";
            String notes = payload.get("notes") != null ? payload.get("notes").toString() : "";
            String movementType = payload.get("movementType") != null ? payload.get("movementType").toString() : null;

            StockMovementService.StockAdjustmentResult result = stockMovementService.adjustStock(
                    id, delta, targetStock, isAdditive, performedBy, notes, movementType
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "product", result.product(),
                    "movement", result.movement()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage() != null ? e.getMessage() : "Adjustment failed"));
        }
    }

    // ==========================================
    // BATCH-LEVEL INVENTORY REST ENDPOINTS
    // ==========================================

    @GetMapping("/products/{id}/batches")
    public ResponseEntity<?> getProductBatches(@PathVariable Long id) {
        return ResponseEntity.ok(batchStockService.getBatchesForProduct(id));
    }

    @GetMapping("/batches/{batchNumber}")
    public ResponseEntity<?> getBatchByNumber(@PathVariable String batchNumber) {
        return batchStockService.getBatchByNumber(batchNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/batches/search")
    public ResponseEntity<?> searchBatches(@RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(batchStockService.searchBatches(query));
    }

    @PostMapping("/products/{id}/batches")
    public ResponseEntity<?> createProductBatch(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            if (payload.get("quantity") == null || payload.get("quantity").toString().isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Quantity is required"));
            }
            int quantity = Integer.parseInt(payload.get("quantity").toString());
            String customBatch = payload.get("customBatchNumber") != null ? payload.get("customBatchNumber").toString() : null;
            BigDecimal costPrice = payload.get("costPrice") != null && !payload.get("costPrice").toString().isBlank()
                    ? new BigDecimal(payload.get("costPrice").toString())
                    : null;
            String expiry = payload.get("expiryDate") != null ? payload.get("expiryDate").toString() : null;
            String supplier = payload.get("supplierName") != null ? payload.get("supplierName").toString() : null;
            String performedBy = payload.get("performedBy") != null ? payload.get("performedBy").toString() : "Store Admin";
            String notes = payload.get("notes") != null ? payload.get("notes").toString() : "";

            ProductBatch batch = batchStockService.addNewBatch(
                    id, quantity, customBatch, costPrice, expiry, supplier, performedBy, notes
            );

            Product updatedProduct = productRepository.findById(id).orElse(null);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "batch", batch,
                    "product", updatedProduct != null ? updatedProduct : Map.of()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage() != null ? e.getMessage() : "Failed to create batch"));
        }
    }

    @PostMapping("/batches/{batchNumber}/adjust")
    public ResponseEntity<?> adjustBatch(@PathVariable String batchNumber, @RequestBody Map<String, Object> payload) {
        try {
            String adjustmentType = payload.get("adjustmentType") != null ? payload.get("adjustmentType").toString() : "DEFECTIVE";
            Integer quantity = payload.get("quantity") != null && !payload.get("quantity").toString().isBlank()
                    ? Integer.parseInt(payload.get("quantity").toString())
                    : 1;
            String reason = payload.get("reason") != null ? payload.get("reason").toString() : "";
            String performedBy = payload.get("performedBy") != null ? payload.get("performedBy").toString() : "Store Admin";

            BatchStockService.BatchAdjustmentResult result = batchStockService.adjustBatch(
                    batchNumber, adjustmentType, quantity, performedBy, reason
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "batch", result.batch(),
                    "product", result.product(),
                    "movement", result.movement()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage() != null ? e.getMessage() : "Failed to adjust batch"));
        }
    }

    @PostMapping("/products/{id}/sync-zoho")
    public ResponseEntity<?> syncSingleProductToZoho(@PathVariable Long id) {
        return productRepository.findById(id).map(p -> {
            try {
                String zohoId = zohoInventoryService.createOrUpdateItem(p);
                if (zohoId != null) {
                    p.setZohoItemId(zohoId);
                    productRepository.save(p);
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "zohoItemId", zohoId,
                            "message", "Synced " + p.getName() + " with Zoho Inventory (Item ID: " + zohoId + ")"
                    ));
                } else {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Zoho did not return an item ID"));
                }
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
            }
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/products/upload-images")
    public ResponseEntity<?> uploadProductImages(@RequestParam("files") MultipartFile[] files) {
        try {
            if (files == null || files.length == 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "No files uploaded"));
            }
            List<ImageStorageService.UploadedImageDTO> uploaded = imageStorageService.storeAndResizeMultiple(files);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "count", uploaded.size(),
                    "images", uploaded
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage() != null ? e.getMessage() : "Failed to upload images"
            ));
        }
    }

    @PostMapping("/products/upload-image")
    public ResponseEntity<?> uploadSingleProductImage(@RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "File is empty"));
            }
            ImageStorageService.UploadedImageDTO uploaded = imageStorageService.storeAndResize(file);
            return ResponseEntity.ok(uploaded);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage() != null ? e.getMessage() : "Failed to upload image"
            ));
        }
    }

    @GetMapping("/orders")
    public ResponseEntity<List<CustomerOrder>> getAdminOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @PostMapping("/orders/{id}/retry-zoho")
    public ResponseEntity<?> retryZohoOrderSync(@PathVariable Long id) {
        try {
            CustomerOrder updated = orderService.retryZohoSync(id);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/orders/{id}/refund")
    public ResponseEntity<?> refundOrder(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        try {
            String reason = (payload != null && payload.get("reason") != null && !payload.get("reason").isBlank())
                    ? payload.get("reason")
                    : "Admin initiated customer refund";
            CustomerOrder refunded = orderService.processRefund(id, reason, "Store Admin");
            return ResponseEntity.ok(refunded);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to process refund"));
        }
    }

    /**
     * Requirement 2: Deliver order simulation (manual admin trigger)
     */
    @PostMapping("/orders/{id}/deliver")
    public ResponseEntity<?> deliverOrder(@PathVariable Long id) {
        try {
            CustomerOrder delivered = orderService.markOrderDelivered(id);
            return ResponseEntity.ok(delivered);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Requirement 5: Doorstep NDR / Delivery Failure Emulation
     */
    @PostMapping("/orders/{id}/fail-delivery")
    public ResponseEntity<?> failDelivery(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        try {
            String reasonCode = payload.getOrDefault("reasonCode", "CUSTOMER_UNREACHABLE");
            String notes = payload.get("notes");
            CustomerOrder failed = orderService.failDeliveryAtDoorstep(id, reasonCode, notes);
            return ResponseEntity.ok(failed);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Requirement: Re-attempt delivery from XpressBees Simulator
     */
    @PostMapping("/orders/{id}/retry-delivery")
    public ResponseEntity<?> retryDelivery(@PathVariable Long id) {
        try {
            CustomerOrder retried = orderService.retryDelivery(id);
            return ResponseEntity.ok(retried);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Requirement 6 & 7: Verify reverse pickup examination and issue refund/exchange dispatch
     */
    @PostMapping("/returns/{returnId}/verify-pickup")
    public ResponseEntity<?> verifyPickup(@PathVariable Long returnId, @RequestBody Map<String, Object> payload) {
        try {
            boolean passed = Boolean.TRUE.equals(payload.get("passed"));
            String inspectionNotes = (String) payload.get("inspectionNotes");
            com.daivatech.ecommerce.entity.OrderReturnExchange verified = orderService.verifyReversePickup(returnId, passed, inspectionNotes);
            return ResponseEntity.ok(verified);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Advance reverse pickup status for logistics simulation (e.g. Agent Out for Pickup)
     */
    @PostMapping("/returns/{returnId}/simulate-status")
    public ResponseEntity<?> simulateReturnStatus(@PathVariable Long returnId, @RequestBody Map<String, String> payload) {
        try {
            String newStatus = payload.get("status"); // "OUT_FOR_PICKUP"
            com.daivatech.ecommerce.entity.OrderReturnExchange item = orderService.getReturnExchangeById(returnId);
            if (item == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Return not found"));
            }
            if (newStatus != null && !newStatus.isBlank()) {
                item.setCourierStatus(newStatus);
                item.setStatus(newStatus);
            }
            return ResponseEntity.ok(orderService.saveReturnExchange(item));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Requirement: Doorstep Return Pickup NDR / Delivery Partner Reschedule
     */
    @PostMapping("/returns/{returnId}/fail-pickup")
    public ResponseEntity<?> failReturnPickup(@PathVariable Long returnId, @RequestBody Map<String, String> payload) {
        try {
            String reason = payload.getOrDefault("reasonCode", "CUSTOMER_UNREACHABLE");
            String notes = payload.get("notes");
            com.daivatech.ecommerce.entity.OrderReturnExchange failed = orderService.failReturnPickup(returnId, reason, notes);
            return ResponseEntity.ok(failed);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Requirement: Reschedule / Retry Return Pickup
     */
    @PostMapping("/returns/{returnId}/retry-pickup")
    public ResponseEntity<?> retryReturnPickup(@PathVariable Long returnId) {
        try {
            com.daivatech.ecommerce.entity.OrderReturnExchange retried = orderService.retryReturnPickup(returnId);
            return ResponseEntity.ok(retried);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/returns")
    public ResponseEntity<?> getAllReturns() {
        return ResponseEntity.ok(orderService.getAllReturnExchanges());
    }

    /**
     * Purge all test order data across Local DB, customer history, and Zoho Inventory
     */
    @DeleteMapping("/orders/clear-all")
    public ResponseEntity<?> clearAllOrdersDelete() {
        try {
            Map<String, Object> result = orderService.clearAllOrders();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/orders/clear-all")
    public ResponseEntity<?> clearAllOrdersPost() {
        try {
            Map<String, Object> result = orderService.clearAllOrders();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/zoho/status")
    public ResponseEntity<?> getZohoStatus() {
        boolean configured = zohoAuthService.isConfigured();
        boolean connected = false;
        String message = "Not configured";

        if (configured) {
            try {
                connected = zohoInventoryService.testConnection();
                message = connected ? "Connected to Zoho Inventory/Books" : "Connection failed (Check Refresh Token or Client ID)";
            } catch (Exception e) {
                message = "Error: " + e.getMessage();
            }
        }

        return ResponseEntity.ok(Map.of(
                "isConfigured", configured,
                "isConnected", connected,
                "statusMessage", message
        ));
    }

    @PostMapping("/zoho/sync")
    public ResponseEntity<?> syncFromZoho() {
        try {
            int count = productService.syncFromZoho();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Successfully synced " + count + " items from Zoho Inventory.",
                    "syncedCount", count
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/zoho/push")
    public ResponseEntity<?> pushToZoho() {
        try {
            int count = productService.pushAllToZoho();
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Successfully uploaded " + count + " cosmetics products directly to Zoho Inventory!",
                    "pushedCount", count
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/zoho/items")
    public ResponseEntity<?> getZohoRawItems() {
        try {
            JsonNode items = zohoInventoryService.getItems();
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/email/status")
    public ResponseEntity<?> getEmailStatus() {
        return ResponseEntity.ok(emailService.getStatus());
    }

    @GetMapping("/email/logs")
    public ResponseEntity<?> getEmailLogs() {
        return ResponseEntity.ok(emailService.getRecentLogs());
    }

    @PostMapping("/email/test")
    public ResponseEntity<?> sendTestEmail(@RequestBody Map<String, String> payload) {
        String recipient = payload.get("email");
        String type = payload.getOrDefault("type", "GENERAL");
        if (recipient == null || recipient.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Recipient email address is required"));
        }
        boolean sent = emailService.sendTestEmail(recipient, type);
        return ResponseEntity.ok(Map.of(
                "success", sent,
                "message", "Test email processed for " + recipient + " (Type: " + type + ")",
                "status", emailService.getStatus()
        ));
    }

    @PostMapping("/products/reseed-catalog")
    public ResponseEntity<?> reseedCatalog() {
        dataInitializer.seedCosmetics();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Catalog successfully seeded with 20 real Myntra beauty products across all 6 categories with 4 high-res gallery images each!",
                "count", productRepository.count()
        ));
    }
}
