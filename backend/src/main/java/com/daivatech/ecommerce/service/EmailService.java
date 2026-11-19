package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.entity.CustomerOrder;
import com.daivatech.ecommerce.entity.OrderItem;
import com.daivatech.ecommerce.entity.User;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${app.mail.from:concierge@auraluxe.com}")
    private String mailFrom;

    @Value("${app.mail.from-name:Aura Luxe Paris}")
    private String mailFromName;

    @Value("${spring.mail.username:}")
    private String smtpUsername;

    @Value("${spring.mail.host:smtp.gmail.com}")
    private String smtpHost;

    @Value("${spring.mail.port:587}")
    private int smtpPort;

    private final JavaMailSender mailSender;

    // In-memory capped ring buffer for recent sent email audit logs
    private final ConcurrentLinkedDeque<EmailLogEntry> recentLogs = new ConcurrentLinkedDeque<>();
    private static final int MAX_LOGS = 60;

    @Autowired
    public EmailService(@Autowired(required = false) JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send Luxury Welcome Email to newly registered customer (Local, Google, or Apple Sign-In).
     */
    @Async
    public void sendWelcomeEmail(User user) {
        if (!mailEnabled || user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        String recipient = user.getEmail().trim();
        String name = (user.getFullName() != null && !user.getFullName().isBlank()) ? user.getFullName().trim() : "Valued Patron";
        String subject = "Bienvenue dans l'Univers Aura Luxe ✨ Welcome to Aura Luxe";

        String htmlContent = buildWelcomeHtml(name);
        dispatchEmail(recipient, subject, htmlContent, "WELCOME", "New customer welcome email to " + name);
    }

    /**
     * Send Order Confirmation Email with itemized receipt, variant specs, and shipping address.
     */
    @Async
    public void sendOrderConfirmationEmail(CustomerOrder order) {
        if (!mailEnabled || order == null || order.getCustomerEmail() == null || order.getCustomerEmail().isBlank()) {
            return;
        }

        String recipient = order.getCustomerEmail().trim();
        String name = (order.getCustomerName() != null && !order.getCustomerName().isBlank()) ? order.getCustomerName().trim() : "Valued Patron";
        String subject = "Order Confirmed #" + order.getOrderNumber() + " ✨ Aura Luxe Paris";

        String htmlContent = buildOrderConfirmationHtml(order, name);
        dispatchEmail(recipient, subject, htmlContent, "ORDER_CONFIRMATION", "Order confirmation for #" + order.getOrderNumber() + " (Total: ₹" + order.getTotalAmount() + ")");
    }

    /**
     * Send Shipping / Dispatched Email with AWB tracking link and courier details.
     */
    @Async
    public void sendShippingUpdateEmail(CustomerOrder order, String trackingNumber, String courier) {
        if (!mailEnabled || order == null || order.getCustomerEmail() == null || order.getCustomerEmail().isBlank()) {
            return;
        }

        String recipient = order.getCustomerEmail().trim();
        String name = (order.getCustomerName() != null && !order.getCustomerName().isBlank()) ? order.getCustomerName().trim() : "Valued Patron";
        String awb = (trackingNumber != null && !trackingNumber.isBlank()) ? trackingNumber : (order.getAwbNumber() != null ? order.getAwbNumber() : "PENDING");
        String courierPartner = (courier != null && !courier.isBlank()) ? courier : (order.getCourierName() != null ? order.getCourierName() : "Xpressbees Express");
        String subject = "Your Order #" + order.getOrderNumber() + " Has Dispatched! 📦 Track #" + awb;

        String htmlContent = buildShippingUpdateHtml(order, name, awb, courierPartner);
        dispatchEmail(recipient, subject, htmlContent, "ORDER_DISPATCHED", "Dispatch alert for #" + order.getOrderNumber() + " (AWB: " + awb + ")");
    }

    /**
     * Send Test Email triggered from Admin panel.
     */
    public boolean sendTestEmail(String targetEmail, String testType) {
        if (targetEmail == null || targetEmail.isBlank()) {
            return false;
        }

        String recipient = targetEmail.trim();
        String subject = "Aura Luxe SMTP Diagnostic Test: " + (testType != null ? testType.toUpperCase() : "GENERAL");
        String htmlContent = buildTestEmailHtml(recipient, testType);

        return dispatchEmail(recipient, subject, htmlContent, "TEST", "Admin diagnostic test trigger for " + recipient);
    }

    /**
     * Core email dispatch logic: sends real SMTP MIME email if credentials are configured,
     * otherwise gracefully simulates and logs without blocking or throwing.
     */
    private boolean dispatchEmail(String recipient, String subject, String htmlContent, String type, String details) {
        LocalDateTime now = LocalDateTime.now();
        boolean hasSmtpConfigured = (smtpUsername != null && !smtpUsername.isBlank());

        if (mailSender != null && hasSmtpConfigured) {
            try {
                MimeMessage mimeMessage = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
                helper.setFrom(new InternetAddress(mailFrom, mailFromName));
                helper.setTo(recipient);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);

                mailSender.send(mimeMessage);
                log.info("[EmailService] Successfully sent SMTP email to {} | Subject: {}", recipient, subject);
                recordLog(recipient, subject, type, "DELIVERED_VIA_SMTP", details, now);
                return true;
            } catch (Exception ex) {
                log.warn("[EmailService] SMTP delivery failed for {} ({}). Falling back to simulated delivery: {}", recipient, ex.getClass().getSimpleName(), ex.getMessage());
                recordLog(recipient, subject, type, "SIMULATED_MOCK (SMTP Attempt Failed: " + ex.getMessage() + ")", details, now);
                return true; // Graceful non-blocking
            }
        } else {
            // Simulated delivery mode
            log.info("[EmailService - SIMULATED] Recipient: {} | Subject: {} | Type: {} (Configure SPRING_MAIL_USERNAME for live delivery)", recipient, subject, type);
            recordLog(recipient, subject, type, "SIMULATED_MOCK", details + " [Live SMTP credentials not set; mock dispatched successfully]", now);
            return true;
        }
    }

    private void recordLog(String recipient, String subject, String type, String status, String details, LocalDateTime time) {
        EmailLogEntry entry = new EmailLogEntry(
                UUID.randomUUID().toString(),
                recipient,
                subject,
                type,
                status,
                details,
                time.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
        );
        recentLogs.addFirst(entry);
        while (recentLogs.size() > MAX_LOGS) {
            recentLogs.pollLast();
        }
    }

    public List<EmailLogEntry> getRecentLogs() {
        return new ArrayList<>(recentLogs);
    }

    public Map<String, Object> getStatus() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("enabled", mailEnabled);
        status.put("from", mailFrom);
        status.put("fromName", mailFromName);
        status.put("smtpHost", smtpHost);
        status.put("smtpPort", smtpPort);
        status.put("smtpConfigured", smtpUsername != null && !smtpUsername.isBlank());
        status.put("senderBeanPresent", mailSender != null);
        status.put("totalLoggedEmails", recentLogs.size());
        return status;
    }

    // ==========================================
    // HTML TEMPLATES - AURA LUXE HAUTE COUTURE
    // ==========================================

    private String getCommonHeader() {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Aura Luxe Paris</title>
              <style>
                body { margin: 0; padding: 0; background-color: #FAF9F6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1c1917; -webkit-font-smoothing: antialiased; }
                .email-wrapper { max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #f0eee9; box-shadow: 0 4px 20px rgba(0,0,0,0.03); }
                .header { background: #121212; padding: 36px 20px 30px; text-align: center; border-bottom: 2px solid #C6A052; }
                .brand-title { font-size: 26px; font-weight: 300; letter-spacing: 0.28em; color: #ffffff; text-transform: uppercase; margin: 0; }
                .brand-sub { font-size: 10px; font-weight: 500; letter-spacing: 0.35em; color: #C6A052; text-transform: uppercase; margin-top: 6px; }
                .content { padding: 40px 32px; }
                .footer { background-color: #faf8f5; padding: 28px 24px; text-align: center; border-top: 1px solid #f0eee9; font-size: 12px; color: #78716c; line-height: 1.6; }
                .btn-gold { display: inline-block; background-color: #121212; color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 13px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; border: 1px solid #C6A052; }
                .gold-divider { height: 1px; background: linear-gradient(90deg, transparent, #C6A052, transparent); margin: 24px 0; }
                .pill { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
                .pill-gold { background: #fdf8eb; color: #997327; border: 1px solid #edd59b; }
                .pill-green { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
              </style>
            </head>
            <body>
              <div class="email-wrapper">
                <div class="header">
                  <h1 class="brand-title">AURA LUXE</h1>
                  <div class="brand-sub">HAUTE PARFUMERIE &amp; BEAUTÉ &bull; PARIS</div>
                </div>
            """;
    }

    private String getCommonFooter() {
        return """
                <div class="footer">
                  <p style="margin: 0 0 8px 0; font-weight: 600; color: #292524; letter-spacing: 0.08em; text-transform: uppercase;">Aura Luxe Flagship Concierge</p>
                  <p style="margin: 0 0 8px 0;">124, 4th Cross, Indiranagar, Bengaluru, KA 560001 &bull; India</p>
                  <p style="margin: 0 0 14px 0;">For bespoke styling, order inquiries, or private consultations, reply to this email or reach us at <a href="mailto:concierge@auraluxe.com" style="color: #997327; text-decoration: underline;">concierge@auraluxe.com</a></p>
                  <div style="font-size: 11px; color: #a8a29e;">&copy; 2026 Aura Luxe Cosmetics Private Limited. All rights reserved.</div>
                </div>
              </div>
            </body>
            </html>
            """;
    }

    private String buildWelcomeHtml(String name) {
        return getCommonHeader() +
            """
                <div class="content">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span class="pill pill-gold">Patron Welcome Privilege</span>
                  </div>
                  <h2 style="font-size: 22px; font-weight: 400; color: #1c1917; text-align: center; margin: 0 0 16px 0; font-family: Georgia, serif;">
                    Bienvenue, %s
                  </h2>
                  <p style="font-size: 14px; line-height: 1.8; color: #44403c; text-align: center; margin: 0 0 24px 0;">
                    We are honored to welcome you into the inner sanctum of Aura Luxe. Our atelier unites botanical potency, high-altitude bio-actives, and French haute perfumery into transcendent skincare rituals.
                  </p>
                  
                  <div class="gold-divider"></div>

                  <div style="background-color: #faf8f5; border: 1px dashed #C6A052; border-radius: 8px; padding: 24px; text-align: center; margin: 28px 0;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #78716c; margin-bottom: 8px;">Exclusive Inaugural Gift</div>
                    <div style="font-size: 24px; font-weight: 700; letter-spacing: 0.15em; color: #1c1917; margin-bottom: 8px;">WELCOME10</div>
                    <div style="font-size: 13px; color: #997327; font-weight: 500;">Enjoy 10%% complimentary privilege on your first luxury order</div>
                  </div>

                  <div style="margin-top: 32px; text-align: center;">
                    <a href="http://localhost:5174/shop" class="btn-gold">Explore The Collection</a>
                  </div>
                </div>
            """.formatted(name) + getCommonFooter();
    }

    private String buildOrderConfirmationHtml(CustomerOrder order, String name) {
        StringBuilder itemsHtml = new StringBuilder();
        if (order.getItems() != null && !order.getItems().isEmpty()) {
            for (OrderItem item : order.getItems()) {
                BigDecimal lineTotal = item.getTotalPrice() != null ? item.getTotalPrice() : (item.getPrice() != null ? item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())) : BigDecimal.ZERO);
                itemsHtml.append("""
                    <tr style="border-bottom: 1px solid #f4f3ef;">
                      <td style="padding: 14px 8px; font-size: 13px; color: #1c1917;">
                        <strong>%s</strong>
                        %s
                      </td>
                      <td style="padding: 14px 8px; font-size: 13px; text-align: center; color: #44403c;">%d</td>
                      <td style="padding: 14px 8px; font-size: 13px; text-align: right; color: #1c1917; font-weight: 600;">₹%s</td>
                    </tr>
                """.formatted(
                    item.getProductName(),
                    (item.getSku() != null && item.getSku().contains("-")) ? "<br><span style='font-size: 11px; color: #78716c;'>SKU: " + item.getSku() + "</span>" : "",
                    item.getQuantity(),
                    lineTotal.toString()
                ));
            }
        }

        String paymentBadge = "PAID".equalsIgnoreCase(order.getPaymentStatus()) ?
                "<span class='pill pill-green'>Paid via Online</span>" :
                "<span class='pill pill-gold'>Cash on Delivery (Pending)</span>";

        String addressText = (order.getAddressLine() != null ? order.getAddressLine() : "") +
                (order.getCity() != null ? ", " + order.getCity() : "") +
                (order.getState() != null ? ", " + order.getState() : "") +
                (order.getPincode() != null ? " - " + order.getPincode() : "");

        return getCommonHeader() +
            """
                <div class="content">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <span class="pill pill-green">Order Confirmed</span>
                  </div>
                  <h2 style="font-size: 22px; font-weight: 400; color: #1c1917; text-align: center; margin: 0 0 8px 0; font-family: Georgia, serif;">
                    Thank You, %s
                  </h2>
                  <p style="font-size: 13px; color: #78716c; text-align: center; margin: 0 0 24px 0;">
                    Your bespoke selection has been confirmed and transferred to our luxury packaging atelier.
                  </p>

                  <div style="background-color: #faf8f5; border: 1px solid #f0eee9; border-radius: 8px; padding: 18px 22px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.1em;">Order Identifier</span>
                      <span style="font-size: 13px; font-weight: 700; color: #1c1917;">#%s</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                      <span style="font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.1em;">Payment Method</span>
                      <span style="font-size: 13px; font-weight: 600; color: #1c1917;">%s</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-size: 12px; color: #78716c; text-transform: uppercase; letter-spacing: 0.1em;">Payment Status</span>
                      <span>%s</span>
                    </div>
                  </div>

                  <table style="width: 100%%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                      <tr style="border-bottom: 2px solid #e7e5e4;">
                        <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; text-align: left; color: #78716c;">Item &amp; Formulation</th>
                        <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; text-align: center; color: #78716c;">Qty</th>
                        <th style="padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; text-align: right; color: #78716c;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      %s
                    </tbody>
                  </table>

                  <div style="border-top: 1px solid #e7e5e4; padding-top: 14px; margin-bottom: 24px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #57534e; margin-bottom: 6px;">
                      <span>Subtotal:</span>
                      <span>₹%s</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: #57534e; margin-bottom: 8px;">
                      <span>White-Glove Shipping:</span>
                      <span>%s</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: 700; color: #1c1917; border-top: 1px dashed #d6d3d1; padding-top: 10px;">
                      <span>Grand Total:</span>
                      <span style="color: #997327;">₹%s</span>
                    </div>
                  </div>

                  <div style="background-color: #faf8f5; border-radius: 8px; padding: 18px 20px; font-size: 13px; color: #44403c; line-height: 1.6;">
                    <div style="font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; font-size: 11px; color: #78716c; margin-bottom: 6px;">Shipping Destination</div>
                    <strong>%s</strong><br>
                    %s<br>
                    Phone: %s
                  </div>

                  <div style="margin-top: 32px; text-align: center;">
                    <a href="http://localhost:5174/orders" class="btn-gold">View Your Orders</a>
                  </div>
                </div>
            """.formatted(
                name,
                order.getOrderNumber(),
                order.getPaymentMethod(),
                paymentBadge,
                itemsHtml.toString(),
                order.getSubtotal() != null ? order.getSubtotal().toString() : "0.00",
                (order.getShippingFee() == null || order.getShippingFee().compareTo(BigDecimal.ZERO) == 0) ? "COMPLIMENTARY" : "₹" + order.getShippingFee(),
                order.getTotalAmount() != null ? order.getTotalAmount().toString() : "0.00",
                order.getCustomerName(),
                addressText,
                order.getCustomerPhone() != null ? order.getCustomerPhone() : ""
            ) + getCommonFooter();
    }

    private String buildShippingUpdateHtml(CustomerOrder order, String name, String awb, String courier) {
        String trackingUrl = (order.getTrackingUrl() != null && !order.getTrackingUrl().isBlank()) ?
                order.getTrackingUrl() :
                ("https://shipmentv2.xpressbees.com/orders/tracking/" + awb);

        return getCommonHeader() +
            """
                <div class="content">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <span class="pill pill-gold">Dispatched &bull; In Transit</span>
                  </div>
                  <h2 style="font-size: 22px; font-weight: 400; color: #1c1917; text-align: center; margin: 0 0 8px 0; font-family: Georgia, serif;">
                    Your Ritual Has Been Dispatched
                  </h2>
                  <p style="font-size: 13px; color: #78716c; text-align: center; margin: 0 0 24px 0;">
                    Dear %s, your order #%s has left our Indiranagar packaging center and is safely in transit with our logistics partner.
                  </p>

                  <div style="background-color: #faf8f5; border: 1px solid #f0eee9; border-radius: 8px; padding: 22px; text-align: center; margin-bottom: 24px;">
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: #78716c; margin-bottom: 6px;">Express Logistics Courier</div>
                    <div style="font-size: 16px; font-weight: 700; color: #1c1917; margin-bottom: 12px;">%s</div>
                    
                    <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.18em; color: #78716c; margin-bottom: 6px;">Waybill (AWB) Tracking Number</div>
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: 0.12em; color: #997327; margin-bottom: 18px;">%s</div>

                    <a href="%s" target="_blank" class="btn-gold" style="padding: 12px 28px; font-size: 12px;">Track Live Shipment</a>
                  </div>

                  <p style="font-size: 12px; color: #78716c; text-align: center; line-height: 1.6; margin: 0;">
                    Expect your parcel within 2-4 business days. A delivery specialist will contact you on <strong>%s</strong> prior to doorstep handoff.
                  </p>
                </div>
            """.formatted(
                name,
                order.getOrderNumber(),
                courier,
                awb,
                trackingUrl,
                order.getCustomerPhone() != null ? order.getCustomerPhone() : "your registered phone"
            ) + getCommonFooter();
    }

    private String buildTestEmailHtml(String recipient, String testType) {
        return getCommonHeader() +
            """
                <div class="content" style="text-align: center;">
                  <span class="pill pill-gold">Diagnostic System Check</span>
                  <h2 style="font-size: 22px; font-weight: 400; color: #1c1917; margin: 16px 0 10px 0; font-family: Georgia, serif;">
                    Aura Luxe Email Engine Active
                  </h2>
                  <p style="font-size: 13px; color: #57534e; line-height: 1.7; max-width: 480px; margin: 0 auto 24px auto;">
                    This diagnostic verification email confirms that the Aura Luxe automated mail subsystem is operating normally. Customer transactional triggers (Welcome, Order Confirmation, and AWB Dispatch) are operational.
                  </p>
                  
                  <div style="background-color: #faf8f5; border: 1px solid #f0eee9; border-radius: 8px; padding: 18px; text-align: left; font-size: 12px; font-family: monospace; color: #44403c; margin-bottom: 24px;">
                    <div>&bull; Recipient: %s</div>
                    <div>&bull; Test Profile: %s</div>
                    <div>&bull; Timestamp: %s</div>
                    <div>&bull; Host: %s:%d</div>
                  </div>
                </div>
            """.formatted(recipient, testType != null ? testType : "GENERAL", LocalDateTime.now(), smtpHost, smtpPort) + getCommonFooter();
    }

    public static class EmailLogEntry implements Serializable {
        private String id;
        private String recipient;
        private String subject;
        private String type;
        private String status;
        private String details;
        private String timestamp;

        public EmailLogEntry() {}

        public EmailLogEntry(String id, String recipient, String subject, String type, String status, String details, String timestamp) {
            this.id = id;
            this.recipient = recipient;
            this.subject = subject;
            this.type = type;
            this.status = status;
            this.details = details;
            this.timestamp = timestamp;
        }

        public String getId() { return id; }
        public String getRecipient() { return recipient; }
        public String getSubject() { return subject; }
        public String getType() { return type; }
        public String getStatus() { return status; }
        public String getDetails() { return details; }
        public String getTimestamp() { return timestamp; }
    }
}
