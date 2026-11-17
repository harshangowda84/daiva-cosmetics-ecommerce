package com.daivatech.ecommerce.service;

import com.daivatech.ecommerce.dto.AuthDtos;
import com.daivatech.ecommerce.entity.User;
import com.daivatech.ecommerce.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("User with email " + request.getEmail() + " already exists");
        }

        User user = new User(
                request.getFullName(),
                request.getEmail(),
                request.getPassword(), // For POC direct stored
                request.getPhone()
        );
        user.setRole("CUSTOMER");
        User saved = userRepository.save(user);

        String mockToken = "jwt_" + UUID.randomUUID().toString().replace("-", "");
        return new AuthDtos.AuthResponse(
                saved.getId(),
                saved.getFullName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getAddressLine1(),
                saved.getAddressLine2(),
                saved.getCity(),
                saved.getState(),
                saved.getPincode(),
                saved.getCountry(),
                saved.getRole(),
                mockToken
        );
    }

    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        Optional<User> userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty() || !userOpt.get().getPassword().equals(request.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        User user = userOpt.get();
        String mockToken = "jwt_" + UUID.randomUUID().toString().replace("-", "");
        return new AuthDtos.AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddressLine1(),
                user.getAddressLine2(),
                user.getCity(),
                user.getState(),
                user.getPincode(),
                user.getCountry(),
                user.getRole(),
                mockToken
        );
    }

    public AuthDtos.AuthResponse googleAuth(AuthDtos.GoogleAuthRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email is required for Google Sign-In");
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().trim().toLowerCase());
        User user;
        if (userOpt.isPresent()) {
            user = userOpt.get();
            if (request.getFullName() != null && !request.getFullName().isBlank()) {
                user.setFullName(request.getFullName().trim());
            }
            if (request.getProfilePictureUrl() != null && !request.getProfilePictureUrl().isBlank()) {
                user.setProfilePictureUrl(request.getProfilePictureUrl());
            }
            if (request.getGoogleSub() != null) {
                user.setGoogleSub(request.getGoogleSub());
            }
            user.setAuthProvider("GOOGLE");
            user = userRepository.save(user);
        } else {
            String name = (request.getFullName() != null && !request.getFullName().isBlank())
                    ? request.getFullName().trim()
                    : request.getEmail().split("@")[0];
            user = new User(
                    name,
                    request.getEmail().trim().toLowerCase(),
                    "google_oauth_" + UUID.randomUUID().toString(),
                    ""
            );
            user.setRole("CUSTOMER");
            user.setAuthProvider("GOOGLE");
            user.setGoogleSub(request.getGoogleSub());
            user.setProfilePictureUrl(request.getProfilePictureUrl());
            user = userRepository.save(user);
        }

        String mockToken = "jwt_google_" + UUID.randomUUID().toString().replace("-", "");
        return new AuthDtos.AuthResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAddressLine1(),
                user.getAddressLine2(),
                user.getCity(),
                user.getState(),
                user.getPincode(),
                user.getCountry(),
                user.getRole(),
                mockToken
        );
    }

    public User getProfile(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
    }

    public User updateProfile(Long id, User updatedData) {
        User user = getProfile(id);
        if (updatedData.getFullName() != null) user.setFullName(updatedData.getFullName());
        if (updatedData.getPhone() != null) user.setPhone(updatedData.getPhone());
        if (updatedData.getAddressLine1() != null) user.setAddressLine1(updatedData.getAddressLine1());
        if (updatedData.getAddressLine2() != null) user.setAddressLine2(updatedData.getAddressLine2());
        if (updatedData.getCity() != null) user.setCity(updatedData.getCity());
        if (updatedData.getState() != null) user.setState(updatedData.getState());
        if (updatedData.getPincode() != null) user.setPincode(updatedData.getPincode());
        return userRepository.save(user);
    }
}
