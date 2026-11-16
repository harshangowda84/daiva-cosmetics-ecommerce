package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.service.TelegramStorageService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/images")
public class TelegramImageController {

    private final TelegramStorageService telegramStorageService;
    private static final String FALLBACK_IMAGE = "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80";

    public TelegramImageController(TelegramStorageService telegramStorageService) {
        this.telegramStorageService = telegramStorageService;
    }

    /**
     * Resolves a Telegram fileId and redirects (302 Found) to Telegram's fast global CDN URL.
     * Caching headers instruct browsers and edge caches to cache the redirect for 1 hour.
     */
    @GetMapping("/telegram/{fileId}")
    public ResponseEntity<Void> getTelegramImage(@PathVariable String fileId) {
        String directUrl = telegramStorageService.resolveDownloadUrl(fileId);
        if (directUrl == null) {
            return ResponseEntity.status(HttpStatus.FOUND)
                    .location(URI.create(FALLBACK_IMAGE))
                    .build();
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(directUrl))
                .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600")
                .build();
    }
}
