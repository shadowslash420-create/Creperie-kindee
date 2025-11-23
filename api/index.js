
const express = require('express');
const formidable = require('formidable');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();

// Initialize Firebase Admin SDK
let db;
try {
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey
        })
      });
      db = admin.firestore();
      console.log('✅ Firebase Admin initialized');
    } else {
      console.log('⚠️ Firebase credentials not configured - Firebase features will be disabled');
      db = null;
    }
  } else {
    db = admin.firestore();
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  db = null;
}

// Middleware
app.use(cors());
app.use(express.json());

// File paths - adjusted for Vercel serverless
const MENU_FILE = path.join(__dirname, '..', 'menu_data.json');
const ORDERS_FILE = path.join(__dirname, '..', 'orders_data.json');
const FEEDBACK_FILE = path.join(__dirname, '..', 'feedback_data.json');

// Helper functions
async function loadJSON(filename, defaultValue) {
  try {
    const data = await fs.readFile(filename, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return defaultValue;
  }
}

async function saveJSON(filename, data) {
  await fs.writeFile(filename, JSON.stringify(data, null, 2));
}

// API Routes
app.get('/firebase-config', (req, res) => {
  const config = {
    apiKey: process.env.FIREBASE_API_KEY || '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.FIREBASE_APP_ID || ''
  };
  res.json(config);
});

app.get('/menu', async (req, res) => {
  const menu = await loadJSON(MENU_FILE, []);
  res.json(menu);
});

app.post('/menu', async (req, res) => {
  await saveJSON(MENU_FILE, req.body);
  res.json({ success: true });
});

app.get('/orders', async (req, res) => {
  const orders = await loadJSON(ORDERS_FILE, []);
  res.json(orders);
});

app.post('/orders', async (req, res) => {
  await saveJSON(ORDERS_FILE, req.body);
  res.json({ success: true });
});

app.get('/feedback', async (req, res) => {
  const feedback = await loadJSON(FEEDBACK_FILE, []);
  res.json(feedback);
});

app.post('/feedback', async (req, res) => {
  await saveJSON(FEEDBACK_FILE, req.body);
  res.json({ success: true });
});

// Secure phone lookup endpoint
app.get('/orders-by-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Normalize phone number
    const normalizePhone = (phoneStr) => {
      if (!phoneStr) return '';
      let cleaned = phoneStr.replace(/\D/g, '');
      if (cleaned.startsWith('00213')) {
        cleaned = cleaned.substring(5);
      } else if (cleaned.startsWith('213')) {
        cleaned = cleaned.substring(3);
      }
      if (!cleaned.startsWith('0')) {
        cleaned = '0' + cleaned;
      }
      return cleaned;
    };

    const normalizedPhone = normalizePhone(phone);

    // Query Firestore using Admin SDK
    const ordersRef = db.collection('orders');
    const snapshot = await ordersRef.where('phone', '==', normalizedPhone).get();

    const orders = [];
    snapshot.forEach(doc => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by creation date (newest first)
    orders.sort((a, b) => {
      const dateA = a.createdAt?._seconds || 0;
      const dateB = b.createdAt?._seconds || 0;
      return dateB - dateA;
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders by phone:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Image upload endpoint
app.post('/upload-image', express.urlencoded({ extended: true, limit: '10mb' }), async (req, res) => {
  try {
    console.log('📤 Upload request received');
    console.log('📊 Request body keys:', Object.keys(req.body));

    const image = req.body.image;
    const folder = req.body.folder || 'menu';
    const filename = req.body.filename || 'image';

    console.log('📊 Parsed data:', {
      hasImage: !!image,
      imageLength: image ? image.length : 0,
      folder,
      filename
    });

    if (!image) {
      throw new Error('No image data provided');
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      throw new Error('ImgBB API key not configured - please add IMGBB_API_KEY to Secrets');
    }

    console.log('🔑 Using ImgBB API key:', imgbbApiKey.substring(0, 10) + '...');

    // Upload to ImgBB
    const formData = new URLSearchParams();
    formData.append('key', imgbbApiKey);
    formData.append('image', image);
    formData.append('name', `${folder}_${filename}_${Date.now()}`);

    console.log('📤 Uploading to ImgBB API...');

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const result = await response.json();
    console.log('📡 ImgBB response status:', result.success ? '✅ Success' : '❌ Failed');

    if (result.success) {
      console.log('✅ Upload successful:', result.data.display_url);
      res.json({
        success: true,
        url: result.data.display_url
      });
    } else {
      const errorMsg = result.error?.message || 'Unknown error';
      console.error('❌ ImgBB returned error:', errorMsg);
      throw new Error(`ImgBB upload failed: ${errorMsg}`);
    }
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Export for Vercel serverless
module.exports = app;
