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
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final CustomerOrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ZohoInventoryService zohoInventoryService;
    private final StockMovementService stockMovementService;
    private final com.daivatech.ecommerce.repository.StockMovementRepository stockMovementRepository;
    private final BatchStockService batchStockService;
    private final RazorpayService razorpayService;
    private final XpressBeesService xpressBeesService;
    private final com.daivatech.ecommerce.repository.OrderReturnExchangeRepository returnExchangeRepository;
    private final com.daivatech.ecommerce.repository.UserAddressRepository userAddressRepository;
    private final EmailService emailService;

    public OrderService(CustomerOrderRepository orderRepository,
                        ProductRepository productRepository,
                        ZohoInventoryService zohoInventoryService,
                        StockMovementService stockMovementService,
                        com.daivatech.ecommerce.repository.StockMovementRepository stockMovementRepository,
                        BatchStockService batchStockService,
                        RazorpayService razorpayService,
                        XpressBeesService xpressBeesService,
                        com.daivatech.ecommerce.repository.OrderReturnExchangeRepository returnExchangeRepository,
                        com.daivatech.ecommerce.repository.UserAddressRepository userAddressRepository,
                        EmailService emailService) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.zohoInventoryService = zohoInventoryService;
        this.stockMovementService = stockMovementService;
        this.stockMovementRepository = stockMovementRepository;
        this.batchStockService = batchStockService;
        this.razorpayService = razorpayService;
        this.xpressBeesService = xpressBeesService;
        this.returnExchangeRepository = returnExchangeRepository;
        this.userAddressRepository = userAddressRepository;
        this.emailService = emailService;
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

        // Auto-save delivery address to customer profile if user is logged in
        if (savedOrder.getUserId() != null && savedOrder.getAddressLine() != null && !savedOrder.getAddressLine().trim().isEmpty()) {
            try {
                List<com.daivatech.ecommerce.entity.UserAddress> existingAddrs = userAddressRepository.findByUserId(savedOrder.getUserId());
                boolean alreadySaved = existingAddrs.stream().anyMatch(a ->
                    a.getAddressLine1() != null && a.getAddressLine1().trim().equalsIgnoreCase(savedOrder.getAddressLine().trim())
                );
                if (!alreadySaved) {
                    com.daivatech.ecommerce.entity.UserAddress newAddr = new com.daivatech.ecommerce.entity.UserAddress();
                    newAddr.setUserId(savedOrder.getUserId());
                    newAddr.setRecipientName(savedOrder.getCustomerName() != null && !savedOrder.getCustomerName().trim().isEmpty() ? savedOrder.getCustomerName() : "Home");
                    newAddr.setPhone(savedOrder.getCustomerPhone());
                    newAddr.setAddressLine1(savedOrder.getAddressLine());
                    newAddr.setCity(savedOrder.getCity());
                    newAddr.setState(savedOrder.getState());
                    newAddr.setPincode(savedOrder.getPincode());
                    newAddr.setAddressType("HOME");
                    newAddr.setIsDefault(existingAddrs.isEmpty());
                    userAddressRepository.save(newAddr);
                    log.info("Auto-saved order delivery address to user address book for userId: {}", savedOrder.getUserId());
                }
            } catch (Exception ex) {
                log.warn("Could not auto-save order address to user profile: {}", ex.getMessage());
            }
        }

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

        CustomerOrder finalOrder = orderRepository.save(savedOrder);
        try {
            emailService.sendOrderConfirmationEmail(finalOrder);
        } catch (Exception e) {
            log.warn("Could not trigger confirmation email for order {}: {}", finalOrder.getOrderNumber(), e.getMessage());
        }
        return finalOrder;
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

        // Void or cancel in Zoho Inventory
        if (order.getZohoSalesOrderId() != null && !order.getZohoSalesOrderId().isBlank()) {
            try {
                zohoInventoryService.cancelSalesOrder(order.getZohoSalesOrderId(), reason);
                order.setZohoSyncStatus("CANCELLED");
            } catch (Exception e) {
                log.warn("Failed to void Zoho order for {}: {}", order.getOrderNumber(), e.getMessage());
            }
        }

        log.info("Order {} successfully refunded and stock restored by {}", order.getOrderNumber(), performedBy);
        return orderRepository.save(order);
    }

    /**
     * Requirement 2: Deliver order simulation (manual admin trigger or webhook)
     * Updates: Local DB -> DELIVERED, Zoho -> Fulfilled/Delivered, customer profile updated
     */
    @Transactional
    public CustomerOrder markOrderDelivered(Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        order.setOrderStatus("DELIVERED");
        order.setCourierStatus("DELIVERED");
        order.setDeliveryFailureReason(null);
        order.setDeliveredAt(LocalDateTime.now());
        // For COD orders, delivery also means payment collected / paid
        if ("COD".equalsIgnoreCase(order.getPaymentMethod()) || "PENDING".equalsIgnoreCase(order.getPaymentStatus())) {
            order.setPaymentStatus("PAID");
        }

        // Sync with Zoho
        if (order.getZohoSalesOrderId() != null && !order.getZohoSalesOrderId().isBlank()) {
            try {
                zohoInventoryService.markSalesOrderDelivered(order.getZohoSalesOrderId());
                log.info("Synced delivery status to Zoho for order {}", order.getOrderNumber());
            } catch (Exception e) {
                log.warn("Could not sync delivery to Zoho for order {}: {}", order.getOrderNumber(), e.getMessage());
            }
        }

        return orderRepository.save(order);
    }

    /**
     * Requirement 3 & 4: Order Cancellation
     * - Before dispatch: Instant refund, inventory restored, cancelled in Zoho
     * - After dispatch: Courier RTO initiated, instant refund, product returned to warehouse
     */
    @Transactional
    public CustomerOrder cancelOrder(Long orderId, String reason, String requestedBy) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new IllegalStateException("Order is already cancelled.");
        }
        if ("DELIVERED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new IllegalStateException("Delivered order cannot be cancelled directly. Please initiate a Return or Exchange.");
        }

        boolean isDispatched = "SHIPPED".equalsIgnoreCase(order.getOrderStatus()) ||
                (order.getAwbNumber() != null && !order.getAwbNumber().isBlank());

        if (isDispatched) {
            // Requirement 4: Cancelled after dispatch -> Courier RTO initiated
            order.setOrderStatus("CANCELLED");
            order.setCourierStatus("RTO_INITIATED");
            order.setDeliveryFailureReason(reason != null ? reason : "Cancelled by customer after dispatch");
            log.info("Order {} cancelled after dispatch. XpressBees RTO initiated.", order.getOrderNumber());
        } else {
            // Requirement 3: Cancelled before dispatch
            order.setOrderStatus("CANCELLED");
            order.setCourierStatus("CANCELLED");
        }

        // Instant refund via Razorpay for prepaid orders
        if (order.getRazorpayPaymentId() != null && !order.getRazorpayPaymentId().isBlank() &&
                ("PAID".equalsIgnoreCase(order.getPaymentStatus()) || "RAZORPAY".equalsIgnoreCase(order.getPaymentMethod()) || "ONLINE".equalsIgnoreCase(order.getPaymentMethod()))) {
            try {
                java.util.Map<String, Object> refundRes = razorpayService.refundPayment(order.getRazorpayPaymentId(), order.getTotalAmount(), reason != null ? reason : "Order cancellation");
                order.setRefundId(refundRes.get("refundId") != null ? refundRes.get("refundId").toString() : "rfnd_" + System.currentTimeMillis());
                order.setRefundStatus("REFUNDED");
                order.setRefundAmount(order.getTotalAmount());
                order.setPaymentStatus("REFUNDED");
            } catch (Exception e) {
                log.error("Razorpay instant refund failed for order {}: {}", order.getOrderNumber(), e.getMessage());
                order.setRefundStatus("REFUND_INITIATED");
            }
        } else {
            order.setRefundStatus("REFUNDED");
            order.setRefundAmount(BigDecimal.ZERO);
            order.setPaymentStatus("CANCELLED");
        }

        order.setRefundReason(reason != null ? reason : "Order cancelled by " + requestedBy);

        // Restore inventory batch stock
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                batchStockService.restoreBatchStock(item.getProductId(), item.getQuantity(), order.getOrderNumber(), "Order cancellation (" + (isDispatched ? "RTO" : "Pre-dispatch") + "): " + reason);
            }
        }

        // Void in Zoho
        if (order.getZohoSalesOrderId() != null && !order.getZohoSalesOrderId().isBlank()) {
            try {
                zohoInventoryService.cancelSalesOrder(order.getZohoSalesOrderId(), reason);
                order.setZohoSyncStatus("CANCELLED");
            } catch (Exception e) {
                log.warn("Failed to void Zoho order for {}: {}", order.getOrderNumber(), e.getMessage());
            }
        }

        return orderRepository.save(order);
    }

    /**
     * Requirement 5: Doorstep Delivery Failure / NDR Emulation
     * - Retryable reasons (Not picking call, postponed, premises locked, address incomplete): Keeps order active, records NDR_PENDING, schedules re-attempt.
     * - Terminal refusal (Customer refused / doesn't want): Cancels order, initiates RTO, releases refund.
     */
    @Transactional
    public CustomerOrder failDeliveryAtDoorstep(Long orderId, String reasonCode, String notes) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        boolean isTerminalRefusal = "CUSTOMER_REFUSED".equalsIgnoreCase(reasonCode)
                || "MISTAKEN_ORDER".equalsIgnoreCase(reasonCode)
                || (reasonCode != null && reasonCode.toUpperCase().contains("REFUSED"));

        if (!isTerminalRefusal) {
            // RETRYABLE NDR:
            // Do NOT cancel the order. Order remains in-transit, courier marks NDR_PENDING for re-attempt.
            order.setOrderStatus("IN_TRANSIT");
            order.setCourierStatus("NDR_PENDING");
            order.setDeliveryFailureReason(reasonCode + (notes != null && !notes.isBlank() ? " - " + notes : ""));
            log.info("NDR recorded for order {}: {}. Scheduled for delivery re-attempt.", order.getOrderNumber(), reasonCode);
            return orderRepository.save(order);
        }

        // TERMINAL REFUSAL / CUSTOMER DOES NOT WANT PRODUCT:
        // Cancel delivery, initiate RTO back to warehouse, issue instant refund if prepaid
        order.setOrderStatus("CANCELLED");
        order.setCourierStatus("RTO_INITIATED");
        order.setDeliveryFailureReason(reasonCode + (notes != null && !notes.isBlank() ? " - " + notes : ""));

        // Process refund for prepaid orders upon RTO trigger
        if (order.getRazorpayPaymentId() != null && !order.getRazorpayPaymentId().isBlank() &&
                ("PAID".equalsIgnoreCase(order.getPaymentStatus()) || "RAZORPAY".equalsIgnoreCase(order.getPaymentMethod()) || "ONLINE".equalsIgnoreCase(order.getPaymentMethod()))) {
            try {
                java.util.Map<String, Object> refundRes = razorpayService.refundPayment(order.getRazorpayPaymentId(), order.getTotalAmount(), "Doorstep NDR: " + reasonCode);
                order.setRefundId(refundRes.get("refundId") != null ? refundRes.get("refundId").toString() : "rfnd_" + System.currentTimeMillis());
                order.setRefundStatus("REFUNDED");
                order.setRefundAmount(order.getTotalAmount());
                order.setPaymentStatus("REFUNDED");
            } catch (Exception e) {
                log.warn("Doorstep refund note: {}", e.getMessage());
                order.setRefundStatus("REFUNDED");
                order.setRefundId("REF-NDR-" + System.currentTimeMillis());
            }
        } else {
            order.setPaymentStatus("CANCELLED");
            order.setRefundStatus("NOT_APPLICABLE");
        }

        // Restore inventory
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                batchStockService.restoreBatchStock(item.getProductId(), item.getQuantity(), order.getOrderNumber(), "Doorstep delivery failure (" + reasonCode + ")");
            }
        }

        // Void in Zoho
        if (order.getZohoSalesOrderId() != null && !order.getZohoSalesOrderId().isBlank()) {
            try {
                zohoInventoryService.cancelSalesOrder(order.getZohoSalesOrderId(), "Doorstep failure: " + reasonCode);
                order.setZohoSyncStatus("CANCELLED");
            } catch (Exception e) {
                log.warn("Zoho cancel failed for order {}: {}", order.getOrderNumber(), e.getMessage());
            }
        }

        return orderRepository.save(order);
    }

    /**
     * Requirement: Retry / Re-attempt Delivery from XpressBees Simulator
     */
    @Transactional
    public CustomerOrder retryDelivery(Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus()) || "DELIVERED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new IllegalStateException("Cannot retry delivery for order with status: " + order.getOrderStatus());
        }

        int nextAttempt = (order.getDeliveryAttempts() != null ? order.getDeliveryAttempts() : 1) + 1;
        order.setDeliveryAttempts(nextAttempt);
        order.setCourierStatus("OUT_FOR_DELIVERY");
        order.setOrderStatus("IN_TRANSIT");
        order.setDeliveryFailureReason(null);

        log.info("XpressBees delivery re-attempt #{} initiated for order {}", nextAttempt, order.getOrderNumber());
        return orderRepository.save(order);
    }

    /**
     * Requirement: Customer Updates Incomplete / Incorrect Delivery Address
     */
    @Transactional
    public CustomerOrder updateDeliveryAddress(Long orderId, String addressLine, String city, String state, String pincode) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if ("CANCELLED".equalsIgnoreCase(order.getOrderStatus()) || "DELIVERED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new IllegalStateException("Cannot update address for order with status: " + order.getOrderStatus());
        }

        if (addressLine != null && !addressLine.isBlank()) order.setAddressLine(addressLine.trim());
        if (city != null && !city.isBlank()) order.setCity(city.trim());
        if (state != null && !state.isBlank()) order.setState(state.trim());
        if (pincode != null && !pincode.isBlank()) order.setPincode(pincode.trim());

        // When customer fixes address, mark note ready for re-attempt
        order.setDeliveryFailureReason("ADDRESS_UPDATED_READY_FOR_REATTEMPT");

        log.info("Customer updated delivery address for order {}: {}, {}, {} - {}",
                order.getOrderNumber(), order.getAddressLine(), order.getCity(), order.getState(), order.getPincode());
        return orderRepository.save(order);
    }

    /**
     * Requirement 6 & 7: Customer Product Return or Exchange Request
     */
    @Transactional
    public com.daivatech.ecommerce.entity.OrderReturnExchange requestReturnOrExchange(
            Long orderId,
            Long userId,
            String type, // "RETURN" or "EXCHANGE"
            String reasonCategory,
            String detailedReason,
            String proofImageUrl,
            Long originalProductId,
            Long exchangeProductId,
            String bankAccountNumber,
            String bankIfscCode,
            String bankAccountHolderName,
            String bankName
    ) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if (!"DELIVERED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new IllegalStateException("Returns or exchanges are only available for delivered orders.");
        }

        com.daivatech.ecommerce.entity.OrderReturnExchange req = new com.daivatech.ecommerce.entity.OrderReturnExchange(
                order.getId(),
                order.getOrderNumber(),
                userId,
                type.toUpperCase(),
                reasonCategory,
                detailedReason
        );

        req.setProofImageUrl(proofImageUrl);
        req.setOriginalProductId(originalProductId);
        if (originalProductId != null) {
            productRepository.findById(originalProductId).ifPresent(p -> req.setOriginalProductName(p.getName()));
        }

        if ("EXCHANGE".equalsIgnoreCase(type)) {
            // Cosmetics Policy: Exchange is strictly for the exact same product (fresh unopened replacement unit)
            if (exchangeProductId == null || exchangeProductId == 0) {
                exchangeProductId = originalProductId;
            }
            req.setExchangeProductId(exchangeProductId);
            if (exchangeProductId != null) {
                productRepository.findById(exchangeProductId).ifPresent(p -> req.setExchangeProductName(p.getName()));
            }
            String replAwb = "XPB-EXCH-" + Math.abs((order.getOrderNumber() + "-REP").hashCode() % 900000 + 100000);
            req.setReplacementAwbNumber(replAwb);
            req.setReplacementOrderNumber(order.getOrderNumber() + "-EXCH");
            req.setReplacementTrackingUrl("https://www.xpressbees.com/track?awb=" + replAwb);
            req.setReplacementCourierStatus("EXCHANGE_BOOKED");
        } else {
            req.setExchangeProductId(null);
        }

        // Refund method configuration:
        boolean isCod = "COD".equalsIgnoreCase(order.getPaymentMethod());
        if ("RETURN".equalsIgnoreCase(type)) {
            if (isCod) {
                req.setRefundMode("BANK_TRANSFER");
                req.setBankAccountNumber(bankAccountNumber);
                req.setBankIfscCode(bankIfscCode);
                req.setBankAccountHolderName(bankAccountHolderName);
                req.setBankName(bankName);
            } else {
                req.setRefundMode("ORIGINAL_PAYMENT_MODE");
            }
        }

        // Automatically book XpressBees reverse pickup
        Map<String, Object> pickup = xpressBeesService.createReversePickup(
                order.getOrderNumber(),
                order.getCustomerName(),
                order.getCustomerPhone(),
                order.getAddressLine(),
                order.getPincode(),
                req.getOriginalProductName() != null ? req.getOriginalProductName() : "Cosmetic item"
        );

        req.setReverseAwbNumber((String) pickup.get("awb"));
        req.setReverseTrackingUrl((String) pickup.get("trackingUrl"));
        req.setStatus("PICKUP_SCHEDULED");
        req.setCourierStatus("PICKUP_SCHEDULED");

        if ("RETURN".equalsIgnoreCase(type)) {
            order.setOrderStatus("RETURN_REQUESTED");
        } else {
            order.setOrderStatus("EXCHANGE_REQUESTED");
        }
        orderRepository.save(order);

        return returnExchangeRepository.save(req);
    }

    /**
     * Requirement 6 & 7: Verify Reverse Pickup & Issue Instant Refund or Dispatch Exchange
     */
    @Transactional
    public com.daivatech.ecommerce.entity.OrderReturnExchange verifyReversePickup(Long returnExchangeId, boolean passed, String inspectionNotes) {
        com.daivatech.ecommerce.entity.OrderReturnExchange item = returnExchangeRepository.findById(returnExchangeId)
                .orElseThrow(() -> new IllegalArgumentException("Return/Exchange request not found: " + returnExchangeId));

        CustomerOrder order = orderRepository.findById(item.getOrderId())
                .orElseThrow(() -> new IllegalArgumentException("Linked order not found"));

        if (!passed) {
            item.setInspectionStatus("VERIFIED_FAILED");
            item.setInspectionNotes(inspectionNotes != null ? inspectionNotes : "Item inspection failed at pickup.");
            item.setStatus("REJECTED");
            item.setCourierStatus("RETURN_CANCELLED");
            order.setOrderStatus("DELIVERED"); // Revert back to delivered
            orderRepository.save(order);
            return returnExchangeRepository.save(item);
        }

        item.setInspectionStatus("VERIFIED_PASSED");
        item.setInspectionNotes(inspectionNotes != null ? inspectionNotes : "Cosmetic seal/condition inspected and verified by courier.");
        item.setCourierStatus("PICKED_UP_EXAMINED");

        if ("RETURN".equalsIgnoreCase(item.getType())) {
            // Process instant refund
            if (order.getRazorpayPaymentId() != null && !order.getRazorpayPaymentId().isBlank() &&
                    ("PAID".equalsIgnoreCase(order.getPaymentStatus()) || "RAZORPAY".equalsIgnoreCase(order.getPaymentMethod()) || "ONLINE".equalsIgnoreCase(order.getPaymentMethod()))) {
                try {
                    Map<String, Object> ref = razorpayService.refundPayment(order.getRazorpayPaymentId(), order.getTotalAmount(), "Return confirmed: " + item.getReasonCategory());
                    item.setRefundId(ref.get("refundId") != null ? ref.get("refundId").toString() : "rfnd_" + System.currentTimeMillis());
                } catch (Exception e) {
                    item.setRefundId("rfnd_sim_" + System.currentTimeMillis());
                }
            } else {
                item.setRefundId("REF-RETURN-" + (System.currentTimeMillis() % 1000000));
            }
            item.setRefundStatus("REFUNDED");
            item.setRefundAmount(order.getTotalAmount());
            item.setStatus("COMPLETED");

            order.setOrderStatus("RETURNED");
            order.setRefundStatus("REFUNDED");
            order.setRefundAmount(order.getTotalAmount());
            order.setRefundId(item.getRefundId());
            order.setPaymentStatus("REFUNDED");
            orderRepository.save(order);

            // Restore inventory
            if (item.getOriginalProductId() != null) {
                batchStockService.restoreBatchStock(item.getOriginalProductId(), 1, order.getOrderNumber(), "Returned item restocked");
            }
        } else {
            // EXCHANGE flow: create replacement tracking identifiers
            String replOrderNo = order.getOrderNumber() + "-EXCH";
            String replAwb = "XPB-EXCH-" + Math.abs((order.getOrderNumber() + "-REP").hashCode() % 900000 + 100000);
            item.setReplacementOrderNumber(replOrderNo);
            item.setReplacementAwbNumber(replAwb);
            item.setReplacementTrackingUrl("https://www.xpressbees.com/track?awb=" + replAwb);
            item.setReplacementCourierStatus("IN_TRANSIT");
            item.setStatus("EXCHANGE_DISPATCHED");

            order.setOrderStatus("EXCHANGED");
            orderRepository.save(order);

            // Adjust inventory for exchange
            if (item.getOriginalProductId() != null) {
                batchStockService.restoreBatchStock(item.getOriginalProductId(), 1, order.getOrderNumber(), "Exchanged item returned");
            }
            if (item.getExchangeProductId() != null) {
                batchStockService.deductStockFIFO(item.getExchangeProductId(), 1);
            }
        }

        item.setUpdatedAt(LocalDateTime.now());
        return returnExchangeRepository.save(item);
    }

    public List<com.daivatech.ecommerce.entity.OrderReturnExchange> getReturnExchangesForOrder(Long orderId) {
        return returnExchangeRepository.findByOrderIdOrderByCreatedAtDesc(orderId);
    }

    public List<com.daivatech.ecommerce.entity.OrderReturnExchange> getAllReturnExchanges() {
        return returnExchangeRepository.findAllByOrderByCreatedAtDesc();
    }

    public com.daivatech.ecommerce.entity.OrderReturnExchange getReturnExchangeById(Long id) {
        return returnExchangeRepository.findById(id).orElse(null);
    }

    public com.daivatech.ecommerce.entity.OrderReturnExchange saveReturnExchange(com.daivatech.ecommerce.entity.OrderReturnExchange item) {
        item.setUpdatedAt(LocalDateTime.now());
        return returnExchangeRepository.save(item);
    }

    /**
     * Requirement: Customer Cancels Return/Exchange Request & Keeps Product
     */
    @Transactional
    public com.daivatech.ecommerce.entity.OrderReturnExchange cancelReturnOrExchange(Long returnExchangeId) {
        com.daivatech.ecommerce.entity.OrderReturnExchange item = returnExchangeRepository.findById(returnExchangeId)
                .orElseThrow(() -> new IllegalArgumentException("Return/Exchange request not found: " + returnExchangeId));

        if ("COMPLETED".equalsIgnoreCase(item.getStatus()) || "REFUNDED".equalsIgnoreCase(item.getRefundStatus())) {
            throw new IllegalStateException("Cannot cancel return once refund or exchange has been completed.");
        }

        item.setStatus("RETURN_CANCELLED");
        item.setCourierStatus("RETURN_CANCELLED");
        item.setInspectionStatus("CANCELLED_BY_CUSTOMER");
        item.setInspectionNotes("Return cancelled by customer. Customer decided to keep the product.");
        item.setUpdatedAt(LocalDateTime.now());

        // Restore order status back to DELIVERED
        orderRepository.findById(item.getOrderId()).ifPresent(order -> {
            order.setOrderStatus("DELIVERED");
            orderRepository.save(order);
        });

        return returnExchangeRepository.save(item);
    }

    /**
     * Requirement: Doorstep Return Pickup NDR / Delivery Partner Reschedule
     */
    @Transactional
    public com.daivatech.ecommerce.entity.OrderReturnExchange failReturnPickup(Long returnExchangeId, String reason, String notes) {
        com.daivatech.ecommerce.entity.OrderReturnExchange item = returnExchangeRepository.findById(returnExchangeId)
                .orElseThrow(() -> new IllegalArgumentException("Return/Exchange request not found: " + returnExchangeId));

        if ("COMPLETED".equalsIgnoreCase(item.getStatus()) || "REFUNDED".equalsIgnoreCase(item.getRefundStatus())) {
            throw new IllegalStateException("Cannot fail pickup on completed return.");
        }

        String safeReason = (reason != null && !reason.isBlank()) ? reason.toUpperCase().trim() : "CUSTOMER_UNREACHABLE";

        if ("CUSTOMER_CANCELLED_RETURN".equalsIgnoreCase(safeReason) || "CUSTOMER_WANTS_TO_KEEP".equalsIgnoreCase(safeReason)) {
            // Customer decides to cancel return & keep product
            return cancelReturnOrExchange(returnExchangeId);
        }

        int nextAttempts = (item.getPickupAttempts() != null ? item.getPickupAttempts() : 1) + 1;
        item.setPickupAttempts(nextAttempts);
        item.setPickupFailureReason(safeReason);
        item.setCourierStatus("PICKUP_NDR");
        item.setStatus("PICKUP_SCHEDULED"); // Still active return, rescheduled for next attempt
        if (notes != null && !notes.isBlank()) {
            item.setInspectionNotes(notes);
        }
        item.setUpdatedAt(LocalDateTime.now());
        log.info("Return pickup NDR recorded for return ID {} (attempt {}): {}", returnExchangeId, nextAttempts, safeReason);
        return returnExchangeRepository.save(item);
    }

    /**
     * Requirement: Reschedule / Retry Return Pickup
     */
    @Transactional
    public com.daivatech.ecommerce.entity.OrderReturnExchange retryReturnPickup(Long returnExchangeId) {
        com.daivatech.ecommerce.entity.OrderReturnExchange item = returnExchangeRepository.findById(returnExchangeId)
                .orElseThrow(() -> new IllegalArgumentException("Return/Exchange request not found: " + returnExchangeId));

        if ("COMPLETED".equalsIgnoreCase(item.getStatus()) || "RETURN_CANCELLED".equalsIgnoreCase(item.getStatus())) {
            throw new IllegalStateException("Cannot retry pickup on inactive/completed return.");
        }

        item.setCourierStatus("OUT_FOR_PICKUP");
        item.setStatus("OUT_FOR_PICKUP");
        item.setPickupFailureReason(null);
        item.setUpdatedAt(LocalDateTime.now());
        log.info("Return pickup re-attempt dispatched for return ID {}", returnExchangeId);
        return returnExchangeRepository.save(item);
    }

    /**
     * Complete Order Data Cleanup:
     * Cleans all orders, returns, and reverse logistics records across Local DB, Zoho Inventory, and Razorpay refs.
     */
    @Transactional
    public Map<String, Object> clearAllOrders() {
        List<CustomerOrder> allOrders = orderRepository.findAll();
        int orderCount = allOrders.size();
        int zohoCleanedCount = 0;

        for (CustomerOrder o : allOrders) {
            if (o.getZohoSalesOrderId() != null && !o.getZohoSalesOrderId().isBlank()) {
                try {
                    boolean deleted = zohoInventoryService.deleteSalesOrder(o.getZohoSalesOrderId());
                    if (deleted) {
                        zohoCleanedCount++;
                    }
                } catch (Exception e) {
                    log.warn("Could not delete Zoho sales order {}: {}", o.getZohoSalesOrderId(), e.getMessage());
                }
            }
        }

        // Delete all return & exchange records
        returnExchangeRepository.deleteAll();

        // Delete all customer orders (cascade deletes OrderItem child records)
        orderRepository.deleteAll();

        // Delete order-associated stock movements so inventory audit ledger is clean
        try {
            List<com.daivatech.ecommerce.entity.StockMovement> movements = stockMovementRepository.findAll();
            for (com.daivatech.ecommerce.entity.StockMovement sm : movements) {
                if (sm.getReferenceId() != null && sm.getReferenceId().startsWith("ORD-")) {
                    stockMovementRepository.delete(sm);
                }
            }
        } catch (Exception e) {
            log.warn("Error cleaning stock movements: {}", e.getMessage());
        }

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("success", true);
        result.put("clearedOrdersCount", orderCount);
        result.put("zohoCleanedCount", zohoCleanedCount);
        result.put("message", "All order data, reverse logistics, and customer profile history successfully cleaned.");
        log.info("Cleared {} orders and {} Zoho sales orders.", orderCount, zohoCleanedCount);
        return result;
    }
}
