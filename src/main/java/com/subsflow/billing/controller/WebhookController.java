package com.subsflow.billing.controller;

import com.subsflow.billing.service.WebhookProcessingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/webhooks")
public class WebhookController {

    private final WebhookProcessingService webhookProcessingService;

    public WebhookController(WebhookProcessingService webhookProcessingService) {
        this.webhookProcessingService = webhookProcessingService;
    }

    @PostMapping("/{provider}")
    public ResponseEntity<?> handleProviderWebhook(@PathVariable("provider") String provider,
                                                   @RequestHeader(value = "X-Provider-Signature", required = false) String providerSig,
                                                   @RequestHeader(value = "Stripe-Signature", required = false) String stripeSig,
                                                   @RequestBody String payload) {
        String signature = providerSig != null ? providerSig : (stripeSig != null ? stripeSig : "sb_sig_default");

        try {
            boolean handled = webhookProcessingService.processWebhook(provider, payload, signature);
            return ResponseEntity.ok(Map.of("received", handled));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
