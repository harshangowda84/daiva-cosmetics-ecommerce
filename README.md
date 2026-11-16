# AURA LUXE — Luxury Cosmetics E-Commerce POC
> **Enterprise Proof of Concept for Daiva Tech**  
> Focused Category: **Cosmetics** | Integrated with **Relational DB & Zoho Inventory/Books API**

---

## 1. Overview & Business Scope

This POC is a full-stack, enterprise-grade e-commerce application demonstrating a headless shopping experience for a single curated category: **Luxury & Organic Cosmetics**.

### Core Pillars:
1. **End-User Luxury Storefront**:
   - **Home Page**: Hero banner, clean beauty value propositions, curated category highlights, and featured cosmetic essentials.
   - **Global Search**: Debounced autocomplete search with instant thumbnail previews.
   - **Search Results Page**: Keyword search across name, brand, active ingredients, and descriptions.
   - **PLP (Product Listing Page)**: Category browsing with subcategory filters (*Serums, Lipsticks, Moisturizers, SPF, Cleansers*), skin type selector, price range sliders, and sorting.
   - **PDP (Product Detail Page)**: High-resolution image gallery, live stock availability, clinical actives, how-to-use instructions, and Zoho Item ID traceability.
   - **Shopping Bag & Slide-over Drawer**: Real-time free shipping threshold meter, quantity adjustments, and promo code support (`GLOW10`).
   - **Fast Checkout Page**: Customer delivery details, subtotal + shipping calculations, Cash on Delivery (COD) enabled for Phase 1, and Online Payment hook (Phase 2).
   - **Member Authentication & Profile**: Login, Registration, one-click test credentials, delivery address book, and complete order history.
2. **Administrator & Zoho Sync Console (`#admin`)**:
   - **Zoho Status Card**: Real-time OAuth 2.0 token health monitor and connection indicator.
   - **One-Click Zoho Catalog Pull**: Pulls item stocks and rates from Zoho Inventory and updates the local DB.
   - **Inventory Management Table**: Live stock adjuster with instant DB updates.
   - **Customer Orders & Zoho Sales Order Audit**: Logs every checkout order, verifies sync with Zoho, and allows manual retry if needed.
3. **Dual Data Layer Architecture**:
   - **Local Database (H2 / PostgreSQL)** acts as a lightning-fast catalog cache to prevent hitting Zoho's 100 req/min rate limit.
   - **Zoho Inventory / Books API v3** serves as the authoritative source of truth for inventory and accounting.

---

## 2. Technical Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + TypeScript | Lightning-fast HMR and modular component architecture |
| **Styling** | Tailwind CSS + Lucide React | Luxury aesthetic with Playfair Display & Plus Jakarta Sans |
| **Backend API** | Java 21 + Spring Boot 3.3.4 | Spring Data JPA, RestClient, Jackson, Validation |
| **Local Database** | H2 Relational Database (Persisted) | Zero-setup local DB with ready configuration for PostgreSQL |
| **ERP / Inventory** | Zoho Inventory / Books API v3 | OAuth 2.0 refresh token flow with automatic caching |

---

## 3. Reused Modules from MinisnMore

1. **Zoho OAuth2 Token Manager (`ZohoAuthService.java`)**:
   - Reused from `MinisnMore/zoho-demo-store`.
   - Handles automatic token retrieval, thread-safe memory caching, and proactive renewal 5 minutes before expiration.
2. **Zoho REST Client (`ZohoInventoryService.java`)**:
   - Reused and expanded from `MinisnMore/zoho-demo-store`.
   - Performs contact creation/lookup (`/contacts`), item stock queries (`/items`), and sales order generation (`/salesorders`).
3. **UI Patterns & Component Conventions**:
   - Adapted from `MinisnMore/Minisnmore-prod/frontend/src`: slide-over cart drawer, search autocomplete, responsive navbar, and order status indicators.

---

## 4. Quick Start Guide

### Prerequisites
- **Node.js**: v18+ (Node v22 installed)
- **Java**: JDK 21 (Temurin JDK 21 installed)
- **Maven**: 3.9+ (Installed)

### Option A: 1-Click Launch (Recommended)
Right-click and run in PowerShell:
```powershell
.\start-all.ps1
```
This automatically boots both the Spring Boot Backend (Port 8085) and the React Frontend (Port 5173).

---

### Option B: Manual Startup

#### 1. Start Spring Boot Backend:
```bash
cd backend
mvn spring-boot:run
```
- Server starts at: `http://localhost:8085`
- Database Console: `http://localhost:8085/h2-console` (JDBC URL: `jdbc:h2:file:./data/cosmeticsdb`, User: `sa`, Password: empty)

#### 2. Start Frontend Storefront:
```bash
cd frontend
npm run dev
```
- Storefront opens at: `http://localhost:5173`
- Admin & Zoho Hub: `http://localhost:5173#admin`

---

## 5. One-Click Test Accounts

| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@daivatech.com` | `admin123` | Full access to Storefront and Admin Zoho Console |
| **Customer** | `priya@demo.com` | `demo123` | Storefront, Cart, Checkout, and Profile Orders |

*(You can also use the One-Click Test buttons on the Sign In page!)*

---

## 6. Phase 2 Roadmap

- **Payment Gateway**: Razorpay integration for UPI, Credit/Debit cards, and Net Banking.
- **Order Tracking & Logistics**: Delivery partner webhook integration (e.g. Xpressbees/Shiprocket) for real-time tracking from dispatch to delivery.
- **Multi-Category Expansion**: Scaling the database schema to support multiple categories beyond Cosmetics.
