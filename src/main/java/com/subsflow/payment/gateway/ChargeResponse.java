package com.subsflow.payment.gateway;

public class ChargeResponse {
    private final boolean success;
    private final String gatewayReference;
    private final String errorMessage;

    public ChargeResponse(boolean success, String gatewayReference, String errorMessage) {
        this.success = success;
        this.gatewayReference = gatewayReference;
        this.errorMessage = errorMessage;
    }

    public boolean isSuccess() {
        return success;
    }

    public String getGatewayReference() {
        return gatewayReference;
    }

    public String getErrorMessage() {
        return errorMessage;
    }
}
