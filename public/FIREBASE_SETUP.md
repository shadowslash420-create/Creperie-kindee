# Firebase Setup Guide for Creperie Kinder

## 🚨 IMPORTANT: Complete These Steps Before Using the System

Your Creperie Kinder website now has a powerful cloud-based backend with Firebase Firestore. However, you need to complete the following setup steps to enable it securely.

---

## Step 1: Enable Cloud Firestore

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `kinder-87e7e`
3. **Navigate to Firestore Database**:
   - Click "Firestore Database" in the left sidebar
   - Click "Create database"
   
4. **Choose location**:
   - Select "Production mode" (we'll add security rules in the next step)
   - Choose a location closest to your users (e.g., `europe-west` for Europe)
   - Click "Enable"

⏱️ This may take a few minutes to provision.

---

## Step 2: Apply Security Rules

### For Firestore Database:

1. In Firebase Console, go to **Firestore Database > Rules** tab
2. Copy the contents of `firestore.rules` file from your project
3. **Important**: Replace `'your-admin-email@example.com'` with your actual admin email address
4. Paste the rules into the editor
5. Click **"Publish"**

### For Firebase Storage:

1. In Firebase Console, go to **Storage > Rules** tab
2. Copy the contents of `storage.rules` file from your project
3. **Important**: Replace `'your-admin-email@example.com'` with your actual admin email address
4. Paste the rules into the editor
5. Click **"Publish"**

---

## Step 3: Enable Firebase Storage

1. In Firebase Console, click **"Storage"** in the left sidebar
2. Click **"Get Started"**
3. Use **production mode** (rules will be applied from Step 2)
4. Select the **same location** as your Firestore database
5. Click **"Done"**

---

## Step 4: Migrate Existing Menu Data

Now that Firestore is enabled, migrate your menu from JSON to Firestore:

1. **Navigate to**: `https://your-replit-url.repl.co/migrate-data.html`
2. Click **"Start Migration"**
3. Wait for the success message
4. Your menu is now in Firestore!

---

## Step 5: Set Up Admin Authentication (Recommended)

To make the admin panel more secure:

### Option A: Use Firebase Authentication (Recommended)

1. In Firebase Console, go to **Authentication**
2. Click **"Get Started"**
3. Enable **"Email/Password"** provider
4. Add your admin user:
   - Go to Users tab
   - Click "Add User"
   - Enter your admin email and password
5. **Set custom claims** (requires Firebase Admin SDK or Extensions):
   - Install the "Set Custom Claims" extension, OR
   - Use Firebase Functions to set `admin: true` custom claim

### Option B: Continue Using Simple Login (Current Setup)

The current admin login (username: `admin`, password: `kinder123`) still works but is less secure. Consider changing the password in `admin-dashboard.js`.

---

## Step 6: Test Everything

### Test Menu Management:

1. Go to `admin.html`
2. Login with username: `admin`, password: `kinder123`
3. Click "Menu" in the sidebar
4. Try adding a new menu item
5. Try editing an existing item
6. Try uploading an image

### Test Customer Experience:

1. Go to `menu.html`
2. Menu should load from Firestore (real-time!)
3. Add items to cart
4. Place an order
5. Check admin dashboard - order should appear immediately

### Test Real-time Updates:

1. Open admin dashboard in one browser window
2. Open customer menu in another window
3. Add a new menu item in admin
4. Watch it appear instantly on the customer menu!

---

## 🔐 Security Best Practices

### Current Setup:
✅ Menu items: Public read, admin-only write
✅ Orders: Authenticated create, admin manage
✅ Images: Public read, admin-only upload
✅ Size limits: 5MB max for images

### Recommended Enhancements:
1. **Enable Firebase Authentication** for customers (not just admins)
2. **Set custom admin claims** to properly identify admin users
3. **Use environment-specific rules** (stricter for production)
4. **Enable Firebase App Check** to prevent API abuse
5. **Monitor usage** in Firebase Console to detect unusual activity

---

## 📊 What's New?

### Admin Dashboard:
- ✅ Add/Edit/Delete menu items
- ✅ Upload product images to cloud storage
- ✅ Real-time order tracking
- ✅ Live dashboard statistics
- ✅ Customer analytics

### Customer Experience:
- ✅ Real-time menu updates
- ✅ Cloud-based ordering
- ✅ Order history (future)
- ✅ Faster performance

### Technical:
- ✅ Firestore database
- ✅ Firebase Storage for images
- ✅ Real-time listeners
- ✅ Secure API access
- ✅ Data migration tool

---

## 🆘 Troubleshooting

### "Cloud Firestore API has not been used" error
**Solution**: Complete Step 1 to enable Firestore

### "Permission denied" error
**Solution**: Complete Step 2 to apply security rules

### Menu items not loading
**Solution**: Complete Step 4 to migrate menu data

### Images not uploading
**Solution**: Complete Step 3 to enable Firebase Storage

### Dashboard shows 0 orders
**Solution**: Make sure you've placed orders after enabling Firestore. Old localStorage orders won't sync automatically.

---

## 📝 Quick Reference

### Admin Panel URL
- `https://your-replit-url.repl.co/admin.html`
- Username: `admin`
- Password: `kinder123` (change this!)

### Migration Tool URL
- `https://your-replit-url.repl.co/migrate-data.html`

### Firestore Collections
- `menu` - Menu items (id, name, desc, price, img, category)
- `orders` - Customer orders (customerName, customerPhone, items, total, status)
- `customers` - Auto-generated from orders (name, phone, totalOrders, totalSpent)

### Firebase Console
- Main: https://console.firebase.google.com/
- Project: https://console.firebase.google.com/project/kinder-87e7e

---

## 🎉 You're All Set!

Once you complete these steps, your Creperie Kinder website will have:
- ☁️ Cloud-based menu and order management
- 📱 Real-time updates across all devices
- 🔒 Secure database with proper access control
- 📊 Professional admin dashboard
- 🚀 Scalable infrastructure

**Need Help?** Check the troubleshooting section or review the Firebase documentation at https://firebase.google.com/docs
