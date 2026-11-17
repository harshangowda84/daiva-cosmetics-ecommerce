package com.daivatech.ecommerce.repository;

import com.daivatech.ecommerce.entity.OrderReturnExchange;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderReturnExchangeRepository extends JpaRepository<OrderReturnExchange, Long> {
    List<OrderReturnExchange> findByOrderIdOrderByCreatedAtDesc(Long orderId);
    List<OrderReturnExchange> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<OrderReturnExchange> findAllByOrderByCreatedAtDesc();
    Optional<OrderReturnExchange> findByReverseAwbNumber(String reverseAwbNumber);
}
