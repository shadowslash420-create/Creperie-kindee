# Creperie Kinder

## Overview
A modern, elegant cloud-powered website for "Creperie Kinder" - a crepe restaurant featuring Sweet Paris-inspired design with:
- Customer-facing menu with tab navigation and shopping cart
- Order placement with Cash on Delivery (COD)
- Admin panel for order management
- **Firebase Firestore integration** for real-time data synchronization
- **ImgBB cloud image hosting** for product image management
- Responsive design with RTL (right-to-left) support for Arabic
- Modern orange color scheme with professional Shopify-like design

## Tech Stack
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Backend**: Firebase Firestore (NoSQL cloud database)
- **Image Hosting**: ImgBB (free cloud image storage)
- **Authentication**: Firebase Authentication + Google Sign-In
- **Fonts**: Playfair Display (serif headings), Inter (body text)
- **Server**: Python HTTP server for static file serving
- **Language**: Arabic UI with English code

## Project Structure (Vercel-Ready)
```
.
├── public/                      # Static files served by Vercel
│   ├── *.html                   # All HTML pages (index, menu, admin, etc.)
│   ├── *.css                    # Stylesheets (style.css, admin-dashboard.css)
│   ├── *.js                     # Frontend JavaScript modules
│   ├── *.md, *.txt, *.rules    # Documentation and Firebase rules
│   └── attached_assets/         # Images and media files
├── api/                         # Vercel Serverless Functions (Node.js)
│   ├── firebase-config.js       # Returns Firebase config from environment
│   └── upload-image.js          # Proxies image uploads to ImgBB
├── server.py                    # Python HTTP server (Replit development only)
├── vercel.json                  # Vercel deployment configuration
├── package.json                 # NPM dependencies and deployment scripts
├── VERCEL_DEPLOYMENT.md         # Complete Vercel deployment guide
└── replit.md                    # This file
```

### Dual-Environment Setup
- **Replit Development**: Uses `server.py` (Python) serving from `public/`
- **Vercel Production**: Uses serverless functions in `api/` with static files from `public/`
- API endpoints work identically in both environments

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
- **Menu Management**: 
  - View all menu items with categories
  - Add/Edit/Delete menu items with modal interface
  - Upload product images to Firebase Storage
  - **Category Management**: Dynamic category system with add/delete capabilities
- **Analytics & Reports**: Revenue metrics, order statistics, popular items analysis
- **Responsive Design**: Mobile-friendly sidebar navigation

## Menu Categories
- **Sweet Crêpes** (كريب حلو): Dessert crepes with Nutella, fruits, etc.
- **Savory Crêpes** (كريب مالح): Savory crepes with ham, cheese, chicken, etc.
- **Kids Crêpes** (كريب الأطفال): Simple crepes for children
- **Drinks** (مشروبات): Hot chocolate, juices, etc.

## Data Storage
**Primary Storage** (Firebase Firestore):
- `menu` collection: Product menu items with categories, images, prices
- `orders` collection: Customer orders with status tracking and timestamps
- `customers` collection: Auto-generated customer analytics
- `categories` collection: Dynamic menu categories with real-time sync

**Local Storage** (Browser - Fallback & Cache):
- `kc_cart`: Customer shopping cart (temporary)
- `kc_menu`: Menu cache for offline access
- `kc_admin`: Admin login session

**Image Storage** (ImgBB):
- Product images are uploaded to ImgBB and stored as direct URLs in Firestore
- Free cloud hosting with permanent storage
- Secure server-side upload to protect API key

## Development
The site runs on Python's built-in HTTP server:
- Port: 5000
- Host: 0.0.0.0 (accessible externally)
- Cache-Control headers disabled for development
- Socket reuse enabled for quick restarts

## Deployment

### Vercel Deployment (Primary)
The project is optimized for Vercel with:
- Static files in `public/` directory
- Serverless API functions in `api/` directory
- `vercel.json` configuration for routing and headers
- See `VERCEL_DEPLOYMENT.md` for complete deployment guide

**Quick Deploy to Vercel:**
```bash
npm run deploy
```

### Replit Development
- Python server serves static files from `public/`
- All API endpoints functional for local testing
- Workflow automatically configured

## Recent Changes

