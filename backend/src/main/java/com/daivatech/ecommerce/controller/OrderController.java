package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.dto.OrderRequest;
import com.daivatech.ecommerce.entity.CustomerOrder;
import com.daivatech.ecommerce.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody OrderRequest request) {
        try {
            CustomerOrder order = orderService.createOrder(request);
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{orderNumber}")
    public ResponseEntity<?> getOrderByNumber(@PathVariable String orderNumber) {
        return orderService.getOrderByNumber(orderNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<CustomerOrder>> getUserOrders(@PathVariable Long userId) {
        return ResponseEntity.ok(orderService.getOrdersByUser(userId));
    }

    /**
     * Customer cancel order endpoint (Pre-dispatch or In-transit)
     */
    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(@PathVariable Long orderId, @RequestBody(required = false) Map<String, String> body) {
        try {
            String reason = body != null ? body.get("reason") : "Customer requested cancellation";
            CustomerOrder order = orderService.cancelOrder(orderId, reason, "Customer");
            return ResponseEntity.ok(order);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Customer request return or exchange
     */
    @PostMapping("/{orderId}/return-exchange")
    public ResponseEntity<?> requestReturnOrExchange(@PathVariable Long orderId, @RequestBody Map<String, Object> body) {
        try {
            Long userId = body.get("userId") != null ? Long.valueOf(body.get("userId").toString()) : null;
            String type = (String) body.getOrDefault("type", "RETURN");
            String reasonCategory = (String) body.getOrDefault("reasonCategory", "QUALITY_ISSUE");
            String detailedReason = (String) body.getOrDefault("detailedReason", "");
            String proofImageUrl = (String) body.get("proofImageUrl");
            Long originalProductId = body.get("originalProductId") != null ? Long.valueOf(body.get("originalProductId").toString()) : null;
            Long exchangeProductId = body.get("exchangeProductId") != null ? Long.valueOf(body.get("exchangeProductId").toString()) : null;

            com.daivatech.ecommerce.entity.OrderReturnExchange result = orderService.requestReturnOrExchange(
                    orderId, userId, type, reasonCategory, detailedReason, proofImageUrl, originalProductId, exchangeProductId
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get return/exchange requests for an order
     */
    @GetMapping("/{orderId}/return-exchange")
    public ResponseEntity<?> getOrderReturns(@PathVariable Long orderId) {
        return ResponseEntity.ok(orderService.getReturnExchangesForOrder(orderId));
    }
}
