# Creperie Kinder

## Overview
A modern, elegant static website for "Creperie Kinder" - a crepe restaurant featuring Sweet Paris-inspired design with:
- Customer-facing menu with tab navigation and shopping cart
- Order placement with Cash on Delivery (COD)
- Admin panel for order management
- Responsive design with RTL (right-to-left) support for Arabic
- Modern orange color scheme with professional Shopify-like design

## Tech Stack
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Fonts**: Playfair Display (serif headings), Inter (body text)
- **Data Storage**: Browser localStorage (client-side only)
- **Server**: Python HTTP server for static file serving
- **Language**: Arabic UI with English code

## Project Structure
```
.
├── index.html              # Main landing page with tabbed menu
├── about.html              # About us page
├── contact.html            # Contact form page
├── admin.html              # Admin login and professional dashboard
├── style.css               # Main website styles with orange theme
├── admin-dashboard.css     # Dashboard-specific styles
├── script.js               # Client-side logic (menu, cart, orders)
├── admin-dashboard.js      # Dashboard logic (charts, stats, order management)
├── server.py               # Python HTTP server (serves on 0.0.0.0:5000)
├── images/                 # SVG placeholder images
└── replit.md               # This file
```

## Design Features

### Color Scheme (Shopify-inspired Professional)
- Primary Orange: `#FF6B35` (warm, appetizing coral-orange)
- Secondary Yellow: `#FFC857` (golden yellow for accents)
- Warm Orange: `#FF8C42` (gradient complement)
- Light Peach: `#FFE5D9` (soft backgrounds)
- Text Primary: `#1A1A1A` (dark text)
- Text Secondary: `#666666` (muted text)
- Background: `#FAFAFA` (off-white)
- Surface: `#FFFFFF` (pure white for cards)

### Typography
- Headings: Playfair Display (elegant serif)
- Body: Inter (modern sans-serif)

### Layout
- Sticky header with hamburger menu, brand, and cart icons
- Hero section with background image and "Menu" overlay
- Tab navigation for categories (Sweet, Savory, Kids, Drinks)
- 2-column grid layout for menu items
- Fixed "ORDER NOW" button at bottom (mobile)
- Sliding cart sidebar from right

## Features

### Customer Features
- Browse menu items by category with tab navigation
- Clean 2-column grid with product images
- Add items to shopping cart with one tap
- Sliding cart panel from right side
- Adjust quantities or remove items
- Place orders with name, phone, and address (COD payment)
- Orders stored in localStorage

### Admin Features
- **Login System**: username `admin`, password `kinder123`
- **Professional Dashboard**:
  - Overview with 4 stat cards: Today's Revenue, Total Orders, Pending Orders, Completed Today
  - Sales trend chart (7-day line chart)
  - Order status breakdown (pie chart)
  - Recent orders table with quick view
  - Best sellers list with product rankings
- **Orders Management**:
  - View all orders in detailed table
  - Search by customer name or order ID
  - Filter by status (All, Pending, In Progress, Delivered)
  - Quick status updates via dropdown
  - Export orders to CSV
- **Menu Management**: View all menu items with categories
- **Analytics & Reports**: Revenue metrics, order statistics, popular items analysis
- **Responsive Design**: Mobile-friendly sidebar navigation

## Menu Categories
- **Sweet Crêpes** (كريب حلو): Dessert crepes with Nutella, fruits, etc.
- **Savory Crêpes** (كريب مالح): Savory crepes with ham, cheese, chicken, etc.
- **Kids Crêpes** (كريب الأطفال): Simple crepes for children
- **Drinks** (مشروبات): Hot chocolate, juices, etc.

## Data Storage
All data is stored in browser localStorage:
- `kc_menu`: Product menu items with categories
- `kc_cart`: Customer shopping cart
- `kc_orders`: All placed orders
- `kc_admin`: Admin login session

## Development
The site runs on Python's built-in HTTP server:
- Port: 5000
- Host: 0.0.0.0 (accessible externally)
- Cache-Control headers disabled for development
- Socket reuse enabled for quick restarts

## Deployment
Configured to deploy as an autoscale static website on Replit.

## Recent Changes
- **2025-11-17**: Added Google Firebase Authentication
  - Implemented secure Google sign-in/sign-out functionality
  - Added login button to all pages (next to EN language button)
  - Created beautiful login page matching website theme (brown/cream colors)
  - Firebase credentials loaded securely from server environment variables
  - Proper async initialization with error handling
  - Auth state management: shows login icon when logged out, user profile icon when logged in
  - Click profile icon when logged in to sign out
  - All pages include auth.js module for authentication UI
  - Firebase config endpoint: /api/firebase-config
  - Required secrets: FIREBASE_API_KEY, FIREBASE_AUTH_DOMAIN, FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, FIREBASE_MESSAGING_SENDER_ID, FIREBASE_APP_ID
  
- **2025-11-06**: Upgraded social media icons
  - Replaced emoji icons with professional SVG icons
  - Added Instagram, Facebook, Twitter, TikTok, and WhatsApp icons
  - Implemented proper href links for all social platforms
  - Added aria-label attributes for accessibility
  - Applied consistent styling across all pages (index, menu, about, contact, faq, feedback)
  - Icons appear in both footer and navigation menu sidebar
  
- **2025-11-05 (Latest v2)**: Built professional admin dashboard
  - Created comprehensive dashboard with sidebar navigation
  - Implemented 4 key stat cards (Revenue, Orders, Pending, Completed)
  - Added canvas-based charts: sales trend (7-day), order status (pie chart)
  - Built enhanced orders management with search, filters, and CSV export
  - Created menu management and analytics sections
  - Designed with professional orange theme matching main website
  - Fully responsive with mobile sidebar toggle
  - Fixed critical event handling bugs in navigation and filters
  - Architect-reviewed and approved
  
- **2025-11-05 (v1)**: Professional Shopify-inspired redesign
  - Transformed color scheme from turquoise/gray to warm orange/coral palette
  - Updated primary color to appetizing orange (#FF6B35)
  - Changed fonts to Playfair Display (serif) and Inter (sans-serif)
  - Modernized all components with cleaner spacing and shadows
  - Updated buttons to rounded pill shapes with professional hover effects
  - Enhanced card designs with subtle borders and better shadows
  - Improved typography hierarchy and readability
  - Updated FAQ and feedback sections with new color variables
  - Created cohesive design system with professional Shopify-like aesthetic
  
- **2025-11-04**: Complete redesign to Sweet Paris aesthetic
  - Changed color scheme from red/brown to turquoise/gray
  - Added Pacifico script font for headings
  - Implemented tab-based navigation system
  - Created 2-column grid layout for menu items
  - Added sliding cart sidebar
  - Fixed "ORDER NOW" button for mobile
  - Updated all HTML pages with new header/footer design
  - Reorganized menu items into proper categories
  
- **2025-11-04 (Initial)**: Initial setup for Replit environment
  - Added Python HTTP server for static file serving
  - Configured workflow for port 5000
  - Added .gitignore for Python
  - Created SVG placeholder images
