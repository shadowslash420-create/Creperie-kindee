// Global notification setup for all pages
import * as notificationService from './notifications.js';

console.log('🌍 Global notifications module loaded');

// Setup foreground handler on all pages
(async () => {
  try {
    if (typeof notificationService.ensureForegroundHandler === 'function') {
      console.log('✅ Setting up foreground handler on', window.location.pathname);
      await notificationService.ensureForegroundHandler();
      console.log('✅ Global foreground handler active on', window.location.pathname);
    } else {
      console.warn('⚠️ ensureForegroundHandler not found in notifications module');
    }
  } catch (error) {
    console.warn('⚠️ Error setting up global notifications:', error.message);
  }
})();
