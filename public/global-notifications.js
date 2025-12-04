// Global Notification Handler - Loads on all pages
// Ensures customers see notifications everywhere, not just on one page

(function() {
  // Auto-initialize foreground message handler when notifications module is ready
  if (window.notificationService && window.notificationService.ensureForegroundHandler) {
    window.notificationService.ensureForegroundHandler()
      .then(() => console.log('✅ Global foreground notification handler active'))
      .catch(e => console.warn('⚠️ Could not activate global foreground handler:', e));
  }
})();
