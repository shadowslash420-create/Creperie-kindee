
export default async function handler(req, res) {
  // Add CORS headers
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
    const { orderId, customerName, total, items } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    // Initialize Firebase Admin if needed
    const admin = require('firebase-admin');
    
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    }

    const db = admin.firestore();

    // Get all admin and staff tokens
    const tokensSnapshot = await db.collection('fcm_tokens')
      .where('active', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      console.log('No tokens found for admin/staff');
      return res.json({ success: true, sent: 0, message: 'No tokens available' });
    }

    // Get staff emails to filter tokens
    const staffSnapshot = await db.collection('staff').get();
    const staffEmails = staffSnapshot.docs.map(doc => doc.data().email?.toLowerCase());
    
    // Admin email
    const adminEmail = 'oussamaanis2005@gmail.com';
    staffEmails.push(adminEmail);

    // Filter tokens for admin/staff only
    const adminStaffTokens = tokensSnapshot.docs
      .filter(doc => {
        const userId = doc.data().userId?.toLowerCase();
        return staffEmails.includes(userId);
      })
      .map(doc => doc.data().token);

    if (adminStaffTokens.length === 0) {
      console.log('No admin/staff tokens found');
      return res.json({ success: true, sent: 0, message: 'No admin/staff tokens' });
    }

    // Prepare notification message
    const message = {
      notification: {
        title: '🔔 طلب جديد - New Order!',
        body: `${customerName || 'عميل'} طلب ${items} منتج بقيمة ${total} DZD`,
        icon: '/images/logo.png'
      },
      data: {
        orderId,
        customerName: customerName || 'Guest',
        total: total.toString(),
        items: items.toString(),
        type: 'new_order',
        url: '/admin.html',
        timestamp: Date.now().toString()
      }
    };

    // Send to all admin/staff tokens
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (const token of adminStaffTokens) {
      try {
        await admin.messaging().send({ ...message, token });
        successCount++;
        console.log(`✅ Notification sent to token: ${token.substring(0, 20)}...`);
      } catch (error) {
        failureCount++;
        console.error(`❌ Failed to send to token ${token.substring(0, 20)}...:`, error.message);
        
        // Mark invalid tokens for cleanup
        if (error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered') {
          invalidTokens.push(token);
        }
      }
    }

    // Remove invalid tokens
    for (const token of invalidTokens) {
      await db.collection('fcm_tokens').doc(token).update({ active: false });
    }

    console.log(`📨 New order notifications: ${successCount} sent, ${failureCount} failed`);
    
    return res.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      invalidTokensRemoved: invalidTokens.length
    });
  } catch (error) {
    console.error('Error sending new order notification:', error);
    return res.status(500).json({ 
      error: 'Failed to send notification', 
      message: error.message 
    });
  }
}
