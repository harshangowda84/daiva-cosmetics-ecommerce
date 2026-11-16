package com.daivatech.ecommerce.repository;

import com.daivatech.ecommerce.entity.UserBrowsingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserBrowsingHistoryRepository extends JpaRepository<UserBrowsingHistory, Long> {
    List<UserBrowsingHistory> findByUserIdOrderByViewedAtDesc(Long userId);
    Optional<UserBrowsingHistory> findByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserIdAndProductId(Long userId, Long productId);
    void deleteByUserId(Long userId);
}
