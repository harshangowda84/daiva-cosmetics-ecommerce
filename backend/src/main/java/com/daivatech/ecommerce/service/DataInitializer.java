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

    public DataInitializer(ProductRepository productRepository,
                           UserRepository userRepository,
                           StockMovementRepository stockMovementRepository,
                           BatchStockService batchStockService,
                           com.daivatech.ecommerce.repository.UserAddressRepository addressRepository) {
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.batchStockService = batchStockService;
        this.addressRepository = addressRepository;
    }

    @Override
    public void run(String... args) {
        seedUsers();
        seedCosmetics();
        seedInitialStockMovements();
        batchStockService.ensureInitialBatchesExist();
        seedDefaultAddresses();
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

    private void seedCosmetics() {
        if (productRepository.count() > 0) {
            updateExistingProductZohoIds();
            return;
        }

        log.info("Seeding Cosmetics category products into local DB...");

        Product p1 = createProduct(
                "Lumière 10% Niacinamide & Zinc Glow Serum",
                "lumiere-niacinamide-glow-serum",
                "Lumière Paris",
                "Cosmetics",
                "Serums & Treatments",
                "A lightweight, water-based serum designed to visibly reduce skin blemishes, regulate sebum production, and enhance natural radiance. Infused with pure Swiss Niacinamide and Zinc PCA.",
                new BigDecimal("899.00"),
                new BigDecimal("1299.00"),
                31,
                45,
                "LUM-SER-001",
                "4350014000000074001",
                4.9,
                128,
                "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1608248597359-5776d6ec0379?auto=format&fit=crop&w=800&q=80",
                "30 ml",
                "All Skin Types (Ideal for Oily / Acne-Prone)",
                "10% Niacinamide (Vitamin B3), 1% Zinc PCA, Hyaluronic Acid, Aloe Leaf Extract",
                "Apply 3-4 drops morning and night on clean, dry face before heavier creams. Gently pat until absorbed.",
                true,
                true
        );

        Product p2 = createProduct(
                "Velvet Rose Matte Hydrating Lipstick",
                "velvet-rose-matte-lipstick",
                "Maison Rouge",
                "Cosmetics",
                "Lip Care & Makeup",
                "An ultra-pigmented, feather-light matte lipstick infused with organic rosehip oil and shea butter that stays vibrant for up to 12 hours without drying lips.",
                new BigDecimal("649.00"),
                new BigDecimal("850.00"),
                24,
                60,
                "MR-LIP-002",
                "4350014000000074026",
                4.8,
                94,
                "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=800&q=80",
                "3.8 g",
                "All Skin Types",
                "Cold-pressed Rosehip Seed Oil, Shea Butter, Vitamin E, Mineral Pigments",
                "Swipe directly across upper and lower lips. Layer for richer drama or dab with finger for a soft stain.",
                true,
                true
        );

        Product p3 = createProduct(
                "Rose & Peony Silk Hydrating Day Cream",
                "rose-peony-silk-hydrating-cream",
                "DermaFlora",
                "Cosmetics",
                "Moisturizers",
                "Intensive moisture recovery cream loaded with 5 essential ceramides, Damask rose, and white peony extract to restore compromised skin barriers and prevent water loss.",
                new BigDecimal("1149.00"),
                new BigDecimal("1599.00"),
                28,
                38,
                "RPS-CRM-003",
                "4350014000000077001",
                4.9,
                156,
                "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80,https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80",
                "50 g",
                "Dry & Sensitive Skin",
                "Ceramides NP/AP/EOP, Damask Rose Extract, Peony Root, Hyaluronic Acid",
                "Scoop a dime-sized amount and warm between palms. Press gently over face and neck morning and evening.",
                true,
                false
        );

        Product p4 = createProduct(
                "Mineral Invisible Shield Sunscreen SPF 50+",
                "mineral-invisible-shield-sunscreen",
                "Solaris Botanicals",
                "Cosmetics",
                "Sun Care",
                "An ultra-sheer, invisible mineral sunscreen fluid that leaves zero white cast and no greasy residue. Broad-spectrum protection against UVA, UVB, and blue light.",
                new BigDecimal("749.00"),
                new BigDecimal("999.00"),
                25,
                65,
                "MIS-SPF-005",
                "4350014000000077025",
                4.7,
                82,
                "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80",
                "50 ml",
                "All Skin Types",
                "10% Non-Nano Zinc Oxide, Niacinamide, Green Tea Extract, Vitamin E",
                "Apply generously 15 minutes before sun exposure as the final step in your routine. Reapply every 2 hours.",
                true,
                true
        );

        Product p5 = createProduct(
                "Cashmere Flawless Liquid Foundation",
                "cashmere-flawless-liquid-foundation",
                "Aura Luxe",
                "Cosmetics",
                "Face Makeup",
                "Weightless, buildable medium-to-full coverage liquid foundation with light-refracting micro-pearls for a lit-from-within second-skin finish that lasts all day.",
                new BigDecimal("1399.00"),
                new BigDecimal("1850.00"),
                24,
                28,
                "CFF-FND-006",
                "4350014000000078001",
                4.8,
                73,
                "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80",
                "35 ml",
                "Normal to Dry Skin",
                "Botanical Squalane, Hyaluronic Microspheres, Peptides, Camellia Seed Oil",
                "Dispense 1-2 pumps onto the back of your hand. Blend seamlessly outwards using a damp sponge or foundation brush.",
                false,
                true
        );

        Product p6 = createProduct(
                "Botanical Golden Glow Cleansing Oil",
                "botanical-golden-glow-cleansing-oil",
                "DermaFlora",
                "Cosmetics",
                "Cleansers",
                "A silky botanical cleansing oil that dissolves stubborn waterproof makeup, SPF, and excess sebum effortlessly while nourishing skin with sweet almond and jojoba oils.",
                new BigDecimal("799.00"),
                new BigDecimal("999.00"),
                20,
                52,
                "BGG-OIL-004",
                "4350014000000074050",
                4.9,
                110,
                "https://images.unsplash.com/photo-1556228722-d0b5de70d70c?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1556228722-d0b5de70d70c?auto=format&fit=crop&w=800&q=80",
                "150 ml",
                "Sensitive & All Skin Types",
                "Sweet Almond Oil, Jojoba Seed Oil, Sea Buckthorn, Vitamin E",
                "Pump twice into dry hands, massage over dry face and eyes to break down makeup, emulsify with warm water, and rinse.",
                false,
                false
        );

        Product p7 = createProduct(
                "Midnight Recovery Peptide Eye Elixir",
                "midnight-recovery-peptide-eye-elixir",
                "Lumière Paris",
                "Cosmetics",
                "Serums & Treatments",
                "A concentrated peptide eye elixir targeting dark circles, puffiness, and expression lines with multi-peptides, caffeine, and hyaluronic acid.",
                new BigDecimal("949.00"),
                new BigDecimal("1399.00"),
                32,
                34,
                "MRP-EYE-007",
                "4350014000000074074",
                4.9,
                64,
                "https://images.unsplash.com/photo-1608248597359-5776d6ec0379?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1608248597359-5776d6ec0379?auto=format&fit=crop&w=800&q=80",
                "15 ml",
                "All Skin Types",
                "Palmitoyl Tripeptide-5, Green Tea Caffeine, Hyaluronic Acid, Niacinamide",
                "Dispense 1 pump onto ring finger. Tap gently along orbital bone morning and night.",
                true,
                false
        );

        Product p8 = createProduct(
                "Exfoliating AHA + BHA Glow Facial Tonic",
                "exfoliating-aha-bha-glow-tonic",
                "Maison Rouge",
                "Cosmetics",
                "Cleansers",
                "Clarifying liquid exfoliant with 5% Glycolic Acid (AHA) and 1% Salicylic Acid (BHA) that refines pore texture, clears blackheads, and imparts an unmistakable luminous glow.",
                new BigDecimal("699.00"),
                new BigDecimal("899.00"),
                22,
                40,
                "EAB-TON-008",
                "4350014000000077049",
                4.8,
                92,
                "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
                "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80",
                "120 ml",
                "Oily, Combination & Blemish-Prone Skin",
                "5% Glycolic Acid, 1% Salicylic Acid, Tasmanian Pepperberry, Damask Rose Hydrosol",
                "Sweep over clean face with a cotton pad in the evening 2-3 times per week. Follow with hydrating serum.",
                false,
                true
        );

        productRepository.saveAll(List.of(p1, p2, p3, p4, p5, p6, p7, p8));
        log.info("Successfully seeded 8 luxury Cosmetics products!");
    }

    private Product createProduct(String name, String slug, String brand, String category, String subCategory,
                                  String description, BigDecimal price, BigDecimal originalPrice, Integer discount,
                                  Integer stock, String sku, String zohoItemId, Double rating, Integer reviews,
                                  String imageUrl, String gallery, String volume, String skinType,
                                  String ingredients, String howToUse, Boolean featured, Boolean bestSeller) {
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
        }
        if (changed) {
            productRepository.saveAll(products);
            log.info("Updated existing database products with corresponding Zoho Item IDs");
        }
    }

    private void seedInitialStockMovements() {
        if (stockMovementRepository.count() == 0) {
            List<Product> products = productRepository.findAll();
            for (Product p : products) {
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
            log.info("Seeded initial stock audit movements for {} products", products.size());
        }
    }
}
