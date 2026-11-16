package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductService.class);

    private final ProductRepository productRepository;
    private final ZohoInventoryService zohoInventoryService;

    public ProductService(ProductRepository productRepository, ZohoInventoryService zohoInventoryService) {
        this.productRepository = productRepository;
        this.zohoInventoryService = zohoInventoryService;
    }

    public List<Product> getAllActiveProducts() {
        return productRepository.findAll().stream()
                .filter(Product::getIsActive)
                .collect(Collectors.toList());
    }

    public Optional<Product> getProductBySlug(String slug) {
        return productRepository.findBySlug(slug);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> getFeaturedProducts() {
        return productRepository.findByIsFeaturedTrue();
    }

    public List<Product> getBestSellers() {
        return productRepository.findByIsBestSellerTrue();
    }

    public List<Product> searchProducts(String query) {
        if (query == null || query.trim().isEmpty()) {
            return getAllActiveProducts();
        }
        return productRepository.searchProducts(query.trim());
    }

    public List<Product> filterAndSort(String subCategory, String skinType, BigDecimal minPrice, BigDecimal maxPrice, String sortBy) {
        List<Product> products = getAllActiveProducts();

        if (subCategory != null && !subCategory.equalsIgnoreCase("ALL") && !subCategory.isBlank()) {
            String decodedSubCategory;
            try {
                decodedSubCategory = URLDecoder.decode(subCategory, StandardCharsets.UTF_8);
            } catch (Exception e) {
                decodedSubCategory = subCategory;
            }
            final String targetSubCat = decodedSubCategory;
            products = products.stream()
                    .filter(p -> p.getSubCategory() != null && (p.getSubCategory().equalsIgnoreCase(targetSubCat) || p.getSubCategory().equalsIgnoreCase(subCategory)))
                    .collect(Collectors.toList());
        }

        if (skinType != null && !skinType.equalsIgnoreCase("ALL") && !skinType.equalsIgnoreCase("ALL SKIN TYPES") && !skinType.isBlank()) {
            String decodedSkinType;
            try {
                decodedSkinType = URLDecoder.decode(skinType, StandardCharsets.UTF_8);
            } catch (Exception e) {
                decodedSkinType = skinType;
            }
            final String targetSkin = decodedSkinType.toLowerCase();
            products = products.stream()
                    .filter(p -> {
                        if (p.getSkinType() == null) return false;
                        String pSkin = p.getSkinType().toLowerCase();
                        return pSkin.contains(targetSkin) || pSkin.contains("all skin types") || targetSkin.contains(pSkin);
                    })
                    .collect(Collectors.toList());
        }

        if (minPrice != null) {
            products = products.stream()
                    .filter(p -> p.getPrice().compareTo(minPrice) >= 0)
                    .collect(Collectors.toList());
        }

        if (maxPrice != null) {
            products = products.stream()
                    .filter(p -> p.getPrice().compareTo(maxPrice) <= 0)
                    .collect(Collectors.toList());
        }

        if (sortBy != null) {
            switch (sortBy.toLowerCase()) {
                case "price_asc":
                    products.sort(Comparator.comparing(Product::getPrice));
                    break;
                case "price_desc":
                    products.sort(Comparator.comparing(Product::getPrice).reversed());
                    break;
                case "rating":
                    products.sort(Comparator.comparing(Product::getRating).reversed());
                    break;
                case "newest":
                default:
                    products.sort(Comparator.comparing(Product::getId).reversed());
                    break;
            }
        }

        return products;
    }

    /**
     * Pushes all local DB products into Zoho Inventory (creates or updates items)
     */
    @Transactional
    public int pushAllToZoho() {
        List<Product> products = productRepository.findAll();
        int pushedCount = 0;
        for (Product product : products) {
            try {
                String zohoId = zohoInventoryService.createOrUpdateItem(product);
                if (zohoId != null) {
                    product.setZohoItemId(zohoId);
                    productRepository.save(product);
                    pushedCount++;
                }
            } catch (Exception e) {
                log.error("Failed to push product {} ({}) to Zoho: {}", product.getName(), product.getSku(), e.getMessage());
            }
        }
        log.info("Successfully pushed {} products to Zoho Inventory", pushedCount);
        return pushedCount;
    }

    /**
     * Complete two-way sync:
     * 1. Pushes any products without zohoItemId to Zoho Inventory
     * 2. Pulls all items from Zoho Inventory to update stock & rates in local DB
     */
    @Transactional
    public int syncFromZoho() {
        // Step 1: Push any unsynced products to Zoho
        List<Product> unsynced = productRepository.findAll().stream()
                .filter(p -> p.getZohoItemId() == null || p.getZohoItemId().isBlank())
                .collect(Collectors.toList());

        for (Product p : unsynced) {
            try {
                String zohoId = zohoInventoryService.createOrUpdateItem(p);
                if (zohoId != null) {
                    p.setZohoItemId(zohoId);
                    productRepository.save(p);
                }
            } catch (Exception e) {
                log.error("Auto-push to Zoho failed for {}: {}", p.getName(), e.getMessage());
            }
        }

        // Step 2: Pull all items from Zoho and sync stock / rates / IDs
        try {
            JsonNode itemsResponse = zohoInventoryService.getItems();
            if (itemsResponse == null || !itemsResponse.has("items")) {
                log.warn("Zoho getItems response contains no items node.");
                return unsynced.size();
            }

            JsonNode items = itemsResponse.get("items");
            int syncedCount = 0;

            for (JsonNode item : items) {
                String zohoItemId = item.has("item_id") ? item.get("item_id").asText() : null;
                String sku = item.has("sku") ? item.get("sku").asText() : null;
                String name = item.has("name") ? item.get("name").asText() : null;
                double rate = item.has("rate") ? item.get("rate").asDouble() : 0.0;
                int stock = item.has("stock_on_hand") ? item.get("stock_on_hand").asInt() : 10;

                if (zohoItemId == null) continue;

                // Match by SKU, then by Zoho ID, then by Name
                Optional<Product> existing = Optional.empty();
                if (sku != null && !sku.isBlank()) {
                    existing = productRepository.findBySku(sku);
                }
                if (existing.isEmpty()) {
                    existing = productRepository.findByZohoItemId(zohoItemId);
                }
                if (existing.isEmpty() && name != null) {
                    existing = productRepository.findAll().stream()
                            .filter(p -> p.getName().equalsIgnoreCase(name) || (p.getName().length() > 8 && name.toLowerCase().contains(p.getName().toLowerCase().substring(0, 8))))
                            .findFirst();
                }

                if (existing.isPresent()) {
                    Product p = existing.get();
                    p.setZohoItemId(zohoItemId);
                    if (stock >= 0) {
                        p.setStockQuantity(stock);
                    }
                    if (rate > 0) {
                        p.setPrice(BigDecimal.valueOf(rate));
                    }
                    productRepository.save(p);
                    syncedCount++;
                }
            }
            log.info("Successfully synced {} items between Zoho and local DB", syncedCount);
            return syncedCount;
        } catch (Exception e) {
            log.error("Zoho catalog sync failed: {}", e.getMessage(), e);
            throw new RuntimeException("Zoho catalog sync failed: " + e.getMessage(), e);
        }
    }

    public Product saveProduct(Product product) {
        return productRepository.save(product);
    }
}
