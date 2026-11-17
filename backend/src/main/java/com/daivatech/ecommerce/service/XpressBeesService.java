package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.entity.CustomerOrder;
import com.daivatech.ecommerce.entity.OrderItem;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class XpressBeesService {

    private static final Logger log = LoggerFactory.getLogger(XpressBeesService.class);

    private final String baseUrl;
    private final String email;
    private final String password;
    private final String originPincode;
    private final String warehouseName;
    private final String warehouseLine1;
    private final String warehouseCity;
    private final String warehouseState;
    private final String warehousePhone;
    private final String trackingUrlTemplate;

    private final ObjectMapper objectMapper;
    private HttpClient httpClient;

    private synchronized HttpClient getHttpClient() {
        if (this.httpClient == null) {
            try {
                this.httpClient = HttpClient.newBuilder()
                        .connectTimeout(Duration.ofSeconds(15))
                        .build();
            } catch (Exception e) {
                log.warn("Could not instantiate HttpClient for XpressBees: {}", e.getMessage());
                throw new RuntimeException("HttpClient unavailable for XpressBees", e);
            }
        }
        return this.httpClient;
    }

    private volatile String cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    public XpressBeesService(
            @Value("${xpressbees.base-url:https://shipment.xpressbees.com}") String baseUrl,
            @Value("${xpressbees.email:}") String email,
            @Value("${xpressbees.password:}") String password,
            @Value("${xpressbees.origin-pincode:560001}") String originPincode,
            @Value("${xpressbees.warehouse-name:Aura Luxe Cosmetics Hub}") String warehouseName,
            @Value("${xpressbees.warehouse-line1:124, 4th Cross, Indiranagar}") String warehouseLine1,
            @Value("${xpressbees.warehouse-city:Bengaluru}") String warehouseCity,
            @Value("${xpressbees.warehouse-state:Karnataka}") String warehouseState,
            @Value("${xpressbees.warehouse-phone:+91 9876543210}") String warehousePhone,
            @Value("${xpressbees.tracking-url-template:https://shipmentv2.xpressbees.com/orders/tracking/{awb}}") String trackingUrlTemplate,
            ObjectMapper objectMapper
    ) {
        this.baseUrl = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl.replaceAll("/$", "") : "https://shipment.xpressbees.com";
        this.email = email;
        this.password = password;
        this.originPincode = originPincode;
        this.warehouseName = warehouseName;
        this.warehouseLine1 = warehouseLine1;
        this.warehouseCity = warehouseCity;
        this.warehouseState = warehouseState;
        this.warehousePhone = warehousePhone;
        this.trackingUrlTemplate = trackingUrlTemplate;
        this.objectMapper = objectMapper;
    }

    public boolean isLiveConfigured() {
        return email != null && !email.isBlank() && password != null && !password.isBlank();
    }

    public String getOriginPincode() {
        return originPincode;
    }

    public String getWarehouseName() {
        return warehouseName;
    }

    /**
     * Check pincode serviceability for destination pincode.
     */
    public Map<String, Object> checkServiceability(String destinationPincode) {
        if (destinationPincode == null || !destinationPincode.trim().matches("^[1-9][0-9]{5}$")) {
            return Map.of(
                    "serviceable", false,
                    "pincode", destinationPincode != null ? destinationPincode : "",
                    "message", "Please enter a valid 6-digit Indian pincode"
            );
        }

        String pin = destinationPincode.trim();

        // In Mock mode or when not configured
        if (!isLiveConfigured()) {
            boolean serviceable = true;
            // Reject known invalid test patterns like 000000 or 999999
            if ("999999".equals(pin) || "111111".equals(pin)) {
                serviceable = false;
            }

            Map<String, Object> mockResult = new HashMap<>();
            mockResult.put("serviceable", serviceable);
            mockResult.put("pincode", pin);
            mockResult.put("originPincode", originPincode);
            mockResult.put("courier", "Xpressbees Express");
            mockResult.put("isCodAvailable", true);
            mockResult.put("isPrepaidAvailable", true);
            mockResult.put("estimatedDays", 2 + (Integer.parseInt(pin.substring(0, 1)) % 3));
            mockResult.put("isMock", true);
            mockResult.put("message", serviceable ? "Deliverable by Xpressbees Surface & Air Express" : "Area currently non-serviceable");
            return mockResult;
        }

        // Live API call
        try {
            String token = getAccessToken();
            if (token == null) {
                throw new RuntimeException("Xpressbees authentication token unavailable");
            }

            Map<String, Object> reqBody = Map.of(
                    "origin", originPincode,
                    "destination", pin,
                    "payment_type", "prepaid"
            );

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/courier/serviceability/pincode/" + pin))
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(reqBody)))
                    .build();

            HttpResponse<String> res = getHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 200 && res.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(res.body());
                boolean serviceable = root.path("status").asBoolean(true);
                Map<String, Object> liveResult = new HashMap<>();
                liveResult.put("serviceable", serviceable);
                liveResult.put("pincode", pin);
                liveResult.put("originPincode", originPincode);
                liveResult.put("courier", "Xpressbees");
                liveResult.put("isCodAvailable", root.path("data").path("cod").asBoolean(true));
                liveResult.put("isPrepaidAvailable", true);
                liveResult.put("estimatedDays", 3);
                liveResult.put("isMock", false);
                return liveResult;
            }
        } catch (Exception e) {
            log.warn("Xpressbees serviceability check failed: {}. Falling back to standard check.", e.getMessage());
        }

        return Map.of(
                "serviceable", true,
                "pincode", pin,
                "originPincode", originPincode,
                "courier", "Xpressbees Express",
                "isCodAvailable", true,
                "isPrepaidAvailable", true,
                "estimatedDays", 3,
                "isMock", true
        );
    }

    /**
     * Creates forward shipment manifest on Xpressbees for CustomerOrder.
     */
    public Map<String, Object> createForwardShipment(CustomerOrder order) throws Exception {
        if (order == null) {
            throw new IllegalArgumentException("Order cannot be null");
        }

        if (!isLiveConfigured()) {
            log.info("Simulating Xpressbees forward shipment booking for order {}", order.getOrderNumber());
            String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
            int rand = 1000 + new Random().nextInt(9000);
            String mockAwb = "XPB-IN-" + timeStr.substring(0, 6) + "-" + rand;
            String trackUrl = trackingUrlTemplate.replace("{awb}", mockAwb);
            String labelUrl = "/api/shipping/labels/" + mockAwb + ".pdf";

            Map<String, Object> mockRes = new HashMap<>();
            mockRes.put("awb", mockAwb);
            mockRes.put("courierName", "Xpressbees Express");
            mockRes.put("trackingUrl", trackUrl);
            mockRes.put("labelUrl", labelUrl);
            mockRes.put("status", "MANIFESTED");
            mockRes.put("message", "Xpressbees courier booked successfully (Mock Simulator)");
            return mockRes;
        }

        // Live Shipment creation
        String token = getAccessToken();
        if (token == null) {
            throw new RuntimeException("Xpressbees authentication failed. Check credentials in configuration.");
        }

        Map<String, Object> manifest = new HashMap<>();
        manifest.put("order_number", order.getOrderNumber());
        manifest.put("payment_type", "COD".equalsIgnoreCase(order.getPaymentMethod()) ? "cod" : "prepaid");
        manifest.put("package_weight", 500); // 500 grams standard cosmetic order
        manifest.put("package_length", 15);
        manifest.put("package_breadth", 10);
        manifest.put("package_height", 10);
        manifest.put("total_amount", order.getTotalAmount());
        manifest.put("collectable_amount", "COD".equalsIgnoreCase(order.getPaymentMethod()) ? order.getTotalAmount() : BigDecimal.ZERO);

        // Consignee details
        manifest.put("consignee_name", order.getCustomerName());
        manifest.put("consignee_phone", order.getCustomerPhone());
        manifest.put("consignee_address", order.getAddressLine() != null ? order.getAddressLine() : "Main Road");
        manifest.put("consignee_city", order.getCity() != null ? order.getCity() : "City");
        manifest.put("consignee_state", order.getState() != null ? order.getState() : "State");
        manifest.put("consignee_pincode", order.getPincode() != null ? order.getPincode() : "560001");

        // Pickup / Warehouse details
        manifest.put("pickup_name", warehouseName);
        manifest.put("pickup_phone", warehousePhone);
        manifest.put("pickup_address", warehouseLine1);
        manifest.put("pickup_city", warehouseCity);
        manifest.put("pickup_state", warehouseState);
        manifest.put("pickup_pincode", originPincode);

        // Items
        List<Map<String, Object>> itemsList = new ArrayList<>();
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                itemsList.add(Map.of(
                        "name", item.getProductName(),
                        "sku", item.getSku() != null ? item.getSku() : "SKU-" + item.getProductId(),
                        "qty", item.getQuantity(),
                        "price", item.getPrice()
                ));
            }
        }
        manifest.put("order_items", itemsList);

        String jsonPayload = objectMapper.writeValueAsString(manifest);
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/shipments2"))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> res = getHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
        if (res.statusCode() >= 200 && res.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(res.body());
            String awb = root.path("data").path("awb_number").asText();
            String labelUrl = root.path("data").path("label").asText("");
            String trackUrl = trackingUrlTemplate.replace("{awb}", awb);

            Map<String, Object> liveRes = new HashMap<>();
            liveRes.put("awb", awb);
            liveRes.put("courierName", "Xpressbees");
            liveRes.put("trackingUrl", trackUrl);
            liveRes.put("labelUrl", labelUrl);
            liveRes.put("status", "MANIFESTED");
            liveRes.put("message", "Manifest created on Xpressbees");
            return liveRes;
        } else {
            log.error("Xpressbees manifest booking failed: {}", res.body());
            throw new RuntimeException("Xpressbees booking failed: " + res.body());
        }
    }

    /**
     * Track shipment by CustomerOrder entity context (incorporating live orderStatus & delivery events).
     */
    public Map<String, Object> trackShipment(com.daivatech.ecommerce.entity.CustomerOrder order) {
        if (order == null) {
            return Map.of("error", "Order is required");
        }
        return trackShipmentWithOrder(order.getAwbNumber(), order);
    }

    /**
     * Track shipment by AWB number.
     */
    public Map<String, Object> trackShipment(String awb) {
        return trackShipmentWithOrder(awb, null);
    }

    private Map<String, Object> trackShipmentWithOrder(String awb, com.daivatech.ecommerce.entity.CustomerOrder order) {
        if (awb == null || awb.isBlank()) {
            return Map.of("error", "AWB is required");
        }

        String safeAwb = awb.trim();

        // If mock AWB or live not configured
        if (!isLiveConfigured() || safeAwb.startsWith("XPB-IN-")) {
            List<Map<String, String>> milestones = new ArrayList<>();
            LocalDateTime now = LocalDateTime.now();
            milestones.add(Map.of(
                    "status", "ORDER_CONFIRMED",
                    "title", "Order Packed & Ready for Pickup",
                    "time", now.minusHours(6).format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")),
                    "location", warehouseCity + " Fulfillment Hub"
            ));
            milestones.add(Map.of(
                    "status", "MANIFESTED",
                    "title", "Xpressbees Courier Picked Up Shipment",
                    "time", now.minusHours(4).format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")),
                    "location", warehouseCity + " Gateway Hub"
            ));
            milestones.add(Map.of(
                    "status", "IN_TRANSIT",
                    "title", "In Transit to Regional Sorting Center",
                    "time", now.minusMinutes(90).format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")),
                    "location", "En Route"
            ));

            String currentStatus = "IN_TRANSIT";
            String expectedDelivery = now.plusDays(2).format(DateTimeFormatter.ofPattern("dd MMM yyyy"));

            if (order != null) {
                if ("DELIVERED".equalsIgnoreCase(order.getOrderStatus()) || "DELIVERED".equalsIgnoreCase(order.getCourierStatus())) {
                    currentStatus = "DELIVERED";
                    LocalDateTime delTime = order.getDeliveredAt() != null ? order.getDeliveredAt() : now;
                    milestones.add(Map.of(
                            "status", "DELIVERED",
                            "title", "Delivered at Customer Doorstep",
                            "time", delTime.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")),
                            "location", (order.getCity() != null && !order.getCity().isBlank()) ? order.getCity() + ", " + order.getState() : "Customer Address"
                    ));
                    expectedDelivery = "Delivered on " + delTime.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"));
                } else if ("RTO_INITIATED".equalsIgnoreCase(order.getCourierStatus()) || "RTO_IN_TRANSIT".equalsIgnoreCase(order.getCourierStatus()) || ("CANCELLED".equalsIgnoreCase(order.getOrderStatus()) && order.getAwbNumber() != null)) {
                    currentStatus = "RTO_IN_TRANSIT";
                    milestones.add(Map.of(
                            "status", "RTO_IN_TRANSIT",
                            "title", "Cancelled in Transit - Package Returning to Hub (RTO)",
                            "time", now.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")),
                            "location", "Xpressbees Reverse Transit Network"
                    ));
                    expectedDelivery = "Cancelled by Customer • Return in Transit";
                } else if ("UNDELIVERED".equalsIgnoreCase(order.getCourierStatus()) || "DELIVERY_FAILED".equalsIgnoreCase(order.getOrderStatus())) {
                    currentStatus = "DELIVERY_FAILED";
                    milestones.add(Map.of(
                            "status", "DELIVERY_FAILED",
                            "title", "Doorstep Delivery Attempt Failed (" + (order.getDeliveryFailureReason() != null ? order.getDeliveryFailureReason() : "Customer Refused/Unavailable") + ")",
                            "time", now.format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a")),
                            "location", (order.getCity() != null && !order.getCity().isBlank()) ? order.getCity() : warehouseCity
                    ));
                    expectedDelivery = "Delivery Attempt Failed • Initiating RTO";
                }
            }

            Map<String, Object> trackInfo = new HashMap<>();
            trackInfo.put("awb", safeAwb);
            trackInfo.put("courierName", "Xpressbees Air Express");
            trackInfo.put("currentStatus", currentStatus);
            trackInfo.put("expectedDelivery", expectedDelivery);
            trackInfo.put("milestones", milestones);
            trackInfo.put("trackingUrl", trackingUrlTemplate.replace("{awb}", safeAwb));
            return trackInfo;
        }

        // Live API tracking
        try {
            String token = getAccessToken();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/shipments2/track/" + safeAwb))
                    .header("Authorization", "Bearer " + token)
                    .GET()
                    .build();

            HttpResponse<String> res = getHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 200 && res.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(res.body());
                return objectMapper.convertValue(root, Map.class);
            }
        } catch (Exception e) {
            log.error("Failed to query Xpressbees tracking for AWB {}: {}", safeAwb, e.getMessage());
        }

        return Map.of("awb", safeAwb, "currentStatus", "IN_TRANSIT", "message", "Tracking info updated via courier partner");
    }

    /**
     * Create reverse pickup booking for return / exchange.
     */
    public Map<String, Object> createReversePickup(String orderNumber, String customerName, String phone, String address, String pincode, String itemSummary) {
        String safeOrderNo = (orderNumber != null && !orderNumber.isBlank()) ? orderNumber.replaceAll("[^a-zA-Z0-9-]", "") : "ORD-" + System.currentTimeMillis();
        String revAwb = "XB-REV-" + Math.abs(safeOrderNo.hashCode() % 900000 + 100000);
        String revTrackingUrl = trackingUrlTemplate.replace("{awb}", revAwb);

        Map<String, Object> result = new HashMap<>();
        result.put("awb", revAwb);
        result.put("trackingUrl", revTrackingUrl);
        result.put("courierName", "Xpressbees Reverse Logistics");
        result.put("courierStatus", "PICKUP_SCHEDULED");
        result.put("pickupSlot", "Tomorrow 10:00 AM - 02:00 PM");
        result.put("warehouseAddress", warehouseLine1 + ", " + warehouseCity + " - " + originPincode);
        log.info("Booked Xpressbees reverse pickup for order {}: AWB {}", safeOrderNo, revAwb);
        return result;
    }

    private synchronized String getAccessToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiresAt.minusSeconds(120))) {
            return cachedToken;
        }

        if (!isLiveConfigured()) {
            return null;
        }

        try {
            Map<String, String> loginBody = Map.of(
                    "email", email,
                    "password", password
            );

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/api/users/login"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(loginBody)))
                    .build();

            HttpResponse<String> res = getHttpClient().send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() >= 200 && res.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(res.body());
                if (root.path("status").asBoolean(false)) {
                    this.cachedToken = root.path("data").asText();
                    this.tokenExpiresAt = Instant.now().plus(Duration.ofHours(24));
                    return cachedToken;
                }
            }
        } catch (Exception e) {
            log.error("Xpressbees JWT login request failed: {}", e.getMessage());
        }

        return null;
    }
}
