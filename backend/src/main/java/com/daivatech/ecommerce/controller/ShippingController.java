package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.CustomerOrder;
import com.daivatech.ecommerce.repository.CustomerOrderRepository;
import com.daivatech.ecommerce.service.XpressBeesService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/shipping")
@CrossOrigin(origins = "*")
public class ShippingController {

    private final XpressBeesService xpressBeesService;
    private final CustomerOrderRepository orderRepository;

    public ShippingController(XpressBeesService xpressBeesService, CustomerOrderRepository orderRepository) {
        this.xpressBeesService = xpressBeesService;
        this.orderRepository = orderRepository;
    }

    /**
     * Check if a 6-digit Indian pincode is serviceable by Xpressbees.
     */
    @GetMapping("/serviceability")
    public ResponseEntity<?> checkPincode(@RequestParam String pincode) {
        Map<String, Object> result = xpressBeesService.checkServiceability(pincode);
        return ResponseEntity.ok(result);
    }

    /**
     * Dispatch order via Xpressbees: creates manifest, assigns AWB, updates order.
     */
    @PostMapping("/orders/{orderId}/manifest")
    public ResponseEntity<?> createManifest(@PathVariable Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if (order.getAwbNumber() != null && !order.getAwbNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Order already manifested with AWB: " + order.getAwbNumber()));
        }

        try {
            Map<String, Object> shipmentResult = xpressBeesService.createForwardShipment(order);

            String awb = (String) shipmentResult.get("awb");
            String labelUrl = (String) shipmentResult.get("labelUrl");
            String trackingUrl = (String) shipmentResult.get("trackingUrl");
            String courierName = (String) shipmentResult.get("courierName");

            order.setCourierName(courierName != null ? courierName : "Xpressbees");
            order.setAwbNumber(awb);
            order.setShippingLabelUrl(labelUrl);
            order.setTrackingUrl(trackingUrl);
            order.setCourierStatus("MANIFESTED");
            order.setOrderStatus("SHIPPED");

            CustomerOrder savedOrder = orderRepository.save(order);
            return ResponseEntity.ok(savedOrder);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Failed to manifest shipment with Xpressbees"));
        }
    }

    /**
     * Live tracking endpoint for order.
     */
    @GetMapping("/orders/{orderId}/track")
    public ResponseEntity<?> trackOrder(@PathVariable Long orderId) {
        CustomerOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        if (order.getAwbNumber() == null || order.getAwbNumber().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No shipment tracking number (AWB) assigned yet"));
        }

        Map<String, Object> trackInfo = xpressBeesService.trackShipment(order.getAwbNumber());
        return ResponseEntity.ok(trackInfo);
    }

    /**
     * Quick tracking endpoint by AWB.
     */
    @GetMapping("/track/{awb}")
    public ResponseEntity<?> trackAwb(@PathVariable String awb) {
        Map<String, Object> trackInfo = xpressBeesService.trackShipment(awb);
        return ResponseEntity.ok(trackInfo);
    }

    /**
     * Printable shipping label mockup HTML/PDF preview for simulator.
     */
    @GetMapping(value = "/labels/{awb}.pdf", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getShippingLabel(@PathVariable String awb) {
        String cleanAwb = awb.replace(".pdf", "");
        String html = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Xpressbees Shipping Label - %s</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 40px; background: #f8fafc; }
                        .label-box { max-width: 480px; margin: auto; background: white; border: 2px solid #000; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px; }
                        .logo { font-size: 20px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 1px; }
                        .barcode { text-align: center; margin: 16px 0; background: #fff; padding: 10px; border: 1px dashed #cbd5e1; }
                        .barcode-bars { font-family: monospace; font-size: 36px; letter-spacing: 4px; font-weight: bold; }
                        .awb-text { font-family: monospace; font-weight: 700; margin-top: 4px; font-size: 15px; }
                        .section-title { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 4px; }
                        .address-box { font-size: 14px; line-height: 1.5; color: #1e293b; margin-bottom: 16px; }
                        .badge { display: inline-block; padding: 4px 8px; background: #ecfdf5; color: #047857; font-weight: 700; border-radius: 4px; font-size: 12px; }
                        .print-btn { display: block; width: 100%%; max-width: 480px; margin: 16px auto; padding: 12px; background: #1e293b; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <button class="print-btn" onclick="window.print()">Print Shipping Label</button>
                    <div class="label-box">
                        <div class="header">
                            <div class="logo">Xpressbees Logistics</div>
                            <span class="badge">PREPAID AIR EXPRESS</span>
                        </div>
                        <div class="barcode">
                            <div class="barcode-bars">||||| | |||| || |||||| | |||||</div>
                            <div class="awb-text">AWB: %s</div>
                        </div>
                        <div class="section-title">DELIVER TO (CONSIGNEE):</div>
                        <div class="address-box">
                            <strong>Valued Customer</strong><br/>
                            Shipping Destination Address<br/>
                            PINCODE: 560001 (Karnataka)
                        </div>
                        <div class="section-title">SHIPPED FROM (SENDER):</div>
                        <div class="address-box">
                            <strong>Aura Luxe Cosmetics Central Hub</strong><br/>
                            124, 4th Cross, Indiranagar, Bengaluru - 560001<br/>
                            Customer Care: +91 9876543210
                        </div>
                        <div style="border-top: 1px dashed #cbd5e1; padding-top: 10px; font-size: 11px; color: #64748b; text-align: center;">
                            Cosmetics & Personal Care • Handle with Care • Fragile
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(cleanAwb, cleanAwb);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
                .body(html);
    }
}
