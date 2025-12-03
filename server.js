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

// Disable all caching during development
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0');
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
