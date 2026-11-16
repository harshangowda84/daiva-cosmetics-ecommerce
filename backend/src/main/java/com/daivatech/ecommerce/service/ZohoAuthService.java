package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.config.ZohoProperties;
import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.Instant;

@Service
public class ZohoAuthService {

    private static final Logger log = LoggerFactory.getLogger(ZohoAuthService.class);

    private final ZohoProperties properties;
    private final RestClient restClient;

    private String cachedAccessToken;
    private Instant tokenExpiryTime = Instant.MIN;

    public ZohoAuthService(ZohoProperties properties, RestClient restClient) {
        this.properties = properties;
        this.restClient = restClient;
    }

    public synchronized String getAccessToken() {
        if (cachedAccessToken != null && Instant.now().isBefore(tokenExpiryTime)) {
            log.debug("Using cached Zoho access token");
            return cachedAccessToken;
        }

        log.info("Refreshing Zoho access token from {} ...", properties.getAccountsUrl());
        return refreshAccessToken();
    }

    public synchronized String refreshAccessToken() {
        try {
            String tokenUrl = properties.getAccountsUrl() + "/oauth/v2/token";

            JsonNode response = restClient.post()
                    .uri(tokenUrl + "?refresh_token=" + properties.getRefreshToken()
                            + "&client_id=" + properties.getClientId()
                            + "&client_secret=" + properties.getClientSecret()
                            + "&grant_type=refresh_token")
                    .retrieve()
                    .body(JsonNode.class);

            if (response != null && response.has("access_token")) {
                this.cachedAccessToken = response.get("access_token").asText();
                int expiresInSeconds = response.has("expires_in") ? response.get("expires_in").asInt() : 3600;

                // Expire 5 minutes early to avoid boundary race conditions
                this.tokenExpiryTime = Instant.now().plusSeconds(Math.max(60, expiresInSeconds - 300));
                log.info("Successfully refreshed Zoho access token. Valid for {} seconds.", expiresInSeconds);
                return this.cachedAccessToken;
            } else {
                String error = response != null && response.has("error") ? response.get("error").asText() : "Unknown error";
                throw new IllegalStateException("Failed to refresh Zoho token: " + error);
            }
        } catch (Exception e) {
            log.error("Error refreshing Zoho access token: {}", e.getMessage());
            throw new RuntimeException("Could not obtain Zoho access token: " + e.getMessage(), e);
        }
    }

    public boolean isConfigured() {
        return properties.getClientId() != null && !properties.getClientId().isBlank()
                && properties.getRefreshToken() != null && !properties.getRefreshToken().isBlank();
    }
}
