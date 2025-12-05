
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, orderId, customerName, customerEmail } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
    const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.warn('⚠️ OneSignal credentials not configured');
      return res.status(500).json({ error: 'OneSignal not configured' });
    }

    let notification;
    let filters;

    if (type === 'admin') {
      // Notify admins/staff about new order
      notification = {
        headings: { en: '🔔 New Order!' },
        contents: { 
          en: `Order #${orderId.substring(0, 8)} from ${customerName || 'Customer'}`
        },
        data: {
          orderId,
          type: 'new_order',
          url: `/admin.html#order-${orderId}`
        }
      };

      // Target users tagged as admin or staff
      filters = [
        { field: 'tag', key: 'role', relation: '=', value: 'admin' },
        { operator: 'OR' },
        { field: 'tag', key: 'role', relation: '=', value: 'staff' }
      ];

    } else if (type === 'customer') {
      // Notify customer about order update
      notification = {
        headings: { en: '📦 Order Update' },
        contents: { 
          en: `Your order #${orderId.substring(0, 8)} has been updated!`
        },
        data: {
          orderId,
          type: 'order_update',
          url: `/my-orders.html?order=${orderId}`
        }
      };

      // Target specific customer by email
      if (customerEmail) {
        filters = [
          { field: 'tag', key: 'email', relation: '=', value: customerEmail.toLowerCase() }
        ];
      } else {
        return res.status(400).json({ error: 'Customer email is required' });
      }

    } else {
      return res.status(400).json({ error: 'Invalid notification type. Use "admin" or "customer"' });
    }

    // Send notification via OneSignal
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: ONESIGNAL_APP_ID,
        headings: notification.headings,
        contents: notification.contents,
        data: notification.data,
        filters: filters
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('OneSignal error:', result);
      return res.status(500).json({ error: 'OneSignal request failed', details: result });
    }

    console.log('✅ Notification sent via OneSignal:', result);
    return res.json({ success: true, recipients: result.recipients, id: result.id });

  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return res.status(500).json({ error: 'Failed to send notification' });
  }
}
