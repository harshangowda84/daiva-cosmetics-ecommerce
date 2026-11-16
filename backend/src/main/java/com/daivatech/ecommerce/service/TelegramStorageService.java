package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.config.TelegramProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TelegramStorageService {

    private static final Logger log = LoggerFactory.getLogger(TelegramStorageService.class);

    private final TelegramProperties properties;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    // In-memory cache for resolved Telegram download URLs (fileId -> CachedUrl)
    private final Map<String, CachedUrl> urlCache = new ConcurrentHashMap<>();
    private static final long CACHE_TTL_MS = 60 * 60 * 1000L; // 1 hour

    public TelegramStorageService(TelegramProperties properties, RestClient restClient, ObjectMapper objectMapper) {
        this.properties = properties;
        this.restClient = restClient;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return properties.isConfigured();
    }

    /**
     * Upload an image buffer to Telegram private storage channel and return its permanent file_id.
     */
    public String uploadImage(byte[] imageBytes, String filename) throws Exception {
        if (!properties.isConfigured()) {
            throw new IllegalStateException("Telegram credentials (botToken or chatId) are not configured.");
        }

        String url = "https://api.telegram.org/bot" + properties.getBotToken().trim() + "/sendPhoto";

        final String resolvedFilename = (filename != null && !filename.isBlank()) ? filename : "image.jpg";
        ByteArrayResource resource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return resolvedFilename;
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("chat_id", properties.getChatId().trim());
        body.add("photo", resource);

        String responseBody = restClient.post()
                .uri(url)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(body)
                .retrieve()
                .body(String.class);

        JsonNode root = objectMapper.readTree(responseBody);
        if (!root.path("ok").asBoolean(false)) {
            String desc = root.path("description").asText("Unknown error");
            throw new RuntimeException("Telegram sendPhoto failed: " + desc);
        }

        JsonNode photoArray = root.path("result").path("photo");
        if (photoArray.isEmpty()) {
            throw new RuntimeException("Telegram did not return photo data in response.");
        }

        // The highest resolution photo is the last item in the array
        String fileId = photoArray.get(photoArray.size() - 1).path("file_id").asText();
        log.info("Successfully uploaded image to Telegram. File ID: {}", fileId);
        return fileId;
    }

    /**
     * Resolves a Telegram file_id to its direct download CDN URL with in-memory caching.
     */
    public String resolveDownloadUrl(String fileId) {
        if (fileId == null || fileId.isBlank()) {
            return null;
        }

        CachedUrl cached = urlCache.get(fileId);
        if (cached != null && cached.expiresAt > System.currentTimeMillis()) {
            return cached.url;
        }

        if (!properties.isConfigured()) {
            return null;
        }

        try {
            String url = "https://api.telegram.org/bot" + properties.getBotToken().trim() + "/getFile?file_id=" + fileId;
            String responseBody = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(responseBody);
            if (!root.path("ok").asBoolean(false)) {
                log.warn("Telegram getFile failed for {}: {}", fileId, root.path("description").asText());
                return null;
            }

            String filePath = root.path("result").path("file_path").asText();
            if (filePath == null || filePath.isBlank()) {
                return null;
            }

            String directUrl = "https://api.telegram.org/file/bot" + properties.getBotToken().trim() + "/" + filePath;
            urlCache.put(fileId, new CachedUrl(directUrl, System.currentTimeMillis() + CACHE_TTL_MS));
            return directUrl;
        } catch (Exception ex) {
            log.error("Failed to resolve Telegram fileId {}: {}", fileId, ex.getMessage());
            return null;
        }
    }

    private static class CachedUrl {
        final String url;
        final long expiresAt;

        CachedUrl(String url, long expiresAt) {
            this.url = url;
            this.expiresAt = expiresAt;
        }
    }
}
