package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.config.ZohoProperties;
import com.daivatech.ecommerce.entity.OrderItem;
import com.daivatech.ecommerce.entity.Product;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

@Service
public class ZohoInventoryService {

    private static final Logger log = LoggerFactory.getLogger(ZohoInventoryService.class);

    private final ZohoProperties properties;
    private final ZohoAuthService authService;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public ZohoInventoryService(ZohoProperties properties, ZohoAuthService authService,
                                RestClient restClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.authService = authService;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Test connection to Zoho
     */
    public boolean testConnection() {
        try {
            String token = authService.getAccessToken();
            return token != null && !token.isBlank();
        } catch (Exception e) {
            log.warn("Zoho connection test failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * 1. Fetches all products and their stock from Zoho Inventory / Books
     */
    public JsonNode getItems() {
        String token = authService.getAccessToken();
        String url = properties.getInventoryUrl() + "/items?organization_id=" + properties.getOrganizationId();

        log.info("Fetching items from Zoho Inventory API...");
        return restClient.get()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Zoho-oauthtoken " + token)
                .retrieve()
                .body(JsonNode.class);
    }

    /**
     * 2. Creates or updates a product in Zoho Inventory
     */
    public String createOrUpdateItem(Product product) {
        String token = authService.getAccessToken();
        String orgId = properties.getOrganizationId();

        // Check if item already exists by SKU or Name in Zoho
        String existingId = product.getZohoItemId();
        if (existingId == null || existingId.isBlank()) {
            if (product.getSku() != null && !product.getSku().isBlank()) {
                try {
                    String searchUrl = properties.getInventoryUrl() + "/items?organization_id=" + orgId + "&search_text=" + URLEncoder.encode(product.getSku(), StandardCharsets.UTF_8);
                    JsonNode searchRes = restClient.get()
                            .uri(searchUrl)
                            .header(HttpHeaders.AUTHORIZATION, "Zoho-oauthtoken " + token)
                            .retrieve()
                            .body(JsonNode.class);
                    if (searchRes != null && searchRes.has("items")) {
                        ArrayNode items = (ArrayNode) searchRes.get("items");
                        for (JsonNode item : items) {
                            String itemSku = item.path("sku").asText("");
                            String itemName = item.path("name").asText("");
                            if (product.getSku().equalsIgnoreCase(itemSku) || product.getName().equalsIgnoreCase(itemName)) {
                                existingId = item.get("item_id").asText();
                                log.info("Found existing Zoho Item ID: {} for SKU: {}", existingId, product.getSku());
                                break;
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("Zoho item search by SKU failed: {}", e.getMessage());
                }
            }
        }

        ObjectNode node = objectMapper.createObjectNode();
        node.put("name", product.getName());
        node.put("rate", product.getPrice().doubleValue());
        node.put("sku", product.getSku() != null ? product.getSku() : "SKU-" + product.getId());
        node.put("description", product.getDescription() != null ? product.getDescription() : "");
        node.put("item_type", "inventory");
        node.put("product_type", "goods");

        if (existingId != null && !existingId.isBlank()) {
            // Update existing item
            String updateUrl = properties.getInventoryUrl() + "/items/" + existingId + "?organization_id=" + orgId;
            try {
                restClient.put()
                        .uri(updateUrl)
                        .header(HttpHeaders.AUTHORIZATION, "Zoho-oauthtoken " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(node)
                        .retrieve()
                        .body(JsonNode.class);
                return existingId;
            } catch (Exception e) {
                log.warn("Failed to update item in Zoho: {}", e.getMessage());
                return existingId;
            }
        } else {
            // Create new item
            node.put("initial_stock", product.getStockQuantity() != null ? product.getStockQuantity() : 10);
            node.put("initial_stock_rate", product.getPrice().doubleValue());
            String createUrl = properties.getInventoryUrl() + "/items?organization_id=" + orgId;
            try {
                JsonNode created = restClient.post()
                        .uri(createUrl)
                        .header(HttpHeaders.AUTHORIZATION, "Zoho-oauthtoken " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(node)
                        .retrieve()
                        .body(JsonNode.class);
                if (created != null && created.has("item")) {
                    String newId = created.get("item").get("item_id").asText();
                    log.info("Successfully created item in Zoho: {} (ID: {})", product.getName(), newId);
                    return newId;
                }
            } catch (Exception e) {
                log.error("Item creation in Zoho returned error for {}: {}", product.getName(), e.getMessage());
                // Fallback: check if it already exists under name in Zoho
                try {
                    String searchUrl = properties.getInventoryUrl() + "/items?organization_id=" + orgId + "&search_text=" + URLEncoder.encode(product.getName(), StandardCharsets.UTF_8);
                    JsonNode searchRes = restClient.get()
                            .uri(searchUrl)
                            .header(HttpHeaders.AUTHORIZATION, "Zoho-oauthtoken " + token)
                            .retrieve()
                            .body(JsonNode.class);
                    if (searchRes != null && searchRes.has("items")) {
                        ArrayNode items = (ArrayNode) searchRes.get("items");
                        if (!items.isEmpty()) {
                            return items.get(0).get("item_id").asText();
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Fallback Zoho item search failed: {}", ex.getMessage());
                }
            }
        }
        return existingId;
    }

    /**
     * 3. Finds an existing contact or creates a new one in Zoho.
     */
    public String getOrCreateCustomerId(String customerName, String email, String phone) {
        String token = authService.getAccessToken();

        String searchUrl = properties.getInventoryUrl() + "/contacts?organization_id="
                + properties.getOrganizationId() + "&contact_name=" + customerName;

        try {
            JsonNode searchResponse = restClient.get()
                    .uri(searchUrl)
                    .header(HttpHeaders.AUTHORIZATION, "Zoho-oauthtoken " + token)
                    .retrieve()
                    .body(JsonNode.class);

            if (searchResponse != null && searchResponse.has("contacts")) {
                ArrayNode contacts = (ArrayNode) searchResponse.get("contacts");
                if (!contacts.isEmpty()) {
                    String existingId = contacts.get(0).get("contact_id").asText();
                    log.info("Found existing Zoho Customer ID: {} for {}", existingId, customerName);
                    return existingId;
                }
            }
        } catch (Exception e) {
            log.warn("Zoho contact search failed: {}, proceeding to create new contact", e.getMessage());
        }

        // Create new contact
        log.info("Creating new customer in Zoho for: {}", customerName);
        String createUrl = properties.getInventoryUrl() + "/contacts?organization_id=" + properties.getOrganizationId();

        ObjectNode contactNode = objectMapper.createObjectNode();
        contactNode.put("contact_name", customerName);
        if (email != null && !email.isBlank()) {
            contactNode.put("email", email);
        }
        if (phone != null && !phone.isBlank()) {
            contactNode.put("phone", phone);
        }
        contactNode.put("contact_type", "customer");

        JsonNode created = restClient.post()
                .uri(createUrl)
                .header(HttpHeaders.AUTHORIZATION, "Zoho-oauthtoken " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(contactNode)
                .retrieve()
                .body(JsonNode.class);

        if (created != null && created.has("contact")) {
            String newId = created.get("contact").get("contact_id").asText();
            log.info("Successfully created new Zoho Customer with ID: {}", newId);
            return newId;
        }

        throw new IllegalStateException("Failed to get or create customer in Zoho");
    }

    /**
     * 4. Creates a multi-item Sales Order in Zoho
     */
    public JsonNode createSalesOrder(String customerName, String email, String phone,
                                     String referenceNumber, List<OrderItem> items) {
        String token = authService.getAccessToken();
        String customerId = getOrCreateCustomerId(customerName, email, phone);

        String url = properties.getInventoryUrl() + "/salesorders?organization_id=" + properties.getOrganizationId();

        ObjectNode root = objectMapper.createObjectNode();
        root.put("customer_id", customerId);
        root.put("date", LocalDate.now().toString());
        if (referenceNumber != null) {
            root.put("reference_number", referenceNumber);
        }

        ArrayNode lineItems = root.putArray("line_items");
        for (OrderItem item : items) {
            ObjectNode itemNode = lineItems.addObject();
            if (item.getZohoItemId() != null && !item.getZohoItemId().isBlank()) {
                itemNode.put("item_id", item.getZohoItemId());
            } else {
                itemNode.put("name", item.getProductName());
            }
            itemNode.put("quantity", item.getQuantity());
            itemNode.put("rate", item.getPrice().doubleValue());
        }

        log.info("Creating Sales Order in Zoho for customer: {}", customerName);
        return restClient.post()
                .uri(url)
                .header(HttpHeaders.AUTHORIZATION, "Zoho-oauthtoken " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .body(root)
                .retrieve()
                .body(JsonNode.class);
    }
}
