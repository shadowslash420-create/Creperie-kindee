
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
    const { orderId, customerName, total } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Get all admin and staff tokens
    const tokensSnapshot = await db.collection('fcm_tokens')
      .where('active', '==', true)
      .where('role', 'in', ['admin', 'staff_a', 'staff_b'])
      .get();

    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      console.log('⚠️ No admin/staff tokens found');
      return res.json({ success: true, sent: 0, message: 'No tokens found' });
    }

    // Send notification to each token
    const message = {
      notification: {
        title: '🔔 طلب جديد!',
        body: `طلب من ${customerName || 'عميل'} - ${total || '0'} DZD`
      },
      data: {
        orderId,
        type: 'new_order',
        url: `/admin.html?order=${orderId}`,
        timestamp: Date.now().toString()
      }
    };

    let successCount = 0;
    for (const token of tokens) {
      try {
        await admin.messaging().send({ ...message, token });
        successCount++;
      } catch (error) {
        console.error('❌ Error sending to token:', error.code);
        // Remove invalid tokens
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
          await db.collection('fcm_tokens').doc(token).update({ active: false });
        }
      }
    }

    console.log(`✅ Sent ${successCount}/${tokens.length} notifications`);
    return res.json({ success: true, sent: successCount, total: tokens.length });
  } catch (error) {
    console.error('❌ Error sending notifications:', error);
    return res.status(500).json({ error: 'Failed to send notifications', message: error.message });
  }
}
