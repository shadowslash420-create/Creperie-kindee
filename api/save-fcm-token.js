
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, userId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Save token to Firestore
    await db.collection('fcm_tokens').doc(token).set({
      token,
      userId: userId || 'anonymous',
      role: userId ? 'customer' : 'anonymous',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log('✅ FCM token saved to Firestore:', token.substring(0, 20) + '...');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Error saving FCM token:', error);
    return res.status(500).json({ error: 'Failed to save token', message: error.message });
  }
}
