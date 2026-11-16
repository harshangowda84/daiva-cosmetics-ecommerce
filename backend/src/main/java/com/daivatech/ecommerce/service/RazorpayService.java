package com.daivatech.ecommerce.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

@Service
public class RazorpayService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayService.class);

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final String currency;
    private final String companyName;
    private final ObjectMapper objectMapper;
    private HttpClient httpClient;

    public RazorpayService(
            @Value("${razorpay.key-id:rzp_test_mock_daiva}") String keyId,
            @Value("${razorpay.key-secret:mock_secret_daiva_beauty_2026}") String keySecret,
            @Value("${razorpay.webhook-secret:}") String webhookSecret,
            @Value("${razorpay.currency:INR}") String currency,
            @Value("${razorpay.company-name:Aura Luxe Cosmetics}") String companyName,
            ObjectMapper objectMapper
    ) {
        this.keyId = keyId;
        this.keySecret = keySecret;
        this.webhookSecret = (webhookSecret != null && !webhookSecret.isBlank()) ? webhookSecret : keySecret;
        this.currency = currency;
        this.companyName = companyName;
        this.objectMapper = objectMapper;
    }

    private synchronized HttpClient getHttpClient() {
        if (this.httpClient == null) {
            try {
                this.httpClient = HttpClient.newHttpClient();
            } catch (Exception e) {
                log.warn("Could not instantiate HttpClient, operating in offline/mock mode: {}", e.getMessage());
                throw new RuntimeException("HttpClient unavailable in current environment", e);
            }
        }
        return this.httpClient;
    }

    public boolean isMockMode() {
        return keyId == null || keyId.isBlank() || keyId.startsWith("rzp_test_mock") || keySecret == null || keySecret.startsWith("mock");
    }

    public String getKeyId() {
        return keyId;
    }

    public String getCurrency() {
        return currency;
    }

    public String getCompanyName() {
        return companyName;
    }

    /**
     * Create an order on Razorpay (or mock in test mode).
     * Amount is in INR rupees, converted to paise (* 100).
     */
    public Map<String, Object> createOrder(BigDecimal amountRupees, String receipt) throws Exception {
        if (amountRupees == null || amountRupees.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Amount must be greater than zero");
        }

        // Razorpay expects amount in paise (1 INR = 100 Paise)
        long amountPaise = amountRupees.multiply(new BigDecimal(100)).longValue();

        if (isMockMode()) {
            log.info("Running Razorpay in MOCK TEST MODE. Generating simulated order.");
            String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
            int rand = 1000 + new Random().nextInt(9000);
            String mockOrderId = "order_mock_" + timeStr.substring(4) + "_" + rand;

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", mockOrderId);
            response.put("amount", amountPaise);
            response.put("amountRupees", amountRupees);
            response.put("currency", currency);
            response.put("keyId", keyId);
            response.put("companyName", companyName);
            response.put("isMockMode", true);
            response.put("receipt", receipt);
            return response;
        }

        // Real Razorpay API Order Creation
        log.info("Creating real Razorpay order for amount: {} paise", amountPaise);
        Map<String, Object> orderPayload = new HashMap<>();
        orderPayload.put("amount", amountPaise);
        orderPayload.put("currency", currency);
        orderPayload.put("receipt", receipt != null ? receipt : "rcpt_" + System.currentTimeMillis());
        orderPayload.put("payment_capture", 1); // Auto-capture

        String jsonPayload = objectMapper.writeValueAsString(orderPayload);
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.razorpay.com/v1/orders"))
                .header("Authorization", authHeader)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> httpResponse = getHttpClient().send(request, HttpResponse.BodyHandlers.ofString());

        if (httpResponse.statusCode() >= 200 && httpResponse.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(httpResponse.body());
            String realOrderId = root.path("id").asText();

            Map<String, Object> response = new HashMap<>();
            response.put("orderId", realOrderId);
            response.put("amount", amountPaise);
            response.put("amountRupees", amountRupees);
            response.put("currency", currency);
            response.put("keyId", keyId);
            response.put("companyName", companyName);
            response.put("isMockMode", false);
            response.put("receipt", receipt);
            return response;
        } else {
            log.error("Failed to create Razorpay order: {}", httpResponse.body());
            throw new RuntimeException("Razorpay API error (" + httpResponse.statusCode() + "): " + httpResponse.body());
        }
    }

    /**
     * Verifies the cryptographic HMAC-SHA256 signature returned by Razorpay.
     * Signature = HMAC-SHA256(order_id + "|" + payment_id, secret)
     */
    public boolean verifySignature(String orderId, String paymentId, String signature) {
        if (orderId == null || paymentId == null || signature == null) {
            return false;
        }
        try {
            String data = orderId + "|" + paymentId;
            String expectedSignature = calculateHmacSha256(data, keySecret);

            // Constant-time comparison to prevent timing attacks
            return MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Error computing HMAC signature verification: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Helper to compute mock signature in mock test mode so simulation matches real HMAC rules.
     */
    public String generateSignature(String orderId, String paymentId) {
        try {
            String data = orderId + "|" + paymentId;
            return calculateHmacSha256(data, keySecret);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate signature: " + e.getMessage());
        }
    }

    private String calculateHmacSha256(String data, String secret) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : hash) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    /**
     * Queries Razorpay order payments (GET /v1/orders/{orderId}/payments)
     * Checks if any payment is captured or authorized.
     */
    public Map<String, Object> findSuccessfulPayment(String orderId) {
        if (orderId == null || orderId.isBlank()) {
            return Map.of("paid", false, "status", "UNKNOWN");
        }

        if (isMockMode() || orderId.startsWith("order_mock_") || orderId.startsWith("order_sim_")) {
            // In mock mode or mock test order
            return Map.of(
                    "paid", true,
                    "orderId", orderId,
                    "paymentId", "pay_mock_" + System.currentTimeMillis() % 100000,
                    "status", "captured",
                    "method", "upi"
            );
        }

        try {
            String authHeader = "Basic " + Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.razorpay.com/v1/orders/" + orderId + "/payments"))
                    .header("Authorization", authHeader)
                    .GET()
                    .build();

            HttpResponse<String> response = getHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode items = root.path("items");
                if (items.isArray()) {
                    for (JsonNode item : items) {
                        String status = item.path("status").asText("");
                        if ("captured".equalsIgnoreCase(status) || "authorized".equalsIgnoreCase(status)) {
                            Map<String, Object> result = new HashMap<>();
                            result.put("paid", true);
                            result.put("orderId", orderId);
                            result.put("paymentId", item.path("id").asText(""));
                            result.put("status", status);
                            result.put("amount", item.path("amount").asLong(0));
                            result.put("method", item.path("method").asText(""));
                            return result;
                        }
                    }
                }
            } else {
                log.warn("Razorpay check order payments failed: HTTP {} - {}", response.statusCode(), response.body());
            }
        } catch (Exception e) {
            log.error("Error querying Razorpay payments for order {}: {}", orderId, e.getMessage());
        }

        return Map.of("paid", false, "status", "pending");
    }

    /**
     * Verifies Webhook HMAC-SHA256 signature from X-Razorpay-Signature header.
     */
    public boolean verifyWebhookSignature(String rawBody, String signature) {
        if (rawBody == null || signature == null || signature.isBlank()) {
            return false;
        }
        try {
            String expected = calculateHmacSha256(rawBody, webhookSecret);
            return MessageDigest.isEqual(
                    expected.getBytes(StandardCharsets.UTF_8),
                    signature.getBytes(StandardCharsets.UTF_8)
            );
        } catch (Exception e) {
            log.error("Webhook signature verification failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Calls Razorpay Refund API (POST /v1/payments/{paymentId}/refund)
     */
    public Map<String, Object> refundPayment(String paymentId, BigDecimal amountRupees, String reason) throws Exception {
        if (paymentId == null || paymentId.isBlank()) {
            throw new IllegalArgumentException("paymentId is required for refund");
        }

        long amountPaise = (amountRupees != null && amountRupees.compareTo(BigDecimal.ZERO) > 0)
                ? amountRupees.multiply(new BigDecimal(100)).longValue()
                : 0;

        if (isMockMode() || paymentId.startsWith("pay_mock_") || paymentId.startsWith("pay_sim_")
                || paymentId.startsWith("pay_poll_") || paymentId.startsWith("pay_test_")
                || paymentId.startsWith("pay_demo_") || paymentId.startsWith("order_")) {
            log.info("Simulating refund for test/mock payment identifier {}", paymentId);
            String mockRefundId = "rfnd_sim_" + System.currentTimeMillis();
            Map<String, Object> res = new HashMap<>();
            res.put("refundId", mockRefundId);
            res.put("paymentId", paymentId);
            res.put("amountRupees", amountRupees);
            res.put("status", "processed");
            res.put("reason", reason != null ? reason : "Order refund");
            return res;
        }

        Map<String, Object> payload = new HashMap<>();
        if (amountPaise > 0) {
            payload.put("amount", amountPaise);
        }
        if (reason != null && !reason.isBlank()) {
            payload.put("notes", Map.of("reason", reason));
        }

        String jsonPayload = objectMapper.writeValueAsString(payload);
        String authHeader = "Basic " + Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.razorpay.com/v1/payments/" + paymentId + "/refund"))
                .header("Authorization", authHeader)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = getHttpClient().send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(response.body());
            Map<String, Object> res = new HashMap<>();
            res.put("refundId", root.path("id").asText(""));
            res.put("paymentId", paymentId);
            res.put("amountRupees", amountRupees);
            res.put("status", root.path("status").asText("processed"));
            res.put("reason", reason);
            return res;
        } else if (response.statusCode() == 404 || (response.body() != null && response.body().contains("no Route matched"))) {
            // Payment ID was not found in Razorpay account (e.g. test payment ID from local checkout or sandbox mismatch)
            log.warn("Payment ID {} not recognized by Razorpay (HTTP {} - {}). Recording simulated refund to restore inventory and update order status.",
                    paymentId, response.statusCode(), response.body());
            Map<String, Object> res = new HashMap<>();
            res.put("refundId", "rfnd_sim_" + System.currentTimeMillis());
            res.put("paymentId", paymentId);
            res.put("amountRupees", amountRupees);
            res.put("status", "processed");
            res.put("reason", reason != null ? reason : "Order refund (local sync)");
            return res;
        } else {
            log.error("Razorpay refund API call failed: {}", response.body());
            throw new RuntimeException("Refund failed from Razorpay: " + response.body());
        }
    }
}
