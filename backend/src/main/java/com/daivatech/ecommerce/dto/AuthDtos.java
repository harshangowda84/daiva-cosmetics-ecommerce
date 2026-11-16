package com.daivatech.ecommerce.dto;

public class AuthDtos {

    public static class RegisterRequest {
        private String fullName;
        private String email;
        private String password;
        private String phone;

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
    }

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthResponse {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String addressLine1;
        private String addressLine2;
        private String city;
        private String state;
        private String pincode;
        private String country;
        private String role;
        private String token;

        public AuthResponse(Long id, String fullName, String email, String phone, String role, String token) {
            this.id = id;
            this.fullName = fullName;
            this.email = email;
            this.phone = phone;
            this.role = role;
            this.token = token;
        }

        public AuthResponse(Long id, String fullName, String email, String phone,
                            String addressLine1, String addressLine2, String city, String state, String pincode, String country,
                            String role, String token) {
            this.id = id;
            this.fullName = fullName;
            this.email = email;
            this.phone = phone;
            this.addressLine1 = addressLine1;
            this.addressLine2 = addressLine2;
            this.city = city;
            this.state = state;
            this.pincode = pincode;
            this.country = country;
            this.role = role;
            this.token = token;
        }

        public Long getId() { return id; }
        public String getFullName() { return fullName; }
        public String getEmail() { return email; }
        public String getPhone() { return phone; }
        public String getAddressLine1() { return addressLine1; }
        public String getAddressLine2() { return addressLine2; }
        public String getCity() { return city; }
        public String getState() { return state; }
        public String getPincode() { return pincode; }
        public String getCountry() { return country; }
        public String getRole() { return role; }
        public String getToken() { return token; }
    }
}
