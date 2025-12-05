
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, status, customerEmail } = req.body;

    if (!orderId || !status || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn('⚠️ OneSignal credentials not configured');
      return res.status(500).json({ error: 'OneSignal not configured' });
    }

    const statusMessages = {
      unconfirmed: { title: '⏳ Order Received', body: `Order #${orderId.substring(0, 8)} is being reviewed` },
      pending: { title: '⏳ Order Pending', body: `Order #${orderId.substring(0, 8)} is awaiting confirmation` },
      confirmed: { title: '✅ Order Confirmed', body: `Your order #${orderId.substring(0, 8)} is confirmed!` },
      preparing: { title: '👨‍🍳 Preparing Order', body: `Your order #${orderId.substring(0, 8)} is being prepared` },
      ready: { title: '🎉 Order Ready', body: `Order #${orderId.substring(0, 8)} is ready for pickup/delivery!` },
      delivered: { title: '✅ Delivered', body: `Order #${orderId.substring(0, 8)} has been delivered` }
    };

    const notification = statusMessages[status] || {
      title: 'Order Update',
      body: `Your order #${orderId.substring(0, 8)} status: ${status}`
    };

    // Send to specific user by email tag
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: { en: notification.title },
        contents: { en: notification.body },
        data: {
          orderId,
          status,
          type: 'order_status',
          url: `/my-orders.html?order=${orderId}`
        },
        filters: [
          { field: 'tag', key: 'email', relation: '=', value: customerEmail.toLowerCase() }
        ]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', result);
      return res.status(500).json({ error: 'OneSignal request failed', details: result });
    }

    console.log('✅ Customer notification sent via OneSignal:', result);
    return res.json({ success: true, recipients: result.recipients });

  } catch (error) {
    console.error('❌ Error sending customer notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
