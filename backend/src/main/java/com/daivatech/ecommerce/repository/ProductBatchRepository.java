package com.daivatech.ecommerce.repository;

import com.daivatech.ecommerce.entity.ProductBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductBatchRepository extends JpaRepository<ProductBatch, Long> {

    List<ProductBatch> findByProductIdOrderByCreatedAtDesc(Long productId);

    List<ProductBatch> findByProductIdAndStatusOrderByCreatedAtAsc(Long productId, String status);

    Optional<ProductBatch> findByBatchNumber(String batchNumber);

    Optional<ProductBatch> findFirstByBatchNumberIgnoreCase(String batchNumber);

    List<ProductBatch> findByBatchNumberContainingIgnoreCaseOrProductNameContainingIgnoreCase(String batchQuery, String productQuery);

    long countByProductId(Long productId);
}
