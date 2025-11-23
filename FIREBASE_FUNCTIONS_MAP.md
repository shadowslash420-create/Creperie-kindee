# Firebase Functions Map

Complete reference of all functions that use Firebase and their operations.

## 📱 Frontend Functions → Firebase Operations

### 1. Menu Functions
| Frontend Function | Firebase Operation | Collection | Action | Rules |
|---|---|---|---|---|
| `renderMenu()` | `dbService.getAllMenuItems()` | menu | READ | public |
| `renderHomeMenuPreview()` | `dbService.getAllMenuItems()` | menu | READ | public |
| `initMenu()` | `dbService.getAllMenuItems()` | menu | READ | public |
| `getMenuFromFirebase()` | `dbService.getAllMenuItems()` | menu | READ | public |
| `loadMenuItemsFromFirebase()` | `dbService.getAllMenuItems()` | menu | READ | public |
| `addToCart()` | `dbService.getMenuItem()` | menu | READ | public |

### 2. Category Functions
| Frontend Function | Firebase Operation | Collection | Action | Rules |
|---|---|---|---|---|
| `renderMenu()` | `dbService.getAllCategories()` | categories | READ | public |
| `initMenu()` | `dbService.getAllCategories()` | categories | READ | public |
| `getCategoriesFromFirebase()` | `dbService.getAllCategories()` | categories | READ | public |
| `loadMenuItemsFromFirebase()` | `dbService.getAllCategories()` | categories | READ | public |

### 3. Order Functions
| Frontend Function | Firebase Operation | Collection | Action | Rules |
|---|---|---|---|---|
| `submitCheckoutForm()` | `dbService.createOrder()` | orders | CREATE | anyone |
| `checkoutFlow()` | `dbService.createOrder()` | orders | CREATE | anyone |
| `loadMyOrders()` | `dbService.getOrdersByEmail()` | orders | READ | own orders |
| `renderAdminOrders()` | `dbService.getAllOrders()` | orders | READ | admin only |
| `updateOrderStatus()` | `dbService.updateOrderStatus()` | orders | UPDATE | admin only |

### 4. Settings/Business Info
| Frontend Function | Firebase Operation | Collection | Action | Rules |
|---|---|---|---|---|
| `loadSettingsData()` | `dbService.getSettings()` | settings | READ | public |
| `updateSettings()` (admin) | `dbService.updateSettings()` | settings | UPDATE | admin only |

### 5. Reviews/Feedback Functions
| Frontend Function | Firebase Operation | Collection | Action | Rules |
|---|---|---|---|---|
| `submitFeedback()` | `dbService.addReview()` | reviews | CREATE | authenticated |
| `renderFeedbackList()` | `dbService.getAllReviews()` | reviews | READ | public |
| `populateFeedbackItems()` | `dbService.getAllMenuItems()` | menu | READ | public |

### 6. Real-time Listeners
| Firebase Listener | Collection | Action | Rules |
|---|---|---|---|
| `dbService.listenToMenuChanges()` | menu | READ (real-time) | public |
| `dbService.listenToOrders()` | orders | READ (real-time) | admin + own |

---

## 🔒 Security Rules Applied

### Public Collections (Everyone can read)
- ✅ **menu** - View all menu items
- ✅ **categories** - View all categories  
- ✅ **settings** - View business info (hours, name, etc)
- ✅ **reviews** - View all feedback

### Protected Collections

#### Orders Collection
| Operation | Who | Condition |
|---|---|---|
| CREATE | Anyone | No auth required (guest checkout) |
| READ | Admin | isAdmin() |
| READ | Customers | Must match email or userId |
| UPDATE | Admin only | isAdmin() |
| DELETE | Admin only | isAdmin() |

#### Reviews Collection
| Operation | Who | Condition |
|---|---|---|
| CREATE | Logged-in users | request.auth != null |
| READ | Everyone | true |
| UPDATE | Admin only | isAdmin() |
| DELETE | Admin only | isAdmin() |

#### Menu & Categories
| Operation | Who | Condition |
|---|---|---|
| CREATE | Admin only | isAdmin() |
| READ | Everyone | true |
| UPDATE | Admin only | isAdmin() |
| DELETE | Admin only | isAdmin() |

#### Settings
| Operation | Who | Condition |
|---|---|---|
| CREATE | Admin only | isAdmin() |
| READ | Everyone | true |
| UPDATE | Admin only | isAdmin() |
| DELETE | Admin only | isAdmin() |

---

## 🔑 Admin Identification
- Admin email: `oussamaanis2005@gmail.com`
- All admin operations require this email to be authenticated in Firebase

---

## 📊 Database Service Methods

All operations go through `db-service.js`:

```javascript
// Menu operations
dbService.getAllMenuItems()        // Read all menu items
dbService.getMenuItemsByCategory() // Read items by category
dbService.getMenuItem(id)          // Read single item
dbService.addMenuItem(item)        // Create (admin)
dbService.updateMenuItem(id, data) // Update (admin)
dbService.deleteMenuItem(id)       // Delete (admin)
dbService.listenToMenuChanges()    // Real-time listener

// Category operations
dbService.getAllCategories()       // Read all categories
dbService.addCategory(category)    // Create (admin)
dbService.updateCategory(id, data) // Update (admin)
dbService.deleteCategory(id)       // Delete (admin)

// Order operations
dbService.createOrder(orderData)   // Create (anyone)
dbService.getOrdersByEmail(email)  // Read own orders
dbService.getAllOrders()           // Read all (admin)
dbService.updateOrderStatus(id)    // Update (admin)
dbService.deleteOrder(id)          // Delete (admin)

// Settings operations
dbService.getSettings()            // Read settings (public)
dbService.updateSettings(data)     // Update (admin)

// Review operations
dbService.addReview(review)        // Create (authenticated)
dbService.getAllReviews()          // Read all (public)
dbService.deleteReview(id)         // Delete (admin)
```

---

## ✅ Status
- All rules updated with documentation
- All functions mapped to their Firebase operations
- Security rules properly configured
- Ready for deployment to Firebase Console
