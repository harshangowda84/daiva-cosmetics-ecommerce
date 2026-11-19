package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.SiteSetting;
import com.daivatech.ecommerce.repository.SiteSettingRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class SettingsController {

    private final SiteSettingRepository siteSettingRepository;

    public SettingsController(SiteSettingRepository siteSettingRepository) {
        this.siteSettingRepository = siteSettingRepository;
    }

    @GetMapping("/settings")
    public ResponseEntity<Map<String, String>> getAllSettings() {
        List<SiteSetting> list = siteSettingRepository.findAll();
        Map<String, String> map = new HashMap<>();
        for (SiteSetting s : list) {
            map.put(s.getKey(), s.getValue());
        }
        return ResponseEntity.ok(map);
    }

    @PostMapping("/admin/settings")
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, String> settings) {
        if (settings == null || settings.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Settings payload cannot be empty"));
        }
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            if (entry.getKey() != null && !entry.getKey().isBlank()) {
                SiteSetting setting = siteSettingRepository.findById(entry.getKey())
                        .orElse(new SiteSetting(entry.getKey(), entry.getValue() != null ? entry.getValue() : ""));
                setting.setValue(entry.getValue() != null ? entry.getValue() : "");
                siteSettingRepository.save(setting);
            }
        }
        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Settings updated successfully",
                "count", settings.size()
        ));
    }
}
