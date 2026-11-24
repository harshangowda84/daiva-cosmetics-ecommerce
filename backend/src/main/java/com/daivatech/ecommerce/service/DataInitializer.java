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
        if (productRepository.count() >= 20) {
            updateExistingProductZohoIds();
            return;
        }

        log.info("Seeding 20 Myntra beauty & cosmetics products with 4 high-res gallery images each...");
        browsingHistoryRepository.deleteAll();
        wishlistItemRepository.deleteAll();
        cartItemRepository.deleteAll();
        productRepository.deleteAll();

        // 1. LIP CARE & MAKEUP (4 Products)
        Product p1 = createProduct(
                "Lakme Forever Matte Lightweight & Transferproof 16Hr Liquid Lipstick 5.6ml - Nude Bloom",
                "lakme-forever-matte-liquid-lipstick-nude-bloom",
                "Lakme",
                "Cosmetics",
                "Lip Care & Makeup",
                "A lightweight liquid lipstick that delivers intense color payoff in a single stroke with a smooth matte finish. The highly pigmented formula is transfer-proof, smudge-resistant, and stays comfortable on lips for up to 16 hours. Enriched with skin-friendly ingredients that keep lips looking fresh without flaking or cracking.",
                new BigDecimal("450.00"),
                new BigDecimal("450.00"),
                0,
                60,
                "LAK-LIP-001",
                "4350014000000074026",
                4.8,
                184,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/23294448/2024/3/11/178689d8-ab1a-48e8-8a79-ce8418597a5c1710154005642-Lakme-Forever-Matte-Long-Lasting-Liquid-Lip-Color-56ml---Nud-3.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/23294448/2024/3/11/178689d8-ab1a-48e8-8a79-ce8418597a5c1710154005642-Lakme-Forever-Matte-Long-Lasting-Liquid-Lip-Color-56ml---Nud-3.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/23294448/2024/3/11/ce93161c-a10b-4a3d-80bb-6e04343319561710154005661-Lakme-Forever-Matte-Long-Lasting-Liquid-Lip-Color-56ml---Nud-1.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/23294448/2024/3/11/a0d42657-8c87-4926-9fb6-f3dd56d335e51710154005651-Lakme-Forever-Matte-Long-Lasting-Liquid-Lip-Color-56ml---Nud-2.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/23294448/2024/3/11/329ee841-2a34-45f7-a912-62d97f3fe4e31710154005632-Lakme-Forever-Matte-Long-Lasting-Liquid-Lip-Color-56ml---Nud-4.jpg",
                "5.6 ml",
                "All Skin Types",
                "Matte finish, 16-Hour Long Lasting, Lightweight & Transferproof, Cruelty-Free",
                "Glide smoothly from center of upper lip towards outer corners using the precision applicator. Allow 30 seconds to set.",
                true,
                true,
                "[{\"size\":\"5.6ml - Nude Bloom\",\"label\":\"Nude Bloom\",\"price\":450,\"originalPrice\":450,\"stock\":30,\"sku\":\"LAK-LIP-001-NB\"},{\"size\":\"5.6ml - Red Wine\",\"label\":\"Red Wine\",\"price\":450,\"originalPrice\":450,\"stock\":30,\"sku\":\"LAK-LIP-001-RW\"}]"
        );

        Product p2 = createProduct(
                "ETUDE Dear Darling Water Tint 9g - Red Grapefruit Ade",
                "etude-dear-darling-water-tint-grapefruit",
                "ETUDE",
                "Cosmetics",
                "Lip Care & Makeup",
                "A vibrant, moist water lip tint infused with rich vitamin and berry fruit extracts for a revitalized, natural pop of color. The ultra-lightweight watery texture absorbs rapidly onto lips without stickiness, delivering an effortless fresh finish. Keeps lips hydrated while offering buildable color that lasts through the day.",
                new BigDecimal("360.00"),
                new BigDecimal("450.00"),
                20,
                45,
                "ETD-LIP-002",
                "4350014000000074027",
                4.9,
                210,
                "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2026/APRIL/22/dcXN3llJ_0e6541e48be54d34b6525c0b28772559.jpg",
                "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2026/APRIL/22/dcXN3llJ_0e6541e48be54d34b6525c0b28772559.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/APRIL/22/qFwAWRaK_6e58ee211eb24428b6ee70b5ee05cd28.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/APRIL/22/7kKFVb5P_2c4c9db61c4443f9a3a1d38e8d468695.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/APRIL/22/YBtdstUk_6fe3dd5a91f14c9fb6627c9445479021.jpg",
                "9 g",
                "All Skin Types",
                "Berry Fruit Extracts, Pomegranate Extract, Lightweight Water Tint, Glossy / Natural Tint Finish",
                "Dab lightly onto the center of lips and blend outwards with fingertip for a gradient Korean lip tint effect.",
                false,
                true,
                null
        );

        Product p3 = createProduct(
                "Maybelline New York Color Sensational Creamy Matte Lipstick - Burgundy Blush",
                "maybelline-creamy-matte-lipstick-burgundy-blush",
                "Maybelline",
                "Cosmetics",
                "Lip Care & Makeup",
                "A creamy matte lipstick that combines bold color pigment with hydrating nourishment for comfortable all-day wear. Infused with precious caring oils, it glides effortlessly over lips leaving a non-drying, velvety matte texture. Creates a dramatic statement lip with full opacity and smooth finish.",
                new BigDecimal("244.00"),
                new BigDecimal("349.00"),
                30,
                55,
                "MAY-LIP-003",
                "4350014000000074028",
                4.7,
                340,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/6/lcDGGQVC_ba68f5a103c2489ea8a6c2b1260e4bf7.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/6/lcDGGQVC_ba68f5a103c2489ea8a6c2b1260e4bf7.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/6/y2bRwnTk_16a4466c6fb94c909dcd8f7153e4efcd.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/6/45htRxSc_d6676fc351cf4efb960b3d2afabb1ea0.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/6/LuYPMdPU_7a5ef5b244f74ba19059e5c1d323855d.jpg",
                "3.9 g",
                "All Skin Types",
                "Shea Butter, Honey Nectar, Precious Oils, Creamy Matte Finish, Full Coverage",
                "Apply lipstick in the center of your upper lip and follow the contours of your mouth. Glide across entire bottom lip.",
                true,
                false,
                null
        );

        Product p4 = createProduct(
                "FACES CANADA Comfy Matte Wow Liquid Lipstick - Cocoa Crush",
                "faces-canada-comfy-matte-liquid-lipstick-cocoa-crush",
                "FACES CANADA",
                "Cosmetics",
                "Lip Care & Makeup",
                "An ultra-comfortable liquid lipstick formulated with almond oil and vitamin E to provide long-lasting velvety matte coverage. Delivers transfer-resistant rich pigmentation that doesn't crack or dry out lips. Designed for everyday all-day wear with a feather-light feel.",
                new BigDecimal("249.00"),
                new BigDecimal("299.00"),
                17,
                40,
                "FAC-LIP-004",
                "4350014000000074029",
                4.8,
                120,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/SEPTEMBER/20/9cb664dee729497f9714d6d7accafc46.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/SEPTEMBER/20/9cb664dee729497f9714d6d7accafc46.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/SEPTEMBER/20/1e83aaae761845e7b88172f9c186ac85.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/SEPTEMBER/20/5f327698488a4e22be7657ffaa78613c.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/SEPTEMBER/20/6ad809a0e63d4fe98c9b10d5dd81de44.jpg",
                "3.8 ml",
                "All Skin Types",
                "Almond Oil, Vitamin E, Transfer-Resistant, 12-Hour Long Lasting, Paraben-Free",
                "Apply with the precision applicator for an even layer of rich pigment. Dries down to an airy matte in seconds.",
                false,
                false,
                null
        );

        // 2. FACE MAKEUP (4 Products)
        Product p5 = createProduct(
                "Maybelline New York Fit Me Matte+Poreless Foundation - Warm Nude 128",
                "maybelline-fit-me-matte-poreless-foundation-warm-nude",
                "Maybelline",
                "Cosmetics",
                "Face Makeup",
                "An iconic lightweight liquid foundation designed for normal to oily skin that refines pores and controls excess shine. Formulated with micro-powders to blur blemishes and absorb sebum for a seamless, natural matte finish. Provides breathable, buildable medium coverage that stays flawless throughout the day.",
                new BigDecimal("230.00"),
                new BigDecimal("329.00"),
                30,
                70,
                "MAY-FND-005",
                "4350014000000078001",
                4.8,
                480,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/2/y5Es4cSx_1e1bcc0217144296b0f98f9d218bc770.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/2/y5Es4cSx_1e1bcc0217144296b0f98f9d218bc770.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/2/TQP4cImM_0abf19e141124674a002b77db069a59e.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/2/wWDibrx9_37798cbef692499b8c2b084fc508eb0b.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/2/tgOckxDH_a004b4a2511e4146b586427cd091d75b.jpg",
                "18 ml",
                "Normal to Oily Skin",
                "Micro-powders, Oil-Control Complex, Matte Finish, Non-Comedogenic, Sun Protection",
                "Apply foundation onto skin and blend with fingertips or an applicator.",
                true,
                true,
                "[{\"size\":\"18ml Pocket Tube\",\"label\":\"18ml Tube\",\"price\":230,\"originalPrice\":329,\"stock\":40,\"sku\":\"MAY-FND-005-18ML\"},{\"size\":\"30ml Pump Bottle\",\"label\":\"30ml Pump\",\"price\":549,\"originalPrice\":699,\"stock\":30,\"sku\":\"MAY-FND-005-30ML\"}]"
        );

        Product p6 = createProduct(
                "Maybelline New York 30H Super Stay Lumi-Matte Liquid Foundation",
                "maybelline-superstay-lumi-matte-liquid-foundation",
                "Maybelline",
                "Cosmetics",
                "Face Makeup",
                "An ultra-longwear foundation engineered with a light-as-air formula providing up to 30 hours of transfer-proof and sweat-resistant coverage. Infused with amino acids and brightening agents for a radiant, luminous-matte finish. Delivers high-coverage concealing power without feeling heavy or cakey.",
                new BigDecimal("590.00"),
                new BigDecimal("869.00"),
                32,
                40,
                "MAY-FND-006",
                "4350014000000078002",
                4.9,
                215,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/26/kvHrzFVC_c8a17ecde6844278b0dff2153172e3d3.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/26/kvHrzFVC_c8a17ecde6844278b0dff2153172e3d3.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JULY/14/mruBoRPf_08496b74840e4bb1b4abc9f3ea2d7296.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/26/XgkwT4so_2e2704e0203c43e493ad61c93e7f5b44.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/26/WTSCEqJe_618f9626c0be457e98a148512832bf68.jpg",
                "35 ml",
                "All Skin Types",
                "Glycolic Acid, Amino Acids, 30H Wear, Lumi-Matte Finish, Sweat & Transfer Resistant, Vegan",
                "Dispense 1-2 pumps onto the back of your hand. Blend seamlessly outwards using a damp sponge or foundation brush.",
                true,
                false,
                null
        );

        Product p7 = createProduct(
                "Lakme Xtraordin-airy Mattereal Mousse Foundation - Classic Ivory",
                "lakme-mattereal-mousse-foundation-classic-ivory",
                "Lakme",
                "Cosmetics",
                "Face Makeup",
                "A feather-light whipped mousse foundation that glides on like silk, instantly minimizing visible pores and imperfections. Leaves a velvety matte, powdery smooth finish with medium buildable coverage. Features SPF protection to shield skin while keeping makeup looking fresh for up to 16 hours.",
                new BigDecimal("648.00"),
                new BigDecimal("1099.00"),
                41,
                35,
                "LAK-FND-007",
                "4350014000000078003",
                4.8,
                190,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/4/AUcZaFB3_4f10e6ecfe2541d8a9c68690347cdeed.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/4/AUcZaFB3_4f10e6ecfe2541d8a9c68690347cdeed.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/4/RE04wi48_316ef99662cb4d74a9a9d7cc6d5d3fb5.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/FEBRUARY/4/gE3VdAIt_41039baf236c4aecbf44b6f0a9a0a2b4.jpg,https://assets.myntassets.com/assets/images/2026/JUNE/10/pgIq5kt7_cfa03a9f83a540beab85bb5afab269ba.jpg",
                "25 g",
                "Normal to Oily Skin",
                "Vitamin E, Silicon elastomer formula, SPF 8, Pore Blurring, Feather-light Mousse Texture",
                "Dot across forehead, cheeks, nose, and chin. Blend softly with fingertips for an airbrushed velvet finish.",
                false,
                true,
                null
        );

        Product p8 = createProduct(
                "Maybelline New York Fit Me Matte + Poreless Powder - Natural Beige",
                "maybelline-fit-me-matte-poreless-powder-natural-beige",
                "Maybelline",
                "Cosmetics",
                "Face Makeup",
                "A micro-fine pressed setting powder that delivers long-lasting shine control and pore reduction for up to 16 hours. Perlite mineral technology absorbs oil to mattify skin while keeping complexion looking fresh and balanced. Ideal for setting foundation or quick midday touch-ups.",
                new BigDecimal("432.00"),
                new BigDecimal("577.00"),
                25,
                50,
                "MAY-POW-008",
                "4350014000000078004",
                4.8,
                310,
                "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/10849066/2023/9/20/c1d0254c-4e2c-4280-aaba-31846920adfa1695205380681-Maybelline-New-York-Fit-Me-Matte--Poreless-Powder---Natural--1.jpg",
                "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/10849066/2023/9/20/c1d0254c-4e2c-4280-aaba-31846920adfa1695205380681-Maybelline-New-York-Fit-Me-Matte--Poreless-Powder---Natural--1.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/10849066/2023/9/20/2a0b6121-184d-464d-a2c4-4da12d08f4d31695205380662-Maybelline-New-York-Fit-Me-Matte--Poreless-Powder---Natural--2.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/10849066/2023/9/20/f9b46433-ed28-49af-9035-2c47197eaf3d1695205380645-Maybelline-New-York-Fit-Me-Matte--Poreless-Powder---Natural--3.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/10849066/2023/9/20/2a0b6121-184d-464d-a2c4-4da12d08f4d31695205380662-Maybelline-New-York-Fit-Me-Matte--Poreless-Powder---Natural--2.jpg",
                "8.5 g",
                "Oily & Combination Skin",
                "Perlite Minerals, Micro-Fine Powders, 16-Hour Shine Control, Non-Comedogenic, Matte Finish",
                "Sweep lightly over T-zone and under eyes with a powder brush or puff to lock in foundation and banish midday shine.",
                false,
                false,
                null
        );

        // 3. SERUMS & TREATMENTS (3 Products)
        Product p9 = createProduct(
                "THE ORDINARY Niacinamide 10% + Zinc 1% Face Serum for Oil Control",
                "the-ordinary-niacinamide-10-zinc-1-serum",
                "THE ORDINARY",
                "Cosmetics",
                "Serums & Treatments",
                "A high-strength vitamin and mineral blemish formula designed to reduce the appearance of skin imperfections and congestion. A 10% concentration of niacinamide works together with 1% zinc PCA to balance visible sebum activity and refine texture. Promotes a clearer, smoother, and more even skin tone.",
                new BigDecimal("600.00"),
                new BigDecimal("600.00"),
                0,
                65,
                "ORD-SER-009",
                "4350014000000074001",
                4.9,
                512,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/JUNE/6/1aQK4XBP_77e8436c28274f7d86f3f6dd811a7e1c.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/JUNE/6/1aQK4XBP_77e8436c28274f7d86f3f6dd811a7e1c.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/JUNE/6/b2SbVgKJ_e7ef263273bf42e1922b76557257840c.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/JUNE/6/IlJ2PiKN_5e9dad5e334346cca34330e1297117b3.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/JUNE/6/rne7PLcu_e1057951058b431ebfa234de5a47c3c2.jpg",
                "30 ml",
                "Oily, Acne-Prone & Blemish-Prone Skin",
                "10% Niacinamide, 1% Zinc PCA, Oil-Control, Blemish Defense, Vegan & Fragrance-Free",
                "Apply a few drops to the face in the morning and evening before heavier creams.",
                true,
                true,
                "[{\"size\":\"30ml\",\"label\":\"30ml Standard Dropper\",\"price\":600,\"originalPrice\":600,\"stock\":45,\"sku\":\"ORD-SER-009-30ML\"},{\"size\":\"60ml\",\"label\":\"60ml Value Size\",\"price\":1090,\"originalPrice\":1150,\"stock\":20,\"sku\":\"ORD-SER-009-60ML\"}]"
        );

        Product p10 = createProduct(
                "Beauty of Joseon Glow Deep Serum with Brightening Rice Bran & Arbutin",
                "beauty-of-joseon-glow-deep-serum-rice-arbutin",
                "Beauty of Joseon",
                "Cosmetics",
                "Serums & Treatments",
                "A brightening Korean face serum formulated with 68% rice bran water and 2% alpha-arbutin to target hyperpigmentation and uneven tone. Inhibits melanin production to fade dark spots and acne marks while providing deep moisture. Delivers a radiant glass-skin glow with a lightweight, fast-absorbing texture.",
                new BigDecimal("1215.00"),
                new BigDecimal("1350.00"),
                10,
                40,
                "BOJ-SER-010",
                "4350014000000074002",
                4.9,
                280,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/MAY/26/2qwQRhmW_2ae2d87c41c34939a5743a77e2005204.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/MAY/26/2qwQRhmW_2ae2d87c41c34939a5743a77e2005204.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/MAY/26/XU1Uq402_572077e6eb8145f3b8ae15a2e6d784c2.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/MAY/26/xH9gossT_0475a35f655f4a789649994d31393c6e.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/MAY/26/z17W2blu_88331763a7244543ac65b765990c4ffe.jpg",
                "30 ml",
                "Hyperpigmented & Dull Skin",
                "68% Rice Bran Water, 2% Alpha-Arbutin, Niacinamide, Glass Skin Glow, Cruelty-Free",
                "Apply 2-3 drops onto clean face and neck. Gently pat until fully absorbed.",
                true,
                false,
                null
        );

        Product p11 = createProduct(
                "THE ORDINARY Retinol 0.5% In Squalane Serum for Signs of Aging",
                "the-ordinary-retinol-0-5-in-squalane",
                "THE ORDINARY",
                "Cosmetics",
                "Serums & Treatments",
                "A water-free, highly stable solution containing 0.5% pure retinol to reduce the appearance of fine lines, photodamage, and general skin aging. Squalane base delivers soothing, weightless hydration to mitigate dryness and sensitivity often associated with retinol use. Refines skin texture and boosts cellular turnover.",
                new BigDecimal("875.00"),
                new BigDecimal("875.00"),
                0,
                35,
                "ORD-SER-011",
                "4350014000000074003",
                4.8,
                198,
                "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2025/APRIL/2/hUro3abY_35779e791ec04002a8bb486b5e301c21.jpg",
                "https://assets.myntassets.com/h_1440,q_100,w_1080/v1/assets/images/2025/APRIL/2/hUro3abY_35779e791ec04002a8bb486b5e301c21.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/APRIL/2/ERVWmnv1_bccc794221754b04afe1b483cd955d5d.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/APRIL/2/8DonM1dy_1d0f3c490ff1433e92f72388ecb0414a.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/APRIL/2/xCUwCMxm_60c50a44c9b54541bba9ef3ea2095559.jpg",
                "30 ml",
                "Mature & Textured Skin",
                "0.5% Pure Retinol, Plant-Derived Squalane, Jojoba Oil, Anti-Aging & Texturizing, Cruelty-Free",
                "Apply a small amount to face in the PM as part of your skincare regimen, after water-based serums but before heavier treatments.",
                false,
                false,
                null
        );

        // 4. MOISTURIZERS (3 Products)
        Product p12 = createProduct(
                "Ponds Hydra Miracle Super Light Gel With Hyaluronic Acid & Salicylic",
                "ponds-hydra-miracle-super-light-gel",
                "Ponds",
                "Cosmetics",
                "Moisturizers",
                "An ultra-lightweight, fast-absorbing water gel moisturizer that quenches dehydrated skin without any greasy residue. Powered by hyaluronic acid and salicylic acid to deliver 72-hour continuous hydration while keeping pores clear and balanced. Leaves the skin feeling plump, soft, and naturally glowing.",
                new BigDecimal("251.00"),
                new BigDecimal("340.00"),
                26,
                80,
                "PND-CRM-012",
                "4350014000000077001",
                4.8,
                420,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/25/plnLg5aK_1be8d2f31e1641e38bdbfc3b1ddec35c.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/25/plnLg5aK_1be8d2f31e1641e38bdbfc3b1ddec35c.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/25/zCMxzNhG_d85e1ef3f487455d9a8814d7433031dd.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/25/w7cARo37_568ce9e13b6348c1a738f405eae3eec6.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/25/bXEbfvIZ_c3e46659d4ea473782a33b6e3996d4f0.jpg",
                "100 ml",
                "All Skin Types (Ideal for Oily / Combo)",
                "Hyaluronic Acid, Salicylic Acid, Glycerin, 72-Hour Hydration, 100% Oil-Free Gel",
                "Gently spread all over cleansed face and neck every morning and night.",
                true,
                true,
                "[{\"size\":\"73g Travel Tub\",\"label\":\"73g Jar\",\"price\":189,\"originalPrice\":240,\"stock\":35,\"sku\":\"PND-CRM-012-73G\"},{\"size\":\"100ml Value Pump\",\"label\":\"100ml Pump\",\"price\":251,\"originalPrice\":340,\"stock\":45,\"sku\":\"PND-CRM-012\"}]"
        );

        Product p13 = createProduct(
                "Minimalist Vitamin B5 Lightweight & Oil Free Moisturizer",
                "minimalist-vitamin-b5-oil-free-moisturizer",
                "Minimalist",
                "Cosmetics",
                "Moisturizers",
                "A daily oil-free gel cream moisturizer enriched with provitamin B5 (panthenol) to repair skin barrier and lock in essential moisture. Formulated with zinc, copper, and magnesium minerals along with hyaluronic acid to calm inflammation and provide weightless nourishment. Leaves skin refreshed, soft, and non-sticky.",
                new BigDecimal("349.00"),
                new BigDecimal("349.00"),
                0,
                60,
                "MIN-CRM-013",
                "4350014000000077002",
                4.8,
                380,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/16900038/2023/9/6/daafe8b9-688b-4564-8b8b-25fc404a38511693992453638-Minimalist-Vitamin-B5-Lightweight--Oil-Free-Moisturizer---50-1.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/16900038/2023/9/6/daafe8b9-688b-4564-8b8b-25fc404a38511693992453638-Minimalist-Vitamin-B5-Lightweight--Oil-Free-Moisturizer---50-1.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/16900038/2023/9/6/91b330c5-d821-44f6-9002-a447817163b71693992453618-Minimalist-Vitamin-B5-Lightweight--Oil-Free-Moisturizer---50-2.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/16900038/2023/9/6/bf2e1a47-b944-4b47-96a1-fd6c1ce421891693992453599-Minimalist-Vitamin-B5-Lightweight--Oil-Free-Moisturizer---50-3.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/16900038/2023/9/6/05b8bb33-2bcd-47f7-910c-2b0b3efe273f1693992453580-Minimalist-Vitamin-B5-Lightweight--Oil-Free-Moisturizer---50-4.jpg",
                "50 g",
                "Oily & Acne-Prone Skin",
                "Provitamin B5 (Panthenol), Hyaluronic Acid, Zinc, Magnesium, Copper, Oil-Free, Fragrance-Free",
                "Use AM or PM. Take sufficient quantity and massage onto face and neck until fully absorbed.",
                true,
                false,
                null
        );

        Product p14 = createProduct(
                "Cetaphil DAM Daily Advance Ultra Hydrating Lotion",
                "cetaphil-dam-daily-advance-hydrating-lotion",
                "Cetaphil",
                "Cosmetics",
                "Moisturizers",
                "A clinically proven rich lotion designed to deliver 48-hour continuous hydration for dry, sensitive skin. Formulated with the dermatologist-backed blend of niacinamide, panthenol, and hydrating glycerin alongside nourishing shea butter. Restores and strengthens the natural moisture barrier while soothing roughness.",
                new BigDecimal("414.00"),
                new BigDecimal("499.00"),
                17,
                50,
                "CET-CRM-014",
                "4350014000000077003",
                4.9,
                310,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/8/YcwJ9hpU_d8cb21ebffb544ecbc5348bd1ca48cf2.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/8/YcwJ9hpU_d8cb21ebffb544ecbc5348bd1ca48cf2.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/8/mUuyrNJq_829ee9ae660e4c73af2de4c15e4cca31.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/8/26X4yOpw_c944d3721e434bc697e80b962c3d8b77.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/JUNE/8/ydHyelbk_5927be6a1a5147e38d9d4756ba4cd678.jpg",
                "50 g",
                "Dry to Very Dry, Sensitive Skin",
                "Niacinamide (Vitamin B3), Panthenol (Pro-Vitamin B5), Shea Butter, Glycerin, Fragrance-Free, Hypoallergenic",
                "Apply daily to dry skin as needed or as directed by a physician.",
                false,
                false,
                null
        );

        // 5. SUN CARE (3 Products)
        Product p15 = createProduct(
                "DOT & KEY Vitamin C+E Super Bright Sunscreen SPF 50+ PA++++",
                "dot-key-vitamin-c-e-super-bright-sunscreen-spf50",
                "DOT & KEY",
                "Cosmetics",
                "Sun Care",
                "A broad-spectrum sunscreen lotion combining SPF 50+ PA++++ protection with the brightening power of Sicilian blood orange and vitamin C. Offers in-vivo tested defense against UVA, UVB, and blue light while fading dark spots and boosting skin glow. Features an ultra-light, quick-absorbing texture with zero white cast.",
                new BigDecimal("396.00"),
                new BigDecimal("445.00"),
                11,
                65,
                "DOT-SPF-015",
                "4350014000000077025",
                4.8,
                295,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/AUGUST/12/5gZV6XvW_f8ff74d71d5046bf81a42c98834235d2.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/AUGUST/12/5gZV6XvW_f8ff74d71d5046bf81a42c98834235d2.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/AUGUST/12/49IkAeVL_b10efa87d0c64318b12c8fe57428cc21.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/AUGUST/12/joP9YNYH_d4a4f6b748384d9ca253e71591e44f5b.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2026/AUGUST/12/DpF3Uqxb_45e21edb0ad346f891663faeb1dd8dca.jpg",
                "50 g",
                "All Skin Types",
                "Vitamin C, Vitamin E, Sicilian Blood Orange, SPF 50+ PA++++, No White Cast, In-Vivo Tested",
                "Apply evenly to cleansed face and neck 15 minutes before stepping out into the sun. Reapply every 3-4 hours.",
                true,
                true,
                "[{\"size\":\"50g Tube\",\"label\":\"50g Tube\",\"price\":396,\"originalPrice\":445,\"stock\":40,\"sku\":\"DOT-SPF-015-50G\"},{\"size\":\"80g Value Tub\",\"label\":\"80g Duo\",\"price\":599,\"originalPrice\":699,\"stock\":25,\"sku\":\"DOT-SPF-015-80G\"}]"
        );

        Product p16 = createProduct(
                "Minimalist SPF 50 PA++++ Multi Vitamin Sunscreen",
                "minimalist-multi-vitamin-sunscreen-spf50",
                "Minimalist",
                "Cosmetics",
                "Sun Care",
                "A lightweight, broad-spectrum sunscreen formulated with 4 very effective modern UV filters and enriched with multivitamins A, B3, B5, and E. Clinically tested to provide in-vivo SPF 50 and PA++++ protection against sunburn and photoaging. Spreads effortlessly like a light moisturizer without pilling or leaving any greasy residue.",
                new BigDecimal("399.00"),
                new BigDecimal("399.00"),
                0,
                70,
                "MIN-SPF-016",
                "4350014000000077026",
                4.8,
                330,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/15853718/2024/8/7/82994ac8-59ae-4f68-b317-f76a7f2673101723024253432-Minimalist-SPF-50-PA-Multi-Vitamin-Sunscreen-637172302425299-1.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/15853718/2024/8/7/82994ac8-59ae-4f68-b317-f76a7f2673101723024253432-Minimalist-SPF-50-PA-Multi-Vitamin-Sunscreen-637172302425299-1.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/15853718/2024/8/7/7c4a359f-5515-4eab-a78c-0476417d2c6c1723024253403-Minimalist-SPF-50-PA-Multi-Vitamin-Sunscreen-637172302425299-2.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/15853718/2024/8/7/93c6184d-6cd7-4a25-8f1d-535d728b2f971723024253375-Minimalist-SPF-50-PA-Multi-Vitamin-Sunscreen-637172302425299-3.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/15853718/2024/8/7/c1659320-bcc9-44d7-98cc-65b024051c251723024253345-Minimalist-SPF-50-PA-Multi-Vitamin-Sunscreen-637172302425299-4.jpg",
                "50 g",
                "All Skin Types",
                "Vitamins A, B3 (Niacinamide), B5, E, Uvinul A Plus, Tinosorb S, SPF 50 PA++++, Fragrance-Free",
                "Apply generously on face and neck 15 minutes before sun exposure.",
                true,
                false,
                null
        );

        Product p17 = createProduct(
                "Hyphen All I Need Sunscreen SPF50 PA++++ Moisturizing Sunscreen",
                "hyphen-all-i-need-sunscreen-spf50",
                "Hyphen",
                "Cosmetics",
                "Sun Care",
                "A hybrid lightweight sunscreen combining SPF 50 PA++++ broad spectrum sun defense with deep moisturizing and barrier-strengthening benefits. Formulated with ceramides, niacinamide, and antioxidant-rich Kakadu plum to protect against UV rays, pollution, and blue light. Absorbs seamlessly into the skin leaving a dewy, hydrated finish with no white cast.",
                new BigDecimal("422.00"),
                new BigDecimal("449.00"),
                6,
                45,
                "HYP-SPF-017",
                "4350014000000077027",
                4.7,
                160,
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/18/I69P2Iik_a575bd4d4ff343d785512d411fef3e2d.jpg",
                "https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/18/I69P2Iik_a575bd4d4ff343d785512d411fef3e2d.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/18/90NsgkRz_dd852a1322d74aa9b56b4fc90b4df13d.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/18/xDAHKKSa_69631d16a22747988f34b13eb42f4fbb.jpg,https://assets.myntassets.com/h_1440,q_95,w_1080/v1/assets/images/2025/NOVEMBER/18/aIShJPvJ_3cdb83dad4894998a64db92ccee03b18.jpg",
                "50 ml",
                "Dry, Normal & Sensitive Skin",
                "Ceramides, Niacinamide, Kakadu Plum, Kojic Acid, SPF 50 PA++++, Blue Light Protection",
                "Use as the final step of skincare before makeup. Reapply every 2-3 hours during outdoor exposure.",
                false,
                false,
                null
        );

        // 6. CLEANSERS (3 Products)
        Product p18 = createProduct(
                "Cetaphil Gentle Skin Cleanser With Pro-Vitamin B5 & B3 - 118 ml",
                "cetaphil-gentle-skin-cleanser",
                "Cetaphil",
                "Cosmetics",
                "Cleansers",
                "A dermatologist-recommended creamy face wash clinically tested to cleanse while preserving skin's natural moisture barrier. Formulated with hydrating glycerin, niacinamide (vitamin B3), and panthenol (pro-vitamin B5) to soothe sensitivity and protect against 5 signs of skin sensitivity. Gentle enough for daily use with or without water.",
                new BigDecimal("417.00"),
                new BigDecimal("459.00"),
                9,
                75,
                "CET-CLN-018",
                "4350014000000074050",
                4.9,
                540,
                "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/MAY/11/2rTprqV7_7ff40f98980e4720a9833b6852a6401a.jpg",
                "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/MAY/11/2rTprqV7_7ff40f98980e4720a9833b6852a6401a.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/MAY/11/hse6czWD_7d6fcb00f8e648658ec36f7e7624ade8.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/MAY/11/29KIPpZm_004c08fa59d847ffbd69a2a7f1c558ec.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/MAY/11/jKzvf4Ks_6dee8477ed6241f2aa6ba782ffd09a05.jpg",
                "118 ml",
                "Dry, Normal to Sensitive Skin",
                "Niacinamide (Vitamin B3), Panthenol (Pro-Vitamin B5), Glycerin, Soap-Free, Non-Irritating, Fragrance-Free",
                "Apply to skin and massage gently. Without water: wipe off with soft tissue. With water: rinse and pat dry with soft towel.",
                true,
                true,
                "[{\"size\":\"118ml Bottle\",\"label\":\"118ml Standard\",\"price\":417,\"originalPrice\":459,\"stock\":45,\"sku\":\"CET-CLN-018-118ML\"},{\"size\":\"250ml Pump\",\"label\":\"250ml Family Size\",\"price\":699,\"originalPrice\":799,\"stock\":30,\"sku\":\"CET-CLN-018-250ML\"}]"
        );

        Product p19 = createProduct(
                "Minimalist 2% Salicylic Acid Face Wash With LHA - 100 ml",
                "minimalist-2-salicylic-acid-face-wash",
                "Minimalist",
                "Cosmetics",
                "Cleansers",
                "An exfoliating gel cleanser formulated with 2% salicylic acid (BHA) and lipo-hydroxy acid (LHA) to deep cleanse pores and remove excess sebum. Penetrates deep into the skin to unclog congested pores, reduce active acne, and smooth bumpy skin texture. Soothing oat extract and allantoin prevent irritation or post-wash tightness.",
                new BigDecimal("299.00"),
                new BigDecimal("299.00"),
                0,
                65,
                "MIN-CLN-019",
                "4350014000000074051",
                4.8,
                390,
                "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/14669014/2023/9/6/12adc15e-a720-48e0-a32e-4292b4f694431693992394603-Minimalist-2-Salicylic-Acid-Face-Wash-With-LHA-100-ml-181169-1.jpg",
                "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/14669014/2023/9/6/12adc15e-a720-48e0-a32e-4292b4f694431693992394603-Minimalist-2-Salicylic-Acid-Face-Wash-With-LHA-100-ml-181169-1.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/14669014/2023/9/6/8500d0ed-a14a-4a74-ba9f-fed81f217a8a1693992394581-Minimalist-2-Salicylic-Acid-Face-Wash-With-LHA-100-ml-181169-2.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/14669014/2023/9/6/35b717af-29bf-4b93-b879-354d82678a781693992394561-Minimalist-2-Salicylic-Acid-Face-Wash-With-LHA-100-ml-181169-3.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/14669014/2023/9/6/ed47b4e6-3e63-4524-9844-d2f206502c9d1693992394543-Minimalist-2-Salicylic-Acid-Face-Wash-With-LHA-100-ml-181169-4.jpg",
                "100 ml",
                "Oily, Acne-Prone & Bumpy Skin",
                "2% Salicylic Acid, LHA, Zinc PCA, Oat Extract, Allantoin, Anti-Acne, Non-Comedogenic",
                "Wet face. Take 1-2 pumps and gently massage onto face in circular motions for 1 minute. Rinse thoroughly with water.",
                false,
                true,
                null
        );

        Product p20 = createProduct(
                "DOT & KEY Barrier Repair Probiotics 5 Ceramides pH5.5 Hydrating Gentle Face Wash",
                "dot-key-barrier-repair-ceramides-face-wash",
                "DOT & KEY",
                "Cosmetics",
                "Cleansers",
                "A gentle, non-stripping facial cleanser formulated with 5 essential ceramides and probiotics to restore and maintain the skin's moisture barrier. Balanced at a skin-friendly pH of 5.5, it lifts impurities, dirt, and excess oil without disturbing the skin's acid mantle. Enriched with hyaluronic acid to keep skin supple, plump, and deeply hydrated.",
                new BigDecimal("219.00"),
                new BigDecimal("249.00"),
                12,
                70,
                "DOT-CLN-020",
                "4350014000000074052",
                4.8,
                220,
                "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/JULY/15/eSVMCXPz_a965bf6f34e0455790dece4114d4d142.jpg",
                "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/JULY/15/eSVMCXPz_a965bf6f34e0455790dece4114d4d142.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/JULY/15/rdYVSIqj_33d6047ddf004860b9325d95f900129e.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/JULY/15/nJEakroJ_e348ef72029b4b61803357c8b709a193.jpg,https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/2026/JULY/15/WQhFMmLo_870696f388484a08afb4cfc9324b9c55.jpg",
                "100 ml",
                "Normal, Dry & Sensitive Skin",
                "5 Essential Ceramides, Probiotics, Hyaluronic Acid, pH 5.5 Balanced, Sulphate-Free & Fragrance-Free",
                "Squeeze onto palm, lather with water, and massage gently over damp skin. Rinse thoroughly.",
                true,
                false,
                null
        );

        productRepository.saveAll(List.of(
                p1, p2, p3, p4, p5, p6, p7, p8, p9, p10,
                p11, p12, p13, p14, p15, p16, p17, p18, p19, p20
        ));
        log.info("Successfully seeded 20 authentic Myntra Cosmetics products with multi-image galleries!");
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
