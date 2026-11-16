package com.daivatech.ecommerce.repository;

import com.daivatech.ecommerce.entity.RazorpayWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RazorpayWebhookEventRepository extends JpaRepository<RazorpayWebhookEvent, Long> {
    boolean existsByEventId(String eventId);
    Optional<RazorpayWebhookEvent> findByEventId(String eventId);
}
