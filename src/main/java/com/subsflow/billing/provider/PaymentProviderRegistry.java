package com.subsflow.billing.provider;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class PaymentProviderRegistry {

    private final Map<String, PaymentProvider> providers = new HashMap<>();

    public PaymentProviderRegistry(List<PaymentProvider> providerList) {
        for (PaymentProvider p : providerList) {
            providers.put(p.getProviderName().toUpperCase(), p);
        }
    }

    public PaymentProvider getProvider(String providerName) {
        if (providerName == null) {
            return providers.get("SANDBOX");
        }
        PaymentProvider provider = providers.get(providerName.trim().toUpperCase());
        if (provider == null) {
            return providers.get("SANDBOX");
        }
        return provider;
    }
}
