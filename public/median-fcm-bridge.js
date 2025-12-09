
// Median FCM Bridge - Handles push notifications in Median WebView
console.log('🔔 Median FCM Bridge initializing...');

// Check if running in Median app
const isMedianApp = window.median && window.median.run;

// Bridge object to handle Median-specific functionality
const MedianFCMBridge = {
  isInitialized: false,
  
  // Initialize the bridge
  init: function() {
    if (this.isInitialized) {
      console.log('⚠️ Median FCM Bridge already initialized');
      return;
    }

    console.log('📱 Detected environment:', isMedianApp ? 'Median App' : 'Web Browser');

    if (isMedianApp) {
      this.setupMedianListeners();
    } else {
      this.setupWebListeners();
    }

    this.isInitialized = true;
    console.log('✅ Median FCM Bridge initialized');
  },

  // Setup listeners for Median app environment
  setupMedianListeners: function() {
    console.log('📱 Setting up Median app listeners...');

    // Request notification permission in Median
    if (window.median && window.median.pushNotifications) {
      window.median.pushNotifications.register({
        callback: function(status) {
          console.log('📲 Median push notification status:', status);
        }
      });
    }

    // Listen for push notifications
    document.addEventListener('median_push_notification_received', function(e) {
      console.log('🔔 Push notification received:', e.detail);
      
      // Show notification to user
      if (e.detail && e.detail.message) {
        MedianFCMBridge.showNotification(e.detail.message, e.detail.data);
      }
    });

    // Listen for notification taps
    document.addEventListener('median_push_notification_tapped', function(e) {
      console.log('👆 Push notification tapped:', e.detail);
      
      // Handle notification tap (e.g., navigate to order details)
      if (e.detail && e.detail.data && e.detail.data.orderId) {
        window.location.href = '/my-orders.html?order=' + e.detail.data.orderId;
      }
    });

    console.log('✅ Median listeners configured');
  },

  // Setup listeners for web browser environment
  setupWebListeners: function() {
    console.log('🌐 Setting up web browser listeners...');

    // Web push notifications via Service Worker will be handled by OneSignal
    if ('serviceWorker' in navigator) {
      console.log('✅ Service Worker supported');
    }
  },

  // Show notification (works in both Median and Web)
  showNotification: function(message, data) {
    console.log('🔔 Showing notification:', message, data);

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #FF6B35, #FF8C42);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(255, 107, 53, 0.4);
      z-index: 10000;
      font-weight: 600;
      font-size: 14px;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
      cursor: pointer;
    `;
    notification.innerHTML = '🔔 ' + message;

    // Add click handler
    notification.addEventListener('click', function() {
      if (data && data.orderId) {
        window.location.href = '/my-orders.html?order=' + data.orderId;
      }
      notification.remove();
    });

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.style.transition = 'opacity 0.3s, transform 0.3s';
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  // Get device token (Median-specific)
  getDeviceToken: function() {
    return new Promise((resolve, reject) => {
      if (isMedianApp && window.median && window.median.pushNotifications) {
        window.median.pushNotifications.getToken({
          callback: function(token) {
            console.log('📲 Device token:', token);
            resolve(token);
          }
        });
      } else {
        console.log('⚠️ Not in Median app, no device token available');
        resolve(null);
      }
    });
  },

  // Subscribe to OneSignal (for both web and Median)
  subscribeToOneSignal: async function(userEmail) {
    try {
      console.log('📧 Subscribing to OneSignal:', userEmail);

      // Wait for OneSignal to be ready
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          // Set external user ID (email)
          await OneSignal.login(userEmail);
          console.log('✅ OneSignal user logged in:', userEmail);

          // Add tags for filtering
          await OneSignal.User.addTags({
            email: userEmail,
            platform: isMedianApp ? 'median' : 'web'
          });

          console.log('✅ OneSignal tags added');
        });
      }
    } catch (error) {
      console.error('❌ OneSignal subscription error:', error);
    }
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    MedianFCMBridge.init();
  });
} else {
  MedianFCMBridge.init();
}

// Expose to window for global access
window.MedianFCMBridge = MedianFCMBridge;

console.log('✅ Median FCM Bridge loaded and ready');
