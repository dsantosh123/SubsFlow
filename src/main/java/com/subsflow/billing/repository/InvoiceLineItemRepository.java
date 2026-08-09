package com.subsflow.billing.repository;

import com.subsflow.billing.entity.InvoiceLineItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InvoiceLineItemRepository extends JpaRepository<InvoiceLineItem, String> {
}
