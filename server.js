
const express = require('express');
const formidable = require('formidable');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File paths
const MENU_FILE = path.join(__dirname, 'menu_data.json');
const ORDERS_FILE = path.join(__dirname, 'orders_data.json');
const FEEDBACK_FILE = path.join(__dirname, 'feedback_data.json');

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
app.get('/api/firebase-config', (req, res) => {
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

app.get('/api/menu', async (req, res) => {
  const menu = await loadJSON(MENU_FILE, []);
  res.json(menu);
});

app.post('/api/menu', async (req, res) => {
  await saveJSON(MENU_FILE, req.body);
  res.json({ success: true });
});

app.get('/api/orders', async (req, res) => {
  const orders = await loadJSON(ORDERS_FILE, []);
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  await saveJSON(ORDERS_FILE, req.body);
  res.json({ success: true });
});

app.get('/api/feedback', async (req, res) => {
  const feedback = await loadJSON(FEEDBACK_FILE, []);
  res.json(feedback);
});

app.post('/api/feedback', async (req, res) => {
  await saveJSON(FEEDBACK_FILE, req.body);
  res.json({ success: true });
});

// Image upload endpoint
app.post('/api/upload-image', async (req, res) => {
  const form = formidable({});

  try {
    console.log('📤 Upload request received');

    const [fields] = await form.parse(req);

    const image = fields.image?.[0];
    const folder = fields.folder?.[0] || 'menu';
    const filename = fields.filename?.[0] || 'image';

    if (!image) {
      throw new Error('No image data provided');
    }

    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (!imgbbApiKey) {
      throw new Error('ImgBB API key not configured');
    }

    console.log('🔑 Using ImgBB API key:', imgbbApiKey.substring(0, 10) + '...');

    // Upload to ImgBB
    const formData = new URLSearchParams();
    formData.append('key', imgbbApiKey);
    formData.append('image', image);
    formData.append('name', `${folder}_${filename}`);

    console.log('📤 Uploading to ImgBB...');

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const result = await response.json();
    console.log('✅ ImgBB response:', result.success);

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

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
  console.log(`Serving directory: ${path.join(__dirname, 'public')}`);
});
