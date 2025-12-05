
// OneSignal initialization for Median WebView and Web
window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "193da0a0-041a-4a8c-aa55-a0f4e8e0e399",
    safari_web_id: "web.onesignal.auto.your-safari-id", // Optional
    notifyButton: {
      enable: true,
      size: 'medium',
      position: 'bottom-right',
      offset: {
        bottom: '80px',
        right: '20px'
      },
      showCredit: false,
      text: {
        'tip.state.unsubscribed': 'تفعيل الإشعارات',
        'tip.state.subscribed': 'الإشعارات مفعلة ✓',
        'tip.state.blocked': 'تم حظر الإشعارات',
        'message.prenotify': 'انقر للاشتراك في الإشعارات',
        'message.action.subscribed': 'شكراً! سنرسل لك الإشعارات المهمة',
        'message.action.resubscribed': 'تم تفعيل الإشعارات من جديد',
        'dialog.main.title': 'إدارة الإشعارات',
        'dialog.main.button.subscribe': 'تفعيل',
        'dialog.main.button.unsubscribe': 'إلغاء',
        'dialog.blocked.title': 'إلغاء حظر الإشعارات',
        'dialog.blocked.message': 'اتبع التعليمات لإلغاء حظر الإشعارات:'
      }
    },
    allowLocalhostAsSecureOrigin: true,
    serviceWorkerParam: { scope: '/' },
    serviceWorkerPath: '/OneSignalSDKWorker.js'
  });

  console.log('✅ OneSignal initialized with App ID:', '193da0a0-041a-4a8c-aa55-a0f4e8e0e399');

  // Wait for user authentication and tag appropriately
  try {
    // Wait for auth to be ready
    if (window.getAuthInstance) {
      const auth = await window.getAuthInstance();
      
      if (auth && auth.currentUser) {
        const userEmail = auth.currentUser.email.toLowerCase();
        console.log('👤 Authenticated user detected:', userEmail);
        
        // Tag user with their email for targeted notifications
        await OneSignal.sendTag("email", userEmail);
        console.log('✅ OneSignal user tagged with email:', userEmail);
        
        // Check if user is staff (load from Firebase)
        if (window.dbService) {
          await window.dbService.init();
          const staff = await window.dbService.getAllStaff();
          const isStaff = staff.some(s => s.email?.toLowerCase() === userEmail);
          
          if (isStaff) {
            const staffMember = staff.find(s => s.email?.toLowerCase() === userEmail);
            const role = staffMember.role === 'Staff A' ? 'staff_a' : staffMember.role === 'Staff B' ? 'staff_b' : 'staff';
            await OneSignal.sendTag("role", role);
            console.log('✅ OneSignal user tagged as staff:', role);
          }
        }
        
        // Check if admin
        if (userEmail === 'oussamaanis2005@gmail.com') {
          await OneSignal.sendTag("role", "admin");
          console.log('✅ OneSignal user tagged as admin');
        }
        
        // If not staff or admin, tag as customer
        const currentTags = await OneSignal.getTags();
        if (!currentTags.role) {
          await OneSignal.sendTag("role", "customer");
          console.log('✅ OneSignal user tagged as customer');
        }
      } else {
        console.log('ℹ️ No user logged in - OneSignal initialized without user tags');
      }
    }
  } catch (error) {
    console.error('⚠️ Error setting OneSignal tags:', error);
  }

  // Listen for subscription changes
  OneSignal.on('subscriptionChange', function(isSubscribed) {
    console.log('🔔 OneSignal subscription changed:', isSubscribed ? 'Subscribed' : 'Unsubscribed');
  });

  // Listen for notification display
  OneSignal.on('notificationDisplay', function(event) {
    console.log('🔔 OneSignal notification displayed:', event);
  });
});

// Re-tag user when auth state changes
if (window.onAuthChange) {
  window.onAuthChange(async (user) => {
    if (user && window.OneSignal) {
      const userEmail = user.email.toLowerCase();
      console.log('🔄 Auth changed - retagging OneSignal user:', userEmail);
      
      try {
        await window.OneSignal.sendTag("email", userEmail);
        
        // Check staff status
        if (window.dbService) {
          await window.dbService.init();
          const staff = await window.dbService.getAllStaff();
          const staffMember = staff.find(s => s.email?.toLowerCase() === userEmail);
          
          if (staffMember) {
            const role = staffMember.role === 'Staff A' ? 'staff_a' : staffMember.role === 'Staff B' ? 'staff_b' : 'staff';
            await window.OneSignal.sendTag("role", role);
          } else if (userEmail === 'oussamaanis2005@gmail.com') {
            await window.OneSignal.sendTag("role", "admin");
          } else {
            await window.OneSignal.sendTag("role", "customer");
          }
        }
        
        console.log('✅ OneSignal user retagged successfully');
      } catch (error) {
        console.error('⚠️ Error retagging OneSignal user:', error);
      }
    }
  });
}

console.log('📱 OneSignal initialization script loaded');
