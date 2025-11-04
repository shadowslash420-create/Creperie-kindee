# Creperie Kinder

## Overview
A modern, elegant static website for "Creperie Kinder" - a crepe restaurant featuring Sweet Paris-inspired design with:
- Customer-facing menu with tab navigation and shopping cart
- Order placement with Cash on Delivery (COD)
- Admin panel for order management
- Responsive design with RTL (right-to-left) support for Arabic
- Turquoise color scheme with elegant Pacifico script font

## Tech Stack
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Fonts**: Pacifico (cursive headings), Lato (body text)
- **Data Storage**: Browser localStorage (client-side only)
- **Server**: Python HTTP server for static file serving
- **Language**: Arabic UI with English code

## Project Structure
```
.
├── index.html          # Main landing page with tabbed menu
├── about.html          # About us page
├── contact.html        # Contact form page
├── admin.html          # Admin login and order management panel
├── style.css           # All styles with turquoise/teal theme
├── script.js           # Client-side logic (menu, cart, orders, admin)
├── server.py           # Python HTTP server (serves on 0.0.0.0:5000)
├── images/             # SVG placeholder images
└── replit.md          # This file
```

## Design Features

### Color Scheme (Sweet Paris-inspired)
- Primary: Turquoise `#70CFCB`
- Dark Gray: `#3A4A54`
- Light Gray: `#8A9BA8`
- Background: White `#FFFFFF`

### Typography
- Headings: Pacifico (cursive/script font)
- Body: Lato (clean sans-serif)

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
- Login: username `admin`, password `kinder123`
- View all customer orders
- Update order status (Pending → In Progress → Delivered)
- View statistics:
  - Total sales
  - Order count
  - Orders by status
  - Best-selling items

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
- **2025-11-04 (Latest)**: Complete redesign to Sweet Paris aesthetic
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
