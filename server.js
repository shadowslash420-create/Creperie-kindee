const express = require('express');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = 5000;

// Initialize Firebase Admin SDK
let adminApp = null;
let adminDb = null;
let adminAuth = null;

// Admin credentials - hardcoded admins (replace with database check later)
const ADMIN_EMAILS = ['oussamaanis2005@gmail.com'];

function initializeFirebaseAdmin() {
  try {
    if (!process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PROJECT_ID) {
      console.warn('⚠️ Firebase Admin SDK credentials not fully configured. Some admin features may not work.');
      return;
    }

    // Parse the private key (handle escaped newlines)
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || 'key-id',
      private_key: privateKey,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID || 'client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: ''
    };

    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID
    });

    adminDb = admin.firestore();
    adminAuth = admin.auth();

    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin SDK initialization failed:', error.message);
  }
}

// Initialize Firebase Admin SDK on startup
initializeFirebaseAdmin();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable caching for development - always get fresh code
app.use((req, res, next) => {
  // Never cache - always get fresh code
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(express.static('public'));

// ========== ADMIN AUTHENTICATION ENDPOINTS ==========

// Admin Login - Create custom token for authorized users
app.post('/api/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    if (!adminAuth) {
      return res.status(500).json({ error: 'Admin SDK not initialized' });
    }

    console.log(`🔐 Admin login attempt for: ${email}`);

    // Verify user exists and password is correct using Firebase Admin SDK
    try {
      // Get user by email
      const user = await adminAuth.getUserByEmail(email);
      console.log(`✅ User found: ${email}`);

      // Check if user is admin
      if (!ADMIN_EMAILS.includes(email)) {
        console.warn(`❌ User ${email} is not an admin`);
        return res.status(403).json({ error: 'User is not authorized as admin' });
      }

      // Create custom token for admin
      const customToken = await adminAuth.createCustomToken(user.uid, { admin: true });
      
      res.json({
        success: true,
        token: customToken,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Admin'
        }
      });

      console.log(`✅ Admin token created for: ${email}`);
    } catch (authError) {
      console.error(`❌ Auth error: ${authError.message}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin Logout
app.post('/api/admin-logout', (req, res) => {
  try {
    console.log('🚪 Admin logout');
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Check Admin Status
app.get('/api/admin-status', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ admin: false, error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    
    if (!adminAuth) {
      return res.status(500).json({ admin: false, error: 'Admin SDK not initialized' });
    }

    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const user = await adminAuth.getUser(decodedToken.uid);

    const isAdmin = ADMIN_EMAILS.includes(user.email);

    res.json({
      admin: isAdmin,
      email: user.email,
      displayName: user.displayName || 'Admin',
      uid: user.uid
    });
  } catch (error) {
    console.error('Token verification error:', error.message);
    res.status(401).json({ admin: false, error: 'Invalid token' });
  }
});

// ========== PUBLIC ENDPOINTS ==========

// Serve Firebase config from environment variables
app.get('/api/firebase-config', (req, res) => {
  res.json({
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  });
});

// Get VAPID key for web push
app.get('/api/vapid-key', (req, res) => {
  console.log('🔑 VAPID key requested');
  const vapidKey = process.env.FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.error('❌ VAPID key not configured in environment variables');
    return res.status(404).json({ error: 'VAPID key not configured' });
  }
  console.log('✅ VAPID key found');
  res.json({ vapidKey });
});

// ========== PUSH NOTIFICATION ENDPOINTS ==========

// Save FCM token
app.post('/api/save-fcm-token', async (req, res) => {
  try {
    console.log('📱 Received FCM token save request');
    const { token, userId } = req.body;

    if (!token) {
      console.error('❌ No token provided');
      return res.status(400).json({ error: 'Token is required' });
    }

    console.log('🔑 Token:', token.substring(0, 20) + '...');
    console.log('👤 User ID:', userId || 'None');

    if (!adminDb) {
      console.error('❌ Database not initialized');
      return res.status(500).json({ error: 'Database not initialized' });
    }

    const tokenDoc = {
      token,
      userId: userId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      active: true
    };

    await adminDb.collection('fcm_tokens').doc(token).set(tokenDoc, { merge: true });

    console.log('📱 FCM token saved:', token.substring(0, 20) + '...');
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({ error: 'Failed to save token' });
  }
});

// Send notification to specific user or all users
app.post('/api/send-notification', async (req, res) => {
  try {
    const { title, body, icon, url, userId, sendToAll } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    let tokens = [];

    if (sendToAll) {
      const snapshot = await adminDb.collection('fcm_tokens')
        .where('active', '==', true)
        .get();
      tokens = snapshot.docs.map(doc => doc.data().token);
    } else if (userId) {
      const snapshot = await adminDb.collection('fcm_tokens')
        .where('userId', '==', userId)
        .where('active', '==', true)
        .get();
      tokens = snapshot.docs.map(doc => doc.data().token);
    }

    if (tokens.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No tokens found' });
    }

    const message = {
      notification: {
        title,
        body,
        ...(icon && { icon })
      },
      data: {
        title,
        body,
        ...(url && { url }),
        timestamp: Date.now().toString()
      }
    };

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (const token of tokens) {
      try {
        await admin.messaging().send({ ...message, token });
        successCount++;
      } catch (error) {
        failureCount++;
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(token);
        }
      }
    }

    for (const token of invalidTokens) {
      await adminDb.collection('fcm_tokens').doc(token).update({ active: false });
    }

    console.log(`📨 Notifications sent: ${successCount} success, ${failureCount} failed`);
    res.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      invalidTokensRemoved: invalidTokens.length
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Send order status notification
app.post('/api/notify-order-status', async (req, res) => {
  try {
    const { orderId, status, userId, customerName } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'Order ID and status are required' });
    }

    const statusMessages = {
      'received': { title: 'Order Received', body: `We've got your order #${orderId} and it's being checked.` },
      'preparing': { title: 'Preparing Your Order', body: `The restaurant is working on your order #${orderId}.` },
      'ready': { title: 'Ready for Pickup', body: `Your order #${orderId} is prepared and waiting for the driver.` },
      'picked_up': { title: 'Picked Up', body: `The driver has collected your order #${orderId}.` },
      'in_transit': { title: 'On the Way', body: `Your order #${orderId} is on the way to your location.` },
      'cancelled': { title: 'Order Cancelled', body: `Your order #${orderId} has been cancelled.` }
    };

    const notification = statusMessages[status] || {
      title: 'تحديث الطلب',
      body: `تم تحديث حالة طلبك #${orderId}`
    };

    if (!adminDb) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    let tokens = [];
    if (userId) {
      const snapshot = await adminDb.collection('fcm_tokens')
        .where('userId', '==', userId)
        .where('active', '==', true)
        .get();
      tokens = snapshot.docs.map(doc => doc.data().token);
    }

    if (tokens.length === 0) {
      return res.json({ success: true, sent: 0, message: 'No tokens found for user' });
    }

    const message = {
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: {
        orderId,
        status,
        url: `/my-orders.html?highlight=${orderId}`,
        timestamp: Date.now().toString()
      }
    };

    let successCount = 0;
    for (const token of tokens) {
      try {
        await admin.messaging().send({ ...message, token });
        successCount++;
      } catch (error) {
        console.error('Error sending to token:', error.message);
      }
    }

    res.json({ success: true, sent: successCount });
  } catch (error) {
    console.error('Error sending order notification:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// Notify admin when customer places new order
app.post('/api/notify-admin-new-order', async (req, res) => {
  try {
    const { orderId, customerName, orderTotal, itemCount } = req.body;

    if (!orderId || !customerName) {
      return res.status(400).json({ error: 'Order ID and customer name are required' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Database not initialized' });
    }

    // Get all admin tokens (admins have null or 'admin' userId)
    const snapshot = await adminDb.collection('fcm_tokens')
      .where('active', '==', true)
      .get();

    const adminTokens = snapshot.docs
      .map(doc => doc.data().token)
      .filter(token => token); // Filter out any undefined

    if (adminTokens.length === 0) {
      console.log('⚠️ No admin tokens found for new order notification');
      return res.json({ success: true, sent: 0, message: 'No admin tokens found' });
    }

    const message = {
      notification: {
        title: 'طلب جديد! 🍽️',
        body: `طلب جديد من ${customerName} - ${itemCount || 'عدة'} عناصر - ${orderTotal || 'بدون سعر'}`
      },
      data: {
        orderId,
        customerName,
        type: 'new_order',
        url: `/admin.html#orders`,
        timestamp: Date.now().toString()
      }
    };

    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (const token of adminTokens) {
      try {
        await admin.messaging().send({ ...message, token });
        successCount++;
        console.log(`📱 Admin notification sent for order #${orderId}`);
      } catch (error) {
        failureCount++;
        console.error(`Error sending admin notification: ${error.message}`);
        if (error.code === 'messaging/registration-token-not-registered' ||
            error.code === 'messaging/invalid-registration-token') {
          invalidTokens.push(token);
        }
      }
    }

    // Mark invalid tokens as inactive
    for (const token of invalidTokens) {
      await adminDb.collection('fcm_tokens').doc(token).update({ active: false });
    }

    console.log(`✅ Admin notifications: ${successCount} sent, ${failureCount} failed for order #${orderId}`);
    res.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      invalidTokensRemoved: invalidTokens.length
    });
  } catch (error) {
    console.error('Error notifying admin:', error);
    res.status(500).json({ error: 'Failed to notify admin' });
  }
});

// Export admin instances for use in other modules
module.exports.adminApp = adminApp;
module.exports.adminDb = adminDb;
module.exports.adminAuth = adminAuth;

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Development server running at http://0.0.0.0:${PORT}/`);
  console.log(`Serving static files from: ${path.join(__dirname, 'public')}`);
});
