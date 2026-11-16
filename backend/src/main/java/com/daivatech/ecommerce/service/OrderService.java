package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.dto.OrderRequest;
import com.daivatech.ecommerce.entity.CustomerOrder;
import com.daivatech.ecommerce.entity.OrderItem;
import com.daivatech.ecommerce.entity.Product;
import com.daivatech.ecommerce.repository.CustomerOrderRepository;
import com.daivatech.ecommerce.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final CustomerOrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ZohoInventoryService zohoInventoryService;
    private final StockMovementService stockMovementService;
    private final BatchStockService batchStockService;
    private final RazorpayService razorpayService;

    public OrderService(CustomerOrderRepository orderRepository,
                        ProductRepository productRepository,
                        ZohoInventoryService zohoInventoryService,
                        StockMovementService stockMovementService,
                        BatchStockService batchStockService,
                        RazorpayService razorpayService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.zohoInventoryService = zohoInventoryService;
        this.stockMovementService = stockMovementService;
        this.batchStockService = batchStockService;
        this.razorpayService = razorpayService;
    }

    @Transactional
    public CustomerOrder createOrder(OrderRequest request) {
        CustomerOrder order = new CustomerOrder();

        // Generate human-friendly order number
        String timeStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = 1000 + new Random().nextInt(9000);
        order.setOrderNumber("ORD-" + timeStr.substring(2, 8) + "-" + rand);

        order.setUserId(request.getUserId());
        order.setCustomerName(request.getCustomerName());
        order.setCustomerEmail(request.getCustomerEmail());
        order.setCustomerPhone(request.getCustomerPhone());
        order.setAddressLine(request.getAddressLine());
        order.setCity(request.getCity());
        order.setState(request.getState());
        order.setPincode(request.getPincode());
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "COD");
        order.setPaymentStatus(request.getPaymentStatus() != null ? request.getPaymentStatus() : ("COD".equalsIgnoreCase(order.getPaymentMethod()) ? "PENDING" : "PAID"));
        order.setRazorpayOrderId(request.getRazorpayOrderId());
        order.setRazorpayPaymentId(request.getRazorpayPaymentId());
        order.setRazorpaySignature(request.getRazorpaySignature());
        order.setOrderStatus("CONFIRMED");

        BigDecimal subtotal = BigDecimal.ZERO;

        if (request.getItems() != null && !request.getItems().isEmpty()) {
            for (OrderRequest.OrderItemDto itemDto : request.getItems()) {
                Product product = productRepository.findById(itemDto.getProductId())
                        .orElseThrow(() -> new IllegalArgumentException("Product not found: " + itemDto.getProductId()));

                OrderItem item = new OrderItem(
                        product.getId(),
                        product.getName(),
                        product.getSku(),
                        product.getZohoItemId(),
                        product.getImageUrl(),
                        itemDto.getQuantity(),
                        product.getPrice()
                );
                order.addItem(item);

                BigDecimal lineTotal = product.getPrice().multiply(BigDecimal.valueOf(itemDto.getQuantity()));
                subtotal = subtotal.add(lineTotal);

                // Deduct from batches via FIFO
                List<BatchStockService.BatchDeduction> deductions = batchStockService.deductStockFIFO(product.getId(), itemDto.getQuantity());
                StringBuilder batchNote = new StringBuilder();
                if (!deductions.isEmpty()) {
                    batchNote.append(" [Batch: ");
                    for (int i = 0; i < deductions.size(); i++) {
                        if (i > 0) batchNote.append(", ");
                        batchNote.append(deductions.get(i).batchNumber()).append(" (-").append(deductions.get(i).quantity()).append(")");
                    }
                    batchNote.append("]");
                }

                // Decrement local stock
                int prevStock = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
                int remaining = Math.max(0, prevStock - itemDto.getQuantity());
                product.setStockQuantity(remaining);
                productRepository.save(product);

                // Record stock audit movement
                stockMovementService.recordMovement(
                        product,
                        "ORDER_SALE",
                        -itemDto.getQuantity(),
                        prevStock,
                        remaining,
                        order.getOrderNumber(),
                        order.getCustomerEmail() != null ? order.getCustomerEmail() : "Customer Checkout",
                        "Order #" + order.getOrderNumber() + " - " + itemDto.getQuantity() + " unit(s) purchased" + batchNote.toString()
                );
            }
        }

        order.setSubtotal(subtotal);
        // Free shipping if above 999, else 99
        BigDecimal shipping = subtotal.compareTo(new BigDecimal("999")) >= 0 ? BigDecimal.ZERO : new BigDecimal("99");
        order.setShippingFee(shipping);
        order.setTotalAmount(subtotal.add(shipping));

        // Save order in DB first
        CustomerOrder savedOrder = orderRepository.save(order);

        // Async/Sync attempt with Zoho
        try {
            log.info("Attempting Zoho Sales Order sync for order {}", savedOrder.getOrderNumber());
            JsonNode zohoResponse = zohoInventoryService.createSalesOrder(
                    savedOrder.getCustomerName(),
                    savedOrder.getCustomerEmail(),
                    savedOrder.getCustomerPhone(),
                    savedOrder.getOrderNumber(),
                    savedOrder.getItems()
            );

            if (zohoResponse != null && zohoResponse.has("salesorder")) {
                JsonNode so = zohoResponse.get("salesorder");
                String soId = so.has("salesorder_id") ? so.get("salesorder_id").asText() : "";
                String soNum = so.has("salesorder_number") ? so.get("salesorder_number").asText() : "";
                savedOrder.setZohoSalesOrderId(soId);
                savedOrder.setZohoSalesOrderNumber(soNum);
                savedOrder.setZohoSyncStatus("SYNCED");
                log.info("Successfully synced order {} with Zoho: SalesOrder #{}", savedOrder.getOrderNumber(), soNum);
            } else {
                savedOrder.setZohoSyncStatus("FAILED");
                savedOrder.setZohoErrorMessage(zohoResponse != null ? zohoResponse.toString() : "Empty response");
            }
        } catch (Exception e) {
            log.warn("Zoho order sync failed for order {}: {}", savedOrder.getOrderNumber(), e.getMessage());
            savedOrder.setZohoSyncStatus("FAILED");
            savedOrder.setZohoErrorMessage(e.getMessage());
        }

        return orderRepository.save(savedOrder);
    }

    public List<CustomerOrder> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<CustomerOrder> getOrdersByUser(Long userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Optional<CustomerOrder> getOrderByNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber);
    }

    @Transactional
    public CustomerOrder retryZohoSync(Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found: " + orderId));

        try {
            JsonNode zohoResponse = zohoInventoryService.createSalesOrder(
                    order.getCustomerName(),
                    order.getCustomerEmail(),
                    order.getCustomerPhone(),
                    order.getOrderNumber(),
                    order.getItems()
            );

            if (zohoResponse != null && zohoResponse.has("salesorder")) {
                JsonNode so = zohoResponse.get("salesorder");
                order.setZohoSalesOrderId(so.has("salesorder_id") ? so.get("salesorder_id").asText() : "");
                order.setZohoSalesOrderNumber(so.has("salesorder_number") ? so.get("salesorder_number").asText() : "");
                order.setZohoSyncStatus("SYNCED");
                order.setZohoErrorMessage(null);
            }
        } catch (Exception e) {
            order.setZohoSyncStatus("FAILED");
            order.setZohoErrorMessage(e.getMessage());
        }

        return orderRepository.save(order);
    }

    @Transactional
    public CustomerOrder processRefund(Long orderId, String reason, String performedBy) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if ("REFUNDED".equalsIgnoreCase(order.getRefundStatus())) {
            throw new IllegalStateException("Order is already refunded.");
        }

        // If prepaid with Razorpay, invoke Razorpay refund API
        if (order.getRazorpayPaymentId() != null && !order.getRazorpayPaymentId().isBlank() &&
                ("PAID".equalsIgnoreCase(order.getPaymentStatus()) || "RAZORPAY".equalsIgnoreCase(order.getPaymentMethod()) || "ONLINE".equalsIgnoreCase(order.getPaymentMethod()))) {
            try {
                java.util.Map<String, Object> refundRes = razorpayService.refundPayment(order.getRazorpayPaymentId(), order.getTotalAmount(), reason);
                order.setRefundId(refundRes.get("refundId") != null ? refundRes.get("refundId").toString() : "rfnd_" + System.currentTimeMillis());
            } catch (Exception e) {
                log.error("Failed to process Razorpay refund for order {}: {}", order.getOrderNumber(), e.getMessage());
                throw new RuntimeException("Razorpay refund failed: " + e.getMessage());
            }
        } else {
            order.setRefundId("REF-MANUAL-" + (System.currentTimeMillis() % 1000000));
        }

        order.setRefundStatus("REFUNDED");
        order.setRefundAmount(order.getTotalAmount());
        order.setRefundReason(reason != null && !reason.isBlank() ? reason : "Customer refund");
        order.setOrderStatus("CANCELLED");
        order.setPaymentStatus("REFUNDED");

        // Restore inventory for all items in order
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                batchStockService.restoreBatchStock(item.getProductId(), item.getQuantity(), order.getOrderNumber(), reason);
            }
        }

        log.info("Order {} successfully refunded and stock restored by {}", order.getOrderNumber(), performedBy);
        return orderRepository.save(order);
    }
}
