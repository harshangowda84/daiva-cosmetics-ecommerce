package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping("/products")
    public ResponseEntity<List<Product>> getProducts(
            @RequestParam(required = false) String subCategory,
            @RequestParam(required = false) String skinType,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) String sortBy
    ) {
        List<Product> products = productService.filterAndSort(subCategory, skinType, minPrice, maxPrice, sortBy);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/products/slug/{slug}")
    public ResponseEntity<?> getProductBySlug(@PathVariable String slug) {
        return productService.getProductBySlug(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/products/search")
    public ResponseEntity<List<Product>> searchProducts(@RequestParam(name = "q", defaultValue = "") String query) {
        List<Product> results = productService.searchProducts(query);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/products/featured")
    public ResponseEntity<List<Product>> getFeatured() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }

    @GetMapping("/products/bestsellers")
    public ResponseEntity<List<Product>> getBestSellers() {
        return ResponseEntity.ok(productService.getBestSellers());
    }

    @GetMapping("/categories")
    public ResponseEntity<?> getCategories() {
        Map<String, Object> data = Map.of(
                "mainCategory", "Cosmetics",
                "subCategories", List.of(
                        "All",
                        "Serums & Treatments",
                        "Moisturizers",
                        "Lip Care & Makeup",
                        "Sun Care",
                        "Face Makeup",
                        "Cleansers"
                ),
                "skinTypes", List.of(
                        "All Skin Types",
                        "Dry & Sensitive",
                        "Oily / Acne-Prone",
                        "Mature & Normal"
                )
        );
        return ResponseEntity.ok(data);
    }
}
