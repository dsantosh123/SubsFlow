package com.subsflow.customer.repository;

import com.subsflow.customer.entity.Customer;
import com.subsflow.customer.entity.CustomerStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, String> {

    List<Customer> findAllByProductIdOrderByCreatedAtDesc(String productId);

    Optional<Customer> findByIdAndProductId(String id, String productId);

    Optional<Customer> findByIdAndTenantId(String id, String tenantId);

    boolean existsByProductIdAndExternalCustomerId(String productId, String externalCustomerId);

    boolean existsByProductIdAndExternalCustomerIdAndIdNot(String productId, String externalCustomerId, String id);

    @Query("SELECT c FROM Customer c WHERE c.product.id = :productId AND (" +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(c.externalCustomerId) LIKE LOWER(CONCAT('%', :query, '%')))" +
           "ORDER BY c.createdAt DESC")
    List<Customer> searchCustomers(@Param("productId") String productId, @Param("query") String query);

    long countByProductId(String productId);

    long countByProductIdAndStatus(String productId, CustomerStatus status);
}
