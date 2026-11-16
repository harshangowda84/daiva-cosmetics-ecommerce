package com.daivatech.ecommerce.controller;

import com.daivatech.ecommerce.entity.UserAddress;
import com.daivatech.ecommerce.service.UserAddressService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/{userId}/addresses")
@CrossOrigin(origins = "*")
public class AddressController {

    private final UserAddressService addressService;

    public AddressController(UserAddressService addressService) {
        this.addressService = addressService;
    }

    @GetMapping
    public ResponseEntity<List<UserAddress>> getAddresses(@PathVariable Long userId) {
        return ResponseEntity.ok(addressService.getAddressesByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<?> createAddress(@PathVariable Long userId, @RequestBody UserAddress address) {
        try {
            UserAddress created = addressService.createAddress(userId, address);
            return ResponseEntity.ok(created);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<?> updateAddress(@PathVariable Long userId,
                                           @PathVariable Long addressId,
                                           @RequestBody UserAddress address) {
        try {
            UserAddress updated = addressService.updateAddress(userId, addressId, address);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<?> deleteAddress(@PathVariable Long userId, @PathVariable Long addressId) {
        try {
            addressService.deleteAddress(userId, addressId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Address deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @RequestMapping(value = "/{addressId}/default", method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> setDefaultAddress(@PathVariable Long userId, @PathVariable Long addressId) {
        try {
            UserAddress updated = addressService.setDefaultAddress(userId, addressId);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
