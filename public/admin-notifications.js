/* ==================== ADMIN & STAFF NOTIFICATIONS ==================== */
/* Non-module version for classic script loading */

let adminMessaging = null;
let adminNotificationsEnabled = false;

// Initialize notifications for admin/staff
async function setupAdminNotifications() {
  try {
    console.log('🔔 Setting up admin notifications...');
    
    // Check if running in Median
    if (window.FCMBridge && window.FCMBridge.isMedianApp && window.FCMBridge.isMedianApp()) {
      console.log('📱 Running in Median app - using native notifications');
      if (window.FCMBridge.requestToken) {
        window.FCMBridge.requestToken();
      }
      adminNotificationsEnabled = true;
      return true;
    }
    
    // Web notifications for Vercel
    if (!('Notification' in window)) {
      console.warn('⚠️ Notifications not supported');
      return false;
    }

    // Request permission
    if (Notification.permission === 'denied') {
      console.warn('⚠️ Notifications already denied');
      return false;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('⚠️ Notification permission denied');
        return false;
      }
    }

    // Get VAPID key and initialize messaging
    try {
      const vapidResponse = await fetch('/api/vapid-key');
      if (!vapidResponse.ok) throw new Error('VAPID key not found');
      const { vapidKey } = await vapidResponse.json();

      const app = await window.getAppInstance();
      const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
      
      adminMessaging = getMessaging(app);
      
      // Register service worker for background messages
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
        } catch (e) {
          console.log('Service worker already registered');
        }
      }

      // Get FCM token and save for admin
      const token = await getToken(adminMessaging, { vapidKey });
      if (token) {
        console.log('✅ Admin FCM token obtained');
        await saveAdminFCMToken(token);
        adminNotificationsEnabled = true;
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Could not initialize messaging:', error.message);
      adminNotificationsEnabled = true;
      return true;
    }
  } catch (error) {
    console.error('❌ Error setting up admin notifications:', error);
    return false;
  }
}

// Save admin FCM token to server
async function saveAdminFCMToken(token) {
  try {
    const auth = await window.getAuthInstance();
    const userId = auth?.currentUser?.uid;
    
    const response = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        userId,
        isAdmin: true
      })
    });

    if (response.ok) {
      console.log('✅ Admin FCM token saved to server');
    }
  } catch (error) {
    console.warn('⚠️ Could not save admin token:', error.message);
  }
}

// Send notification to customer when order status changes
async function notifyCustomerOrderStatus(orderId, status, userId, customerName) {
  try {
    console.log('📨 Sending order status notification:', { orderId, status, userId });
    
    const response = await fetch('/api/notify-order-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        status,
        userId,
        customerName
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Notification sent:', result);
      return true;
    } else {
      console.error('❌ Failed to send notification:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Error sending notification:', error);
    return false;
  }
}

// Show in-app notification for admin
function showAdminNotification(title, message, type = 'info') {
  try {
    const container = document.createElement('div');
    const bgColor = type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#4299e1';
    
    container.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div style="font-size: 14px; opacity: 0.95;">${message}</div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(container);
    setTimeout(() => container.remove(), 4000);
  } catch (error) {
    console.error('Error showing admin notification:', error);
  }
}

// Expose globally for classic script loading
window.setupAdminNotifications = setupAdminNotifications;
window.notifyCustomerOrderStatus = notifyCustomerOrderStatus;
window.showAdminNotification = showAdminNotification;
