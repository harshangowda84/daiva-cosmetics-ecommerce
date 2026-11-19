package com.daivatech.ecommerce.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "site_settings")
public class SiteSetting {

    @Id
    @Column(name = "setting_key", nullable = false, unique = true, length = 120)
    private String key;

    @Lob
    @Column(name = "setting_value", columnDefinition = "TEXT")
    private String value;

    public SiteSetting() {}

    public SiteSetting(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }
}
