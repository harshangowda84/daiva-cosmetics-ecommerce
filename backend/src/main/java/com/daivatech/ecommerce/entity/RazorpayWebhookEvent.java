package com.daivatech.ecommerce.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "razorpay_webhook_events")
public class RazorpayWebhookEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_id", length = 160, nullable = false, unique = true)
    private String eventId;

    @Column(name = "event_type", length = 80)
    private String eventType;

    @Column(name = "order_id", length = 80)
    private String orderId;

    @Column(name = "payment_id", length = 80)
    private String paymentId;

    @Column(name = "local_status", length = 80)
    private String localStatus;

    @Column(name = "received_at", nullable = false)
    private LocalDateTime receivedAt = LocalDateTime.now();

    public RazorpayWebhookEvent() {}

    public RazorpayWebhookEvent(String eventId, String eventType, String orderId, String paymentId, String localStatus) {
        this.eventId = eventId;
        this.eventType = eventType;
        this.orderId = orderId;
        this.paymentId = paymentId;
        this.localStatus = localStatus;
        this.receivedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getLocalStatus() { return localStatus; }
    public void setLocalStatus(String localStatus) { this.localStatus = localStatus; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }
}
