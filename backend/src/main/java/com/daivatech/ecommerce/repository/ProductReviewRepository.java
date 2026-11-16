package com.daivatech.ecommerce.repository;

import com.daivatech.ecommerce.entity.ProductReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProductIdOrderByCreatedAtDesc(Long productId);
    List<ProductReview> findByProductIdAndVisibleTrueOrderByCreatedAtDesc(Long productId);
    List<ProductReview> findAllByOrderByCreatedAtDesc();
    List<ProductReview> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndProductId(Long userId, Long productId);
    long countByProductId(Long productId);
    long countByProductIdAndVisibleTrue(Long productId);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.productId = :productId AND (r.visible IS NULL OR r.visible = true)")
    Double getAverageRatingForProduct(Long productId);
}
