
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, customerName, total, itemCount } = req.body;

    if (!orderId || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn('⚠️ OneSignal credentials not configured');
      return res.status(500).json({ error: 'OneSignal not configured' });
    }

    // Send to all users tagged as "admin" or "staff"
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: { en: '🔔 New Order!' },
        contents: { 
          en: `Order #${orderId.substring(0, 8)} from ${customerName}\n${itemCount} items - ${total} DZD`
        },
        data: {
          orderId,
          type: 'new_order',
          url: `/admin.html#order-${orderId}`
        },
        filters: [
          { field: 'tag', key: 'role', relation: '=', value: 'admin' },
          { operator: 'OR' },
          { field: 'tag', key: 'role', relation: '=', value: 'staff' }
        ]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', result);
      return res.status(500).json({ error: 'OneSignal request failed', details: result });
    }

    console.log('✅ Admin notification sent via OneSignal:', result);
    return res.json({ success: true, recipients: result.recipients });

  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
