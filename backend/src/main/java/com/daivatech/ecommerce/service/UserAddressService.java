package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.entity.User;
import com.daivatech.ecommerce.entity.UserAddress;
import com.daivatech.ecommerce.repository.UserAddressRepository;
import com.daivatech.ecommerce.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class UserAddressService {

    private final UserAddressRepository addressRepository;
    private final UserRepository userRepository;

    public UserAddressService(UserAddressRepository addressRepository, UserRepository userRepository) {
        this.addressRepository = addressRepository;
        this.userRepository = userRepository;
    }

    public List<UserAddress> getAddressesByUserId(Long userId) {
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
    }

    public Optional<UserAddress> getDefaultAddress(Long userId) {
        return addressRepository.findByUserIdAndIsDefaultTrue(userId);
    }

    @Transactional
    public UserAddress createAddress(Long userId, UserAddress address) {
        address.setUserId(userId);
        address.setCreatedAt(LocalDateTime.now());
        address.setUpdatedAt(LocalDateTime.now());

        List<UserAddress> existing = addressRepository.findByUserId(userId);
        // If this is the user's first address, or isDefault was requested true:
        if (existing.isEmpty() || Boolean.TRUE.equals(address.getIsDefault())) {
            address.setIsDefault(true);
            // clear default from all other addresses of this user
            for (UserAddress a : existing) {
                if (Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            }
        } else {
            address.setIsDefault(false);
        }

        UserAddress saved = addressRepository.save(address);

        // If saved as default, sync to User table
        if (Boolean.TRUE.equals(saved.getIsDefault())) {
            syncDefaultAddressToUser(userId, saved);
        }

        return saved;
    }

    @Transactional
    public UserAddress updateAddress(Long userId, Long addressId, UserAddress updated) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or does not belong to user"));

        if (updated.getAddressType() != null) address.setAddressType(updated.getAddressType());
        if (updated.getRecipientName() != null) address.setRecipientName(updated.getRecipientName());
        if (updated.getPhone() != null) address.setPhone(updated.getPhone());
        if (updated.getAddressLine1() != null) address.setAddressLine1(updated.getAddressLine1());
        if (updated.getAddressLine2() != null) address.setAddressLine2(updated.getAddressLine2());
        if (updated.getLandmark() != null) address.setLandmark(updated.getLandmark());
        if (updated.getCity() != null) address.setCity(updated.getCity());
        if (updated.getState() != null) address.setState(updated.getState());
        if (updated.getPincode() != null) address.setPincode(updated.getPincode());
        if (updated.getCountry() != null) address.setCountry(updated.getCountry());
        address.setUpdatedAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(updated.getIsDefault()) && !Boolean.TRUE.equals(address.getIsDefault())) {
            // Demote other defaults
            List<UserAddress> existing = addressRepository.findByUserId(userId);
            for (UserAddress a : existing) {
                if (!a.getId().equals(addressId) && Boolean.TRUE.equals(a.getIsDefault())) {
                    a.setIsDefault(false);
                    addressRepository.save(a);
                }
            }
            address.setIsDefault(true);
        }

        UserAddress saved = addressRepository.save(address);

        if (Boolean.TRUE.equals(saved.getIsDefault())) {
            syncDefaultAddressToUser(userId, saved);
        }

        return saved;
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or does not belong to user"));

        boolean wasDefault = Boolean.TRUE.equals(address.getIsDefault());
        addressRepository.delete(address);

        if (wasDefault) {
            List<UserAddress> remaining = addressRepository.findByUserId(userId);
            if (!remaining.isEmpty()) {
                UserAddress newDefault = remaining.get(0);
                newDefault.setIsDefault(true);
                addressRepository.save(newDefault);
                syncDefaultAddressToUser(userId, newDefault);
            } else {
                userRepository.findById(userId).ifPresent(u -> {
                    u.setAddressLine1(null);
                    u.setAddressLine2(null);
                    u.setCity(null);
                    u.setState(null);
                    u.setPincode(null);
                    userRepository.save(u);
                });
            }
        }
    }

    @Transactional
    public UserAddress setDefaultAddress(Long userId, Long addressId) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Address not found or does not belong to user"));

        List<UserAddress> all = addressRepository.findByUserId(userId);
        for (UserAddress a : all) {
            if (a.getId().equals(addressId)) {
                a.setIsDefault(true);
            } else if (Boolean.TRUE.equals(a.getIsDefault())) {
                a.setIsDefault(false);
            }
            addressRepository.save(a);
        }

        syncDefaultAddressToUser(userId, address);
        address.setIsDefault(true);
        return address;
    }

    private void syncDefaultAddressToUser(Long userId, UserAddress address) {
        userRepository.findById(userId).ifPresent(u -> {
            u.setAddressLine1(address.getAddressLine1());
            u.setAddressLine2(address.getAddressLine2());
            u.setCity(address.getCity());
            u.setState(address.getState());
            u.setPincode(address.getPincode());
            if (address.getPhone() != null && (u.getPhone() == null || u.getPhone().isBlank())) {
                u.setPhone(address.getPhone());
            }
            userRepository.save(u);
        });
    }
}
