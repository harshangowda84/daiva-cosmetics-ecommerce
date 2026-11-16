package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.CustomerOrder;
import com.daivatech.ecommerce.entity.RazorpayWebhookEvent;
import com.daivatech.ecommerce.repository.CustomerOrderRepository;
import com.daivatech.ecommerce.repository.RazorpayWebhookEventRepository;
import com.daivatech.ecommerce.service.RazorpayService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final RazorpayService razorpayService;
    private final CustomerOrderRepository orderRepository;
    private final RazorpayWebhookEventRepository webhookEventRepository;
    private final ObjectMapper objectMapper;

    public PaymentController(RazorpayService razorpayService,
                             CustomerOrderRepository orderRepository,
                             RazorpayWebhookEventRepository webhookEventRepository,
                             ObjectMapper objectMapper) {
        this.razorpayService = razorpayService;
        this.orderRepository = orderRepository;
        this.webhookEventRepository = webhookEventRepository;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/config")
    public ResponseEntity<?> getConfig() {
        return ResponseEntity.ok(Map.of(
                "keyId", razorpayService.getKeyId(),
                "currency", razorpayService.getCurrency(),
                "companyName", razorpayService.getCompanyName(),
                "isMockMode", razorpayService.isMockMode()
        ));
    }

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("amount") || payload.get("amount") == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Amount is required"));
            }
            BigDecimal amount = new BigDecimal(payload.get("amount").toString());
            String receipt = payload.get("receipt") != null ? payload.get("receipt").toString() : null;

            Map<String, Object> orderDetails = razorpayService.createOrder(amount, receipt);
            return ResponseEntity.ok(orderDetails);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to create order"));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> payload) {
        String orderId = payload.get("orderId");
        String paymentId = payload.get("paymentId");
        String signature = payload.get("signature");

        if (orderId == null || paymentId == null || signature == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", "orderId, paymentId, and signature are all required"
            ));
        }

        boolean isValid = razorpayService.verifySignature(orderId, paymentId, signature);
        if (isValid) {
            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "message", "Payment signature cryptographically verified successfully"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", "Invalid payment signature. Verification failed."
            ));
        }
    }

    /**
     * Helper for frontend mock simulation: generates simulated payment ID and matching valid HMAC signature.
     */
    @PostMapping("/mock-simulate")
    public ResponseEntity<?> simulateMockPayment(@RequestBody Map<String, String> payload) {
        if (!razorpayService.isMockMode()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Mock simulation is only available in mock test mode"));
        }
        String orderId = payload.get("orderId");
        if (orderId == null || orderId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "orderId is required"));
        }

        String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = 1000 + new Random().nextInt(9000);
        String paymentId = "pay_mock_" + timeStr.substring(4) + "_" + rand;
        String signature = razorpayService.generateSignature(orderId, paymentId);

        return ResponseEntity.ok(Map.of(
                "orderId", orderId,
                "paymentId", paymentId,
                "signature", signature,
                "status", "SUCCESS"
        ));
    }

    /**
     * Active polling endpoint used by checkout screen.
     * Checks if Razorpay has captured/authorized the order.
     */
    @GetMapping("/order-status/{orderId}")
    public ResponseEntity<?> checkOrderStatus(@PathVariable String orderId) {
        Map<String, Object> paymentStatus = razorpayService.findSuccessfulPayment(orderId);
        return ResponseEntity.ok(paymentStatus);
    }

    /**
     * Inbound Razorpay Webhook receiver with HMAC signature verification and idempotency check.
     */
    @PostMapping("/webhook")
    public ResponseEntity<?> handleWebhook(
            @RequestBody String rawBody,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        if (signature == null || signature.isBlank()) {
            log.warn("Incoming Razorpay webhook missing X-Razorpay-Signature header");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing signature"));
        }

        // Verify HMAC-SHA256 signature
        if (!razorpayService.verifyWebhookSignature(rawBody, signature)) {
            log.error("Incoming Razorpay webhook signature verification failed!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid signature"));
        }

        try {
            JsonNode root = objectMapper.readTree(rawBody);
            String event = root.path("event").asText("");
            String eventId = root.path("id").asText("");

            if (eventId.isBlank()) {
                eventId = "evt_" + event + "_" + System.currentTimeMillis();
            }

            // Check Idempotency: Reject if already processed
            if (webhookEventRepository.existsByEventId(eventId)) {
                log.info("Duplicate Razorpay webhook event {} received. Skipping.", eventId);
                return ResponseEntity.ok(Map.of("status", "duplicate_ignored", "eventId", eventId));
            }

            JsonNode payload = root.path("payload");
            JsonNode paymentEntity = payload.path("payment").path("entity");
            JsonNode orderEntity = payload.path("order").path("entity");

            String paymentId = paymentEntity.path("id").asText(null);
            String razorpayOrderId = paymentEntity.path("order_id").asText(orderEntity.path("id").asText(null));

            // Record event into idempotency ledger
            RazorpayWebhookEvent eventRecord = new RazorpayWebhookEvent(
                    eventId,
                    event,
                    razorpayOrderId,
                    paymentId,
                    "PROCESSED"
            );
            webhookEventRepository.save(eventRecord);

            // Handle payment success events
            if ("order.paid".equalsIgnoreCase(event) || "payment.captured".equalsIgnoreCase(event)) {
                if (razorpayOrderId != null && !razorpayOrderId.isBlank()) {
                    // Update matching customer order
                    Optional<CustomerOrder> orderOpt = orderRepository.findAll().stream()
                            .filter(o -> razorpayOrderId.equals(o.getRazorpayOrderId()))
                            .findFirst();

                    if (orderOpt.isPresent()) {
                        CustomerOrder order = orderOpt.get();
                        order.setPaymentStatus("PAID");
                        if (paymentId != null && (order.getRazorpayPaymentId() == null || order.getRazorpayPaymentId().isBlank())) {
                            order.setRazorpayPaymentId(paymentId);
                        }
                        orderRepository.save(order);
                        log.info("Order {} marked PAID via webhook event {}", order.getOrderNumber(), eventId);
                    }
                }
            }

            return ResponseEntity.ok(Map.of("status", "success", "event", event, "eventId", eventId));
        } catch (Exception e) {
            log.error("Failed to parse Razorpay webhook payload: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
