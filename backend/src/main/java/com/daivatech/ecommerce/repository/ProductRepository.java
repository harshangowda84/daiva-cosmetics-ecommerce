package com.daivatech.ecommerce.repository;

import com.daivatech.ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySlug(String slug);

    Optional<Product> findBySku(String sku);

    Optional<Product> findByZohoItemId(String zohoItemId);

    List<Product> findByCategoryIgnoreCase(String category);

    List<Product> findBySubCategoryIgnoreCase(String subCategory);

    List<Product> findByIsFeaturedTrue();

    List<Product> findByIsBestSellerTrue();

    @Query("SELECT p FROM Product p WHERE p.isActive = true AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.subCategory) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(p.description) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Product> searchProducts(@Param("q") String query);
}
