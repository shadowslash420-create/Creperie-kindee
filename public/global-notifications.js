// Global Notification Handler - Auto-setup on all pages after modules load
(function() {
  // Wait for modules to load then setup foreground handler
  const setupHandler = async () => {
    let attempts = 0;
    const maxAttempts = 50; // 25 seconds
    
    while (attempts < maxAttempts) {
      if (window.notificationService && typeof window.notificationService.ensureForegroundHandler === 'function') {
        console.log('✅ Global foreground notification handler active');
        await window.notificationService.ensureForegroundHandler();
        return;
      }
      attempts++;
      await new Promise(r => setTimeout(r, 500));
    }
    console.warn('⚠️ Notification service not available after 25 seconds');
  };
  
  setupHandler().catch(e => console.warn('Global notification error:', e));
})();
