
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
    const { orderId, status, userId, customerName } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({ error: 'Order ID and status are required' });
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

    // Status message templates
    const statusMessages = {
      'unconfirmed': {
        ar: 'طلبك في انتظار التأكيد',
        en: 'Your order is awaiting confirmation'
      },
      'pending': {
        ar: 'طلبك قيد التحضير',
        en: 'Your order is being prepared'
      },
      'confirmed': {
        ar: 'تم تأكيد طلبك',
        en: 'Your order has been confirmed'
      },
      'in-progress': {
        ar: 'طلبك في طريقه إليك',
        en: 'Your order is on its way'
      },
      'delivered': {
        ar: 'تم توصيل طلبك بنجاح',
        en: 'Your order has been delivered'
      },
      'cancelled': {
        ar: 'تم إلغاء طلبك',
        en: 'Your order has been cancelled'
      },
      'refused': {
        ar: 'تم رفض طلبك',
        en: 'Your order has been refused'
      }
    };

    const statusMsg = statusMessages[status] || statusMessages['pending'];

    // Get customer's FCM tokens using their email or userId
    let tokens = [];
    if (userId) {
      const normalizedEmail = userId.toLowerCase().trim();
      
      // Try to find tokens by userId (email) or by exact match
      const tokensSnapshot = await db.collection('fcm_tokens')
        .where('active', '==', true)
        .get();

      // Filter tokens that match the customer's email/userId
      tokens = tokensSnapshot.docs
        .filter(doc => {
          const tokenUserId = doc.data().userId?.toLowerCase().trim();
          return tokenUserId === normalizedEmail || tokenUserId === userId;
        })
        .map(doc => doc.data().token);
      
      console.log(`📱 Found ${tokens.length} active tokens for customer: ${normalizedEmail}`);
    }

    if (tokens.length === 0) {
      console.log('No tokens found for customer:', userId);
      return res.json({ success: true, sent: 0, message: 'No tokens available for customer' });
    }

    // Prepare notification message
    const message = {
      notification: {
        title: `🔔 ${statusMsg.ar} - ${statusMsg.en}`,
        body: `طلب #${orderId.substring(0, 8)} | Order #${orderId.substring(0, 8)}`,
        icon: '/images/logo.png'
      },
      data: {
        orderId,
        status,
        type: 'order_status_update',
        url: `/my-orders.html?order=${orderId}`,
        timestamp: Date.now().toString()
      }
    };

    // Send to all customer tokens
    let successCount = 0;
    let failureCount = 0;
    const invalidTokens = [];

    for (const token of tokens) {
      try {
        await admin.messaging().send({ ...message, token });
        successCount++;
        console.log(`✅ Status notification sent to customer token: ${token.substring(0, 20)}...`);
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

    console.log(`📨 Customer status notifications: ${successCount} sent, ${failureCount} failed`);
    
    return res.json({
      success: true,
      sent: successCount,
      failed: failureCount,
      invalidTokensRemoved: invalidTokens.length
    });
  } catch (error) {
    console.error('Error sending customer notification:', error);
    return res.status(500).json({ 
      error: 'Failed to send notification', 
      message: error.message 
    });
  }
}
