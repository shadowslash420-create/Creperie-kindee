# Creperie Kinder

## Overview
Creperie Kinder is a modern, elegant cloud-powered website for a crepe restaurant, inspired by Sweet Paris design. Its primary purpose is to provide a seamless online experience for customers to browse menus and place orders, while offering robust order and menu management capabilities for administrators.

**Key Capabilities:**
- Customer-facing menu with category-based navigation and an interactive shopping cart.
- Order placement with Cash on Delivery (COD) as the payment method.
- Comprehensive admin panel for efficient order and menu management.
- Real-time data synchronization powered by Firebase Firestore.
- Product image hosting via ImgBB.
- Responsive design with full Right-to-Left (RTL) support for Arabic.
- Professional Shopify-like aesthetic with a warm orange color scheme.

**Business Vision:** To provide Creperie Kinder with a scalable, modern online presence that enhances customer experience, streamlines operations, and supports growth in the food service industry.

## User Preferences
- The agent should prioritize iterative development and clear communication.
- Before making significant changes or architectural decisions, the agent must ask for approval.
- The agent should provide detailed explanations for complex solutions.
- All code should be clean, well-commented, and follow best practices.
- Do not make changes to the `replit.md` file without explicit instructions.
- All UI elements should be in Arabic, while code comments and variables should be in English.

## System Architecture

### UI/UX Decisions
- **Color Scheme:** Professional, Shopify-inspired palette featuring Primary Orange (`#FF6B35`), Secondary Yellow (`#FFC857`), Warm Orange (`#FF8C42`), Light Peach (`#FFE5D9`), with dark text (`#1A1A1A`, `#666666`) on off-white (`#FAFAFA`) and pure white (`#FFFFFF`) backgrounds.
- **Typography:** Playfair Display (elegant serif) for headings and Inter (modern sans-serif) for body text.
- **Layout:** Sticky header with hamburger menu, brand logo, and cart icon. Hero section with background imagery. Tab-based navigation for menu categories. 2-column grid for menu items. Fixed "ORDER NOW" button (mobile). Sliding cart sidebar.
- **Admin Dashboard:** Professional design with four key stat cards, sales trend chart (7-day line), order status pie chart, recent orders table, and best sellers list. Responsive sidebar navigation.

### Technical Implementations
- **Frontend:** Pure HTML, CSS, and JavaScript, eschewing frameworks for performance and simplicity.
- **Backend (Cloud):** Firebase Firestore serves as the primary NoSQL cloud database for all dynamic data.
- **Image Management:** ImgBB for free cloud image hosting, with image URLs stored in Firestore. Secure server-side image upload via API to protect API keys.
- **Authentication:** Firebase Authentication with Google Sign-In for secure admin access.
- **Development Environment:** Python HTTP server (`server.py`) for local development, serving static files and proxying API requests.
- **Production Environment:** Optimized for Vercel deployment, utilizing static file serving from `public/` and Node.js serverless functions in `api/`.
- **RTL Support:** Full right-to-left language support implemented for Arabic UI.

### Feature Specifications
- **Customer Features:**
    - Browse menu by category (Sweet, Savory, Kids, Drinks).
    - Add items to cart, adjust quantities, and remove items.
    - Place orders with customer details (name, phone, address) and COD payment.
    - Shopping cart data temporarily stored in browser's `localStorage`.
- **Admin Features:**
    - Secure login (username `admin`, password `kinder123`).
    - **Orders Management:** View, search, filter (by status), update status, and export orders to CSV.
    - **Menu Management:** Full CRUD (Create, Read, Update, Delete) operations for menu items, including image uploads and dynamic category association.
    - **Category Management:** Dynamic system to add and delete menu categories, with real-time synchronization.
    - **Analytics & Reports:** Dashboard displays revenue metrics, order statistics, and popular items.

### System Design Choices
- **Dual-Environment Setup:** Seamless operation in both Replit (Python server) and Vercel (serverless functions) environments with identical API endpoints.
- **Data Storage:**
    - **Firebase Firestore:** `menu`, `orders`, `customers`, and `categories` collections for real-time, persistent cloud storage.
    - **Local Storage:** `kc_cart`, `kc_menu`, `kc_admin` for client-side caching and temporary data.
- **Scalability:** Designed with Firebase and Vercel serverless functions to handle varying loads efficiently.
- **Security:** Firebase security rules for database and storage access control, server-side image upload to protect API keys, and secure environment variable management for API keys.

## External Dependencies
- **Firebase Firestore:** Cloud NoSQL database for real-time data storage and synchronization.
- **Firebase Authentication:** For secure user (admin) login and management.
- **Google Sign-In:** Integrated with Firebase Authentication for user login.
- **ImgBB:** Third-party service for free cloud hosting of product images.
- **Vercel:** Deployment platform for hosting the application and serverless functions.
- **Playfair Display (Google Fonts):** For display headings.
- **Inter (Google Fonts):** For body text.