- **2025-11-18 (v5)**: Restructured for Vercel Deployment
  - **Vercel-Ready Architecture**: Complete project restructure for optimal Vercel deployment
    - Created `public/` directory for all static assets (HTML, CSS, JS, images)
    - Created `api/` directory with Node.js serverless functions
    - Converted Python API endpoints to Vercel-compatible serverless functions
    - Added `vercel.json` configuration with routing and CORS headers
  - **Dual-Environment Support**: Works seamlessly in both Replit and Vercel
    - Python server (server.py) updated to serve from `public/` for Replit dev
    - Serverless functions (api/*.js) for Vercel production
    - Identical API endpoints in both environments
  - **Package Updates**: 
    - Added Vercel CLI to devDependencies
    - Added formidable for multipart form parsing in serverless functions
    - Updated package.json scripts for Vercel deployment
  - **Documentation**: Created comprehensive `VERCEL_DEPLOYMENT.md` guide
    - Step-by-step deployment instructions
    - Environment variable configuration
    - Local development with `vercel dev`
    - Custom domain setup
    - Cost considerations and optimization tips
  

- **2025-11-18 (v4)**: Migrated Image Hosting to ImgBB
  - **ImgBB Integration**: Product images now upload to ImgBB instead of Firebase Storage
    - Free cloud image hosting with permanent storage
    - Server-side upload endpoint (`/api/upload-image`) keeps API key secure
    - Images converted to base64 and uploaded via Python backend
    - Direct image URLs stored in Firestore for fast loading
    - No deletion API for free ImgBB accounts (manual deletion from dashboard)
  - **Security Enhancement**: API key never exposed to frontend
  - **Environment Variables**: Added `IMGBB_API_KEY` secret
  
- **2025-11-18 (v3)**: Migrated Category Management to Firebase
  - **Firebase Storage**: Categories now stored in Firestore `categories` collection
    - Real-time synchronization across all devices and admin sessions
    - Persistent cloud storage with automatic backup
    - Falls back to default categories if collection is empty
  - **Auto-initialization**: System automatically creates default categories on first load
  - **Real-time Updates**: Category changes instantly reflected across all admin panels
  
- **2025-11-18 (v2)**: Added Dynamic Category Management System
  - **Category Management UI**: New "Manage Categories" button in admin menu section
    - Modal interface for adding and deleting menu categories
    - Dynamic category list showing all existing categories
    - Category validation (lowercase IDs, no duplicates)
  - **Dynamic Category Integration**: Categories are now fully dynamic
    - Menu filter buttons automatically update based on categories
    - Item category dropdown dynamically populated from categories
    - Category names displayed in menu item cards
    - Default categories: Sweet Crêpes, Savory Crêpes, Kids Crêpes, Drinks
  - **Bug Fixes**: Fixed dashboard fallback error (loadSalesChartFromOrders)
  
- **2025-11-18 (v1)**: Complete Firebase Firestore & Storage Integration
  - **Database Migration**: Implemented full cloud database with Firestore
    - Created comprehensive database service layer (db-service.js)
    - Migrated from localStorage to Firestore for menu and orders
    - Built one-click data migration tool (migrate-data.html)
  - **Admin Menu Management**: Full CRUD operations
    - Add/Edit/Delete menu items from admin dashboard
    - Upload product images to Firebase Storage
    - Real-time menu synchronization across all clients
    - Category filtering and search
    - Modal-based editing interface with image preview
  - **Real-time Updates**: Live data synchronization
    - Dashboard statistics update in real-time
    - Order status changes reflect immediately
    - Menu changes propagate to all customers instantly
  - **Enhanced Order System**: Cloud-based order management
    - Orders saved to Firestore instead of localStorage
    - Admin can edit order details and update status
    - Customer analytics automatically generated
  - **Security Implementation**: Firebase security rules
    - Created firestore.rules for database access control
    - Created storage.rules for image upload security
    - Documentation for admin authentication setup
  - **Comprehensive Documentation**: Setup guides and troubleshooting
    - FIREBASE_SETUP.md with step-by-step instructions
    - Security best practices and recommendations
    - Migration guide and testing procedures
  - **Backward Compatibility**: Graceful fallbacks
    - Falls back to localStorage if Firebase unavailable
    - Progressive enhancement approach
    - No breaking changes for existing features
  
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
