const express = require('express');
const path = require('path');
const admin = require('firebase-admin');

const app = express();
const PORT = 5000;

// Initialize Firebase Admin SDK
let adminApp = null;
let adminDb = null;
let adminAuth = null;

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

// Optimized caching for performance
app.use((req, res, next) => {
  // Cache static assets (CSS, JS) for 1 hour
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  } else {
    // No cache for HTML files (always fresh)
    res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

app.use(express.static('public'));

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
