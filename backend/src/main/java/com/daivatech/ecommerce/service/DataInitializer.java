package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.entity.StockMovement;
import com.daivatech.ecommerce.entity.User;
import com.daivatech.ecommerce.repository.ProductRepository;
import com.daivatech.ecommerce.repository.StockMovementRepository;
import com.daivatech.ecommerce.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final StockMovementRepository stockMovementRepository;
    private final BatchStockService batchStockService;
    private final com.daivatech.ecommerce.repository.UserAddressRepository addressRepository;
    private final com.daivatech.ecommerce.repository.SiteSettingRepository siteSettingRepository;
    private final com.daivatech.ecommerce.repository.CustomerOrderRepository orderRepository;
    private final com.daivatech.ecommerce.repository.UserBrowsingHistoryRepository browsingHistoryRepository;
    private final com.daivatech.ecommerce.repository.WishlistItemRepository wishlistItemRepository;
    private final com.daivatech.ecommerce.repository.CartItemRepository cartItemRepository;

    public DataInitializer(ProductRepository productRepository,
                           UserRepository userRepository,
                           StockMovementRepository stockMovementRepository,
                           BatchStockService batchStockService,
                           com.daivatech.ecommerce.repository.UserAddressRepository addressRepository,
                           com.daivatech.ecommerce.repository.SiteSettingRepository siteSettingRepository,
                           com.daivatech.ecommerce.repository.CustomerOrderRepository orderRepository,
                           com.daivatech.ecommerce.repository.UserBrowsingHistoryRepository browsingHistoryRepository,
                           com.daivatech.ecommerce.repository.WishlistItemRepository wishlistItemRepository,
                           com.daivatech.ecommerce.repository.CartItemRepository cartItemRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.batchStockService = batchStockService;
        this.addressRepository = addressRepository;
        this.siteSettingRepository = siteSettingRepository;
        this.orderRepository = orderRepository;
        this.browsingHistoryRepository = browsingHistoryRepository;
        this.wishlistItemRepository = wishlistItemRepository;
        this.cartItemRepository = cartItemRepository;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedCosmetics();
        seedInitialStockMovements();
        batchStockService.ensureInitialBatchesExist();
        seedDefaultAddresses();
        seedSiteSettings();
    }

    private void seedSiteSettings() {
        if (siteSettingRepository.count() == 0) {
            java.util.Map<String, String> defaults = new java.util.HashMap<>();
            // Brand & Footer Settings
            defaults.put("site_name", "AURA LUXE");
            defaults.put("brand_tagline", "Curated luxury cosmetics, clean clinical skincare, and nourishing botanicals crafted to bring out your skin's natural luminescence.");
            defaults.put("contact_phone", "+91 98765 43210");
            defaults.put("contact_email", "support@auraluxe.com");
            defaults.put("contact_hours", "Mon - Sat, 9:30 AM – 6:30 PM IST");
            defaults.put("warehouse_address", "124, 4th Cross, Indiranagar, Bengaluru, Karnataka - 560038, India");
            defaults.put("compliance_note", "Compliant with Consumer Protection (E-Commerce) Rules 2020 and Indian IT Act.");
            defaults.put("copyright_text", "© 2026 AURA LUXE Cosmetics. All Rights Reserved.");
            defaults.put("instagram_url", "https://instagram.com/auraluxecosmetics");
            defaults.put("facebook_url", "https://facebook.com/auraluxecosmetics");
            defaults.put("youtube_url", "https://youtube.com/@auraluxecosmetics");
            defaults.put("whatsapp_number", "+91 98765 43210");
            defaults.put("value_prop_1_title", "100% Organic");
            defaults.put("value_prop_1_subtitle", "Certified Botanical Actives");
            defaults.put("value_prop_2_title", "Dermatologist Tested");
            defaults.put("value_prop_2_subtitle", "Gentle & Safe for All Skin");
            defaults.put("value_prop_3_title", "Express Delivery");
            defaults.put("value_prop_3_subtitle", "Fast 2-3 Day Pan-India");
            defaults.put("value_prop_4_title", "Cruelty Free");
            defaults.put("value_prop_4_subtitle", "100% PETA Certified");

            // Policy: Refund & Cancellation
            defaults.put("refund_policy_title", "Refund & Cancellation Policy");
            defaults.put("refund_policy_last_updated", "November 2026");
            defaults.put("refund_policy_guarantee_badge", "7-Day Hassle-Free Return Guarantee");
            defaults.put("refund_policy_guarantee_text", "If your cosmetic product arrives damaged, leaked, or incorrect, you are eligible for an immediate replacement or full refund within 7 days of delivery.");
            defaults.put("refund_policy_cancellation_terms", "You can cancel your order any time prior to warehouse dispatch by visiting your My Orders tab or emailing support@auraluxe.com. Once dispatched with our courier partner (Xpressbees), shipments cannot be recalled in transit; you may refuse delivery at your doorstep or initiate a return upon receipt.");
            defaults.put("refund_policy_hygiene_seal", "Due to FDA and cosmetic health & safety regulations, opened cosmetic items, lip tints, and facial creams cannot be returned once their tamper-evident protective seal is broken, unless the formula is defective or damaged during transit.");
            defaults.put("refund_policy_timeline_prepaid", "Razorpay Prepaid (UPI, Cards, NetBanking): Credited to your bank account within 5–7 business days.");
            defaults.put("refund_policy_timeline_cod", "Cash on Delivery (COD): Refunded via IMPS / UPI transfer upon receipt of customer banking details within 3–5 business days.");

            // Policy: Shipping & Delivery
            defaults.put("shipping_policy_title", "Shipping & Delivery Policy");
            defaults.put("shipping_policy_courier_partner", "Xpressbees Logistics");
            defaults.put("shipping_policy_hub_location", "Fulfilled from our temperature-controlled central hub in Bengaluru via Xpressbees Air & Surface Express.");
            defaults.put("shipping_policy_metro_tat", "Metro Cities (Bengaluru, Mumbai, Delhi-NCR, Chennai, Hyderabad, Kolkata): 2–3 business days.");
            defaults.put("shipping_policy_tier2_tat", "Tier 2 & 3 Cities across India: 3–5 business days.");
            defaults.put("shipping_policy_same_day_cutoff", "Orders placed before 2:00 PM IST are manifested and dispatched the same day (excluding Sundays & national holidays).");
            defaults.put("shipping_policy_free_threshold", "999");
            defaults.put("shipping_policy_standard_fee", "99");
            defaults.put("shipping_policy_tracking_info", "As soon as your shipment is dispatched, you receive a unique Air Waybill (AWB) number and live tracking link via email and SMS. You can also view step-by-step milestones under your Profile > Order History page.");

            // Policy: Privacy & Data Protection
            defaults.put("privacy_policy_title", "Privacy & Data Protection Policy");
            defaults.put("privacy_policy_compliance_act", "Compliant with Section 43A of Information Technology Act 2000");
            defaults.put("privacy_policy_data_collected", "When you browse, register, or place an order on Aura Luxe, we collect your name, email, phone number, shipping address, and order transaction records strictly for order fulfillment, logistics delivery, and customer service.");
            defaults.put("privacy_policy_payment_security", "Aura Luxe does not store or process your credit/debit card numbers or UPI PINs. All payment transactions are encrypted via 256-bit SSL and processed directly by Razorpay Software Private Limited, a PCI-DSS Level 1 certified payment gateway regulated by the Reserve Bank of India (RBI).");
            defaults.put("privacy_policy_non_disclosure", "We never sell, rent, or trade your personal details to third-party marketing brokers. Address and contact details are shared strictly with our contracted courier partner (Xpressbees) solely to facilitate delivery.");

            // Policy: Terms of Service
            defaults.put("terms_policy_title", "Terms of Service");
            defaults.put("terms_policy_subtitle", "Binding e-commerce terms of use");
            defaults.put("terms_policy_patch_test", "While our formulations utilize dermatologically validated botanical extracts, individual skin chemistry varies. We recommend performing a 24-hour patch test on the inner wrist or behind the ear before full facial application.");
            defaults.put("terms_policy_pricing_currency", "All catalog prices are listed in Indian Rupees (INR) and are inclusive of Goods & Services Tax (GST). Aura Luxe reserves the right to modify prices, bundle discounts, and inventory availability without prior notice.");
            defaults.put("terms_policy_jurisdiction", "Any dispute arising from transactions on this platform shall be governed by the laws of India and subject to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.");

            // Policy: Grievance Officer
            defaults.put("grievance_policy_title", "Contact Us & Grievance Redressal");
            defaults.put("grievance_policy_officer_name", "Priya S. Narang");
            defaults.put("grievance_policy_officer_designation", "Nodal Officer - Grievance & Compliance");
            defaults.put("grievance_policy_officer_email", "grievance@auraluxe.com");
            defaults.put("grievance_policy_officer_phone", "+91 98765 43210");
            defaults.put("grievance_policy_turnaround_sla", "Acknowledgment within 48 hours; resolution within 30 days");
            defaults.put("grievance_policy_warehouse_address", "124, 4th Cross, Indiranagar, Bengaluru, Karnataka - 560038, India");

            for (java.util.Map.Entry<String, String> entry : defaults.entrySet()) {
                siteSettingRepository.save(new com.daivatech.ecommerce.entity.SiteSetting(entry.getKey(), entry.getValue()));
            }
            log.info("Seeded initial default Site & Policy settings (total: " + defaults.size() + ")");
        }

        // Ensure PLP, PDP and Navbar category settings exist
        String[][] essentialSettings = {
                {"plp_show_badges", "true"},
                {"plp_show_rating", "true"},
                {"plp_show_volume_pill", "true"},
                {"plp_show_stock_badge", "true"},
                {"plp_show_quick_preview", "true"},
                {"plp_hover_slideshow", "true"},
                {"plp_hover_slideshow_timer", "1.5"},
                {"plp_show_share_button", "true"},
                {"plp_show_category_pills", "true"},
                {"plp_show_recently_viewed", "true"},
                {"pdp_show_volume_selector", "true"},
                {"pdp_show_whatsapp_share", "true"},
                {"pdp_show_direct_share", "true"},
                {"pdp_show_peta_cruelty_free_badge", "true"},
                {"pdp_show_dermatologist_tested_badge", "true"},
                {"pdp_show_clean_actives_badge", "true"},
                {"pdp_show_quantity_selector", "true"},
                {"pdp_show_instant_buy_now", "true"},
                {"pdp_show_reviews_section", "true"},
                {"pdp_show_ingredients_accordion", "true"},
                {"pdp_show_how_to_use_accordion", "true"},
                {"pdp_show_delivery_estimator", "true"},
                {"pdp_show_related_products", "true"},
                {"pdp_show_recently_viewed", "true"},
                {"navbar_categories_json", "[{\"id\":\"serums\",\"name\":\"Serums & Treatments\",\"slug\":\"Serums & Treatments\",\"badge\":\"Best Seller\",\"active\":true},{\"id\":\"moisturizers\",\"name\":\"Moisturizers\",\"slug\":\"Moisturizers\",\"active\":true},{\"id\":\"lipcare\",\"name\":\"Lip Care & Makeup\",\"slug\":\"Lip Care & Makeup\",\"badge\":\"Trending\",\"active\":true},{\"id\":\"suncare\",\"name\":\"Sun Care\",\"slug\":\"Sun Care\",\"badge\":\"SPF 50+\",\"active\":true},{\"id\":\"facemakeup\",\"name\":\"Face Makeup\",\"slug\":\"Face Makeup\",\"active\":true},{\"id\":\"cleansers\",\"name\":\"Cleansers\",\"slug\":\"Cleansers\",\"badge\":\"Clean\",\"active\":true}]"}
        };
        for (String[] pair : essentialSettings) {
            if (!siteSettingRepository.existsById(pair[0])) {
                siteSettingRepository.save(new com.daivatech.ecommerce.entity.SiteSetting(pair[0], pair[1]));
            }
        }
    }

    private void seedDefaultAddresses() {
        userRepository.findByEmail("priya@demo.com").ifPresent(customer -> {
            if (addressRepository.findByUserId(customer.getId()).isEmpty()) {
                com.daivatech.ecommerce.entity.UserAddress home = new com.daivatech.ecommerce.entity.UserAddress(
                        customer.getId(),
                        "HOME",
                        customer.getFullName(),
                        customer.getPhone() != null ? customer.getPhone() : "+91 9123456789",
                        "Flat 402, Lotus Residency, 12th Main, HAL 2nd Stage",
                        "Indiranagar",
                        "Near Defence Colony",
                        "Bengaluru",
                        "Karnataka",
                        "560038",
                        true
                );
                addressRepository.save(home);

                com.daivatech.ecommerce.entity.UserAddress office = new com.daivatech.ecommerce.entity.UserAddress(
                        customer.getId(),
                        "OFFICE",
                        customer.getFullName(),
                        customer.getPhone() != null ? customer.getPhone() : "+91 9123456789",
                        "Aura Luxe Studio, 5th Floor, Tower B, Prestige Tech Park",
                        "Marathahalli-Sarjapur Outer Ring Road",
                        "Opposite Cessna Business Park",
                        "Bengaluru",
                        "Karnataka",
                        "560103",
                        false
                );
                addressRepository.save(office);
                log.info("Seeded initial HOME and OFFICE addresses for customer Priya Sharma");
            }
        });

        // Auto-backfill delivery address for any user with placed orders who doesn't have an address yet
        try {
            for (com.daivatech.ecommerce.entity.User u : userRepository.findAll()) {
                if (addressRepository.findByUserId(u.getId()).isEmpty()) {
                    java.util.List<com.daivatech.ecommerce.entity.CustomerOrder> userOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(u.getId());
                    if (!userOrders.isEmpty()) {
                        com.daivatech.ecommerce.entity.CustomerOrder latest = userOrders.get(0);
                        if (latest.getAddressLine() != null && !latest.getAddressLine().trim().isEmpty()) {
                            com.daivatech.ecommerce.entity.UserAddress addr = new com.daivatech.ecommerce.entity.UserAddress(
                                    u.getId(),
                                    "HOME",
                                    latest.getCustomerName() != null && !latest.getCustomerName().trim().isEmpty() ? latest.getCustomerName() : u.getFullName(),
                                    latest.getCustomerPhone() != null && !latest.getCustomerPhone().trim().isEmpty() ? latest.getCustomerPhone() : (u.getPhone() != null ? u.getPhone() : "+91 9900000000"),
                                    latest.getAddressLine(),
                                    latest.getCity() != null ? latest.getCity() : "Bengaluru",
                                    "",
                                    latest.getCity() != null ? latest.getCity() : "Bengaluru",
                                    latest.getState() != null ? latest.getState() : "Karnataka",
                                    latest.getPincode() != null ? latest.getPincode() : "560001",
                                    true
                            );
                            addressRepository.save(addr);
                            log.info("Auto-backfilled delivery address from past order for customer {}", u.getEmail());
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Address backfill error: {}", ex.getMessage());
        }
    }

    private void seedUsers() {
        if (userRepository.count() == 0) {
            User admin = new User("Store Admin", "admin@daivatech.com", "admin123", "+91 9876543210");
            admin.setRole("ADMIN");
            userRepository.save(admin);

            User customer = new User("Priya Sharma", "priya@demo.com", "demo123", "+91 9123456789");
            customer.setRole("CUSTOMER");
            customer.setAddressLine1("Flat 402, Lotus Residency, Indiranagar");
            customer.setCity("Bengaluru");
            customer.setState("Karnataka");
            customer.setPincode("560038");
            userRepository.save(customer);

            log.info("Seeded initial users: admin@daivatech.com and priya@demo.com");
        }
    }

    public void seedCosmetics() {
        if (productRepository.count() >= 120) {
            updateExistingProductZohoIds();
            return;
        }

        log.info("Seeding 120 authentic Myntra beauty and cosmetics products (20 per category)...");
        browsingHistoryRepository.deleteAll();
        wishlistItemRepository.deleteAll();
        cartItemRepository.deleteAll();
        productRepository.deleteAll();

        try (var is = getClass().getResourceAsStream("/catalog/cosmetics_120.json")) {
            if (is != null) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.List<java.util.Map<String, Object>> list = mapper.readValue(is, new com.fasterxml.jackson.core.type.TypeReference<>() {});
                java.util.List<Product> products = new java.util.ArrayList<>();
                for (var m : list) {
                    Product p = createProduct(
                            (String) m.get("name"),
                            (String) m.get("slug"),
                            (String) m.get("brand"),
                            (String) m.get("category"),
                            (String) m.get("subCategory"),
                            (String) m.get("description"),
                            new BigDecimal(String.valueOf(m.get("price"))),
                            new BigDecimal(String.valueOf(m.get("originalPrice"))),
                            ((Number) m.get("discountPercent")).intValue(),
                            ((Number) m.get("stockQuantity")).intValue(),
                            (String) m.get("sku"),
                            (String) m.get("zohoItemId"),
                            ((Number) m.get("rating")).doubleValue(),
                            ((Number) m.get("reviewCount")).intValue(),
                            (String) m.get("imageUrl"),
                            (String) m.get("galleryImages"),
                            (String) m.get("volume"),
                            (String) m.get("skinType"),
                            (String) m.get("keyIngredients"),
                            (String) m.get("howToUse"),
                            (Boolean) m.get("isFeatured"),
                            (Boolean) m.get("isBestSeller"),
                            (String) m.get("variantsJson")
                    );
                    products.add(p);
                }
                productRepository.saveAll(products);
                log.info("Successfully seeded {} authentic Myntra cosmetic products (20 per category across all 6 categories)!", products.size());
            } else {
                log.warn("/catalog/cosmetics_120.json not found on classpath!");
            }
        } catch (Exception ex) {
            log.error("Failed to seed 120 products from JSON: {}", ex.getMessage(), ex);
        }
    }

    private Product createProduct(String name, String slug, String brand, String category, String subCategory,
                                  String description, BigDecimal price, BigDecimal originalPrice, Integer discount,
                                  Integer stock, String sku, String zohoItemId, Double rating, Integer reviews,
                                  String imageUrl, String gallery, String volume, String skinType,
                                  String ingredients, String howToUse, Boolean featured, Boolean bestSeller,
                                  String variantsJson) {
        Product p = new Product();
        p.setName(name);
        p.setSlug(slug);
        p.setBrand(brand);
        p.setCategory(category);
        p.setSubCategory(subCategory);
        p.setDescription(description);
        p.setPrice(price);
        p.setOriginalPrice(originalPrice);
        p.setDiscountPercent(discount);
        p.setStockQuantity(stock);
        p.setSku(sku);
        p.setZohoItemId(zohoItemId);
        p.setRating(rating);
        p.setReviewCount(reviews);
        p.setImageUrl(imageUrl);
        p.setGalleryImages(gallery);
        p.setVolume(volume);
        p.setSkinType(skinType);
        p.setKeyIngredients(ingredients);
        p.setHowToUse(howToUse);
        p.setIsFeatured(featured);
        p.setIsBestSeller(bestSeller);
        p.setIsActive(true);
        p.setVariantsJson(variantsJson);
        return p;
    }

    private void updateExistingProductZohoIds() {
        java.util.Map<String, String> skuToZoho = java.util.Map.of(
                "LUM-SER-001", "4350014000000074001",
                "MR-LIP-002", "4350014000000074026",
                "RPS-CRM-003", "4350014000000077001",
                "MIS-SPF-005", "4350014000000077025",
                "CFF-FND-006", "4350014000000078001",
                "BGG-OIL-004", "4350014000000074050",
                "MRP-EYE-007", "4350014000000074074",
                "EAB-TON-008", "4350014000000077049"
        );

        List<Product> products = productRepository.findAll();
        boolean changed = false;
        for (Product p : products) {
            if ((p.getZohoItemId() == null || p.getZohoItemId().isBlank()) && skuToZoho.containsKey(p.getSku())) {
                p.setZohoItemId(skuToZoho.get(p.getSku()));
                changed = true;
            }

            // Seed sample size/volume variants if not yet set
            if (p.getVariantsJson() == null || p.getVariantsJson().isBlank()) {
                if ("LUM-SER-001".equalsIgnoreCase(p.getSku())) {
                    p.setVariantsJson("[{\"size\":\"10ml\",\"label\":\"10ml Travel Vial\",\"price\":449,\"originalPrice\":599,\"stock\":25,\"sku\":\"LUM-SER-001-10ML\"},{\"size\":\"30ml\",\"label\":\"30ml Standard Bottle\",\"price\":899,\"originalPrice\":1299,\"stock\":45,\"sku\":\"LUM-SER-001\"},{\"size\":\"50ml\",\"label\":\"50ml Value Size\",\"price\":1399,\"originalPrice\":1899,\"stock\":30,\"sku\":\"LUM-SER-001-50ML\"}]");
                    changed = true;
                } else if ("RPS-CRM-003".equalsIgnoreCase(p.getSku())) {
                    p.setVariantsJson("[{\"size\":\"30g\",\"label\":\"30g Travel Mini\",\"price\":649,\"originalPrice\":899,\"stock\":20,\"sku\":\"RPS-CRM-003-30G\"},{\"size\":\"50g\",\"label\":\"50g Full Jar\",\"price\":1099,\"originalPrice\":1499,\"stock\":38,\"sku\":\"RPS-CRM-003\"},{\"size\":\"100g\",\"label\":\"100g Mega Jar\",\"price\":1899,\"originalPrice\":2499,\"stock\":15,\"sku\":\"RPS-CRM-003-100G\"}]");
                    changed = true;
                } else if ("MIS-SPF-005".equalsIgnoreCase(p.getSku())) {
                    p.setVariantsJson("[{\"size\":\"50ml\",\"label\":\"50ml Pocket Tube\",\"price\":699,\"originalPrice\":899,\"stock\":50,\"sku\":\"MIS-SPF-005\"},{\"size\":\"100ml\",\"label\":\"100ml Duo Pack\",\"price\":1199,\"originalPrice\":1599,\"stock\":25,\"sku\":\"MIS-SPF-005-100ML\"}]");
                    changed = true;
                }
            }
        }
        if (changed) {
            productRepository.saveAll(products);
            log.info("Updated existing database products with corresponding Zoho Item IDs");
        }
    }

    private void seedInitialStockMovements() {
        List<Product> products = productRepository.findAll();
        for (Product p : products) {
            if (stockMovementRepository.findByProductIdOrderByCreatedAtDesc(p.getId()).isEmpty()) {
                int stock = p.getStockQuantity() != null ? p.getStockQuantity() : 20;
                StockMovement movement = new StockMovement(
                        p.getId(),
                        p.getName(),
                        p.getSku(),
                        "INITIAL",
                        stock,
                        0,
                        stock,
                        "CATALOG_INIT",
                        "System Initializer",
                        "Initial stock inventory allocation on store launch"
                );
                stockMovementRepository.save(movement);
            }
        }
    }
}
