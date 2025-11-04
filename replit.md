# Creperie Kinder

## Overview
A modern, bilingual (Arabic/English) static website for "Creperie Kinder" - a crepe restaurant featuring:
- Customer-facing menu with shopping cart
- Order placement with Cash on Delivery (COD)
- Admin panel for order management
- Responsive design with RTL (right-to-left) support for Arabic

## Tech Stack
- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Data Storage**: Browser localStorage (client-side only)
- **Server**: Python HTTP server for static file serving
- **Language**: Arabic UI with English code

## Project Structure
```
.
├── index.html          # Main landing page with menu
├── about.html          # About us page
├── contact.html        # Contact form page
├── admin.html          # Admin login and order management panel
├── style.css           # All styles with Kinder brand colors
├── script.js           # Client-side logic (menu, cart, orders, admin)
├── server.py           # Python HTTP server (serves on 0.0.0.0:5000)
└── replit.md          # This file
```

## Features

### Customer Features
- Browse menu items with images, descriptions, and prices
- Add items to shopping cart
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

## Data Storage
All data is stored in browser localStorage:
- `kc_menu`: Product menu items
- `kc_cart`: Customer shopping cart
- `kc_orders`: All placed orders
- `kc_admin`: Admin login session

## Color Scheme
- Kinder Red: `#E41E26`
- Kinder Brown: `#7B3F00`
- Background: Gradient from `#f6f0ed` to white

## Development
The site runs on Python's built-in HTTP server:
- Port: 5000
- Host: 0.0.0.0 (accessible externally)
- Cache-Control headers disabled for development

## Deployment
Configured to deploy as an autoscale static website on Replit.

## Recent Changes
- **2025-11-04**: Initial setup for Replit environment
  - Added Python HTTP server for static file serving
  - Configured workflow for port 5000
  - Added .gitignore for Python
  - Created project documentation
