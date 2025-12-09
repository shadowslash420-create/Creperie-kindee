// Median FCM JavaScript Bridge
const FCMBridge = (() => {
  console.log('Median FCM Bridge loaded');

  // Check if running in Median app
  const isMedian = typeof median !== 'undefined' && median.fcm;

  if (!isMedian) {
    console.log('Not running in Median app, FCM bridge inactive');
    return null;
  }

  console.log('✅ Running in Median app, initializing FCM bridge');

  // Request permission for push notifications
  const requestPermission = () => {
    if (median && median.fcm && median.fcm.request) {
      median.fcm.request();
      console.log('✅ FCM permission requested');
    }
  };

  // Get FCM token
  const getToken = () => {
    return new Promise((resolve) => {
      if (median && median.fcm && median.fcm.token) {
        median.fcm.token((token) => {
          console.log('✅ FCM Token received:', token);
          resolve(token);
        });
      } else {
        resolve(null);
      }
    });
  };

  // Initialize FCM
  const initialize = async () => {
    console.log('🔔 Initializing Median FCM...');
    requestPermission();
    const token = await getToken();

    if (token) {
      // Store token in localStorage for server-side use
      localStorage.setItem('median_fcm_token', token);
      console.log('✅ FCM initialized with token');
    }

    return token;
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  return {
    isMedian,
    requestPermission,
    getToken,
    initialize
  };
})();

// Expose to window
window.FCMBridge = FCMBridge;

// Ensure critical UI functions are available globally for Median webview
if (typeof window.toggleMenu === 'undefined') {
  window.toggleMenu = function() {
    const navMenu = document.getElementById('nav-menu');
    const overlay = document.getElementById('menu-overlay');
    const cartSide = document.getElementById('cart-side');

    if (navMenu && overlay) {
      const isOpen = navMenu.classList.contains('open');
      if (cartSide && cartSide.classList.contains('open')) {
        cartSide.classList.remove('open');
      }
      if (isOpen) {
        navMenu.classList.remove('open');
        overlay.classList.remove('active');
      } else {
        navMenu.classList.add('open');
        overlay.classList.add('active');
      }
    }
  };
}

if (typeof window.toggleCart === 'undefined') {
  window.toggleCart = function() {
    const cartSide = document.getElementById('cart-side');
    const overlay = document.getElementById('menu-overlay');
    const navMenu = document.getElementById('nav-menu');

    if (cartSide && overlay) {
      const isOpen = cartSide.classList.contains('open');
      if (navMenu && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
      }
      if (isOpen) {
        cartSide.classList.remove('open');
        overlay.classList.remove('active');
      } else {
        cartSide.classList.add('open');
        overlay.classList.add('active');
        if (typeof window.renderCart === 'function') {
          window.renderCart();
        }
      }
    }
  };
}

if (typeof window.closeAllSidebars === 'undefined') {
  window.closeAllSidebars = function() {
    const cartSide = document.getElementById('cart-side');
    const navMenu = document.getElementById('nav-menu');
    const overlay = document.getElementById('menu-overlay');

    if (cartSide) cartSide.classList.remove('open');
    if (navMenu) {
      navMenu.classList.add('instant-close');
      navMenu.classList.remove('open');
      setTimeout(() => {
        navMenu.classList.remove('instant-close');
      }, 50);
    }
    if (overlay) overlay.classList.remove('active');
  };
}

console.log('✅ Median UI functions ensured');