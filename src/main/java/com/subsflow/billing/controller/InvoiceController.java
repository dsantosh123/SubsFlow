package com.subsflow.billing.controller;

import com.subsflow.billing.entity.Invoice;
import com.subsflow.billing.entity.InvoiceLineItem;
import com.subsflow.billing.repository.InvoiceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/invoices")
public class InvoiceController {

    private final InvoiceRepository invoiceRepository;

    public InvoiceController(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<InvoiceSummaryResponse>> listInvoices() {
        List<InvoiceSummaryResponse> invoices = invoiceRepository.findAll().stream()
                .map(InvoiceSummaryResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(invoices);
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> getInvoice(@PathVariable("id") String id) {
        return invoiceRepository.findById(id)
                .map(inv -> ResponseEntity.ok(InvoiceDetailResponse.from(inv)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    public static class InvoiceSummaryResponse {
        protected String id;
        protected String subscriptionId;
        protected String status;
        protected BigDecimal amount;
        protected String dueDate;
        protected String createdAt;

        public static InvoiceSummaryResponse from(Invoice invoice) {
            InvoiceSummaryResponse dto = new InvoiceSummaryResponse();
            dto.id = invoice.getId();
            dto.subscriptionId = invoice.getSubscription() != null ? invoice.getSubscription().getId() : null;
            dto.status = invoice.getStatus() != null ? invoice.getStatus().name() : null;
            dto.amount = invoice.getAmount();
            dto.dueDate = invoice.getDueDate() != null ? invoice.getDueDate().toString() : null;
            dto.createdAt = invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : null;
            return dto;
        }

        public String getId() { return id; }
        public String getSubscriptionId() { return subscriptionId; }
        public String getStatus() { return status; }
        public BigDecimal getAmount() { return amount; }
        public String getDueDate() { return dueDate; }
        public String getCreatedAt() { return createdAt; }
    }

    public static class InvoiceDetailResponse extends InvoiceSummaryResponse {
        private List<LineItemResponse> lineItems;

        public static InvoiceDetailResponse from(Invoice invoice) {
            InvoiceDetailResponse dto = new InvoiceDetailResponse();
            dto.id = invoice.getId();
            dto.subscriptionId = invoice.getSubscription() != null ? invoice.getSubscription().getId() : null;
            dto.status = invoice.getStatus() != null ? invoice.getStatus().name() : null;
            dto.amount = invoice.getAmount();
            dto.dueDate = invoice.getDueDate() != null ? invoice.getDueDate().toString() : null;
            dto.createdAt = invoice.getCreatedAt() != null ? invoice.getCreatedAt().toString() : null;
            if (invoice.getLineItems() != null) {
                dto.lineItems = invoice.getLineItems().stream()
                        .map(LineItemResponse::from)
                        .collect(Collectors.toList());
            }
            return dto;
        }

        public List<LineItemResponse> getLineItems() { return lineItems; }
    }

    public static class LineItemResponse {
        private String id;
        private String type;
        private BigDecimal amount;
        private String description;
        private String planId;

        public static LineItemResponse from(InvoiceLineItem item) {
            LineItemResponse dto = new LineItemResponse();
            dto.id = item.getId();
            dto.type = item.getType() != null ? item.getType().name() : null;
            dto.amount = item.getAmount();
            dto.description = item.getDescription();
            dto.planId = item.getPlan() != null ? item.getPlan().getId() : null;
            return dto;
        }

        public String getId() { return id; }
        public String getType() { return type; }
        public BigDecimal getAmount() { return amount; }
        public String getDescription() { return description; }
        public String getPlanId() { return planId; }
    }
}
