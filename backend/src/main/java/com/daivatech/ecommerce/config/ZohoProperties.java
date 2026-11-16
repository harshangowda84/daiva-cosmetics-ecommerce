package com.daivatech.ecommerce.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "zoho")
public class ZohoProperties {

    private String accountsUrl = "https://accounts.zoho.in";
    private String inventoryUrl = "https://www.zohoapis.in/inventory/v1";
    private String clientId;
    private String clientSecret;
    private String refreshToken;
    private String organizationId;

    public String getAccountsUrl() { return accountsUrl; }
    public void setAccountsUrl(String accountsUrl) { this.accountsUrl = accountsUrl; }

    public String getInventoryUrl() { return inventoryUrl; }
    public void setInventoryUrl(String inventoryUrl) { this.inventoryUrl = inventoryUrl; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }

    public String getOrganizationId() { return organizationId; }
    public void setOrganizationId(String organizationId) { this.organizationId = organizationId; }
}
