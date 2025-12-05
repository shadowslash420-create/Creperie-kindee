
// OneSignal initialization for Median WebView
// This script should be loaded in your Median app

window.OneSignalDeferred = window.OneSignalDeferred || [];

OneSignalDeferred.push(async function(OneSignal) {
  await OneSignal.init({
    appId: "193da0a0-041a-4a8c-aa55-a0f4e8e0e399",
    safari_web_id: "web.onesignal.auto.your-safari-id", // Optional
    notifyButton: {
      enable: true
    },
    allowLocalhostAsSecureOrigin: true
  });

  // Get current user email from auth
  try {
    const auth = await window.getAuthInstance();
    if (auth && auth.currentUser) {
      const userEmail = auth.currentUser.email.toLowerCase();
      
      // Tag user with their email for targeted notifications
      await OneSignal.sendTag("email", userEmail);
      console.log('✅ OneSignal user tagged with email:', userEmail);
      
      // Check if user is admin/staff
      const staff = await window.dbService.getAllStaff();
      const isStaff = staff.some(s => s.email?.toLowerCase() === userEmail);
      
      if (isStaff) {
        await OneSignal.sendTag("role", "staff");
        console.log('✅ OneSignal user tagged as staff');
      }
      
      // Check if admin
      if (userEmail === 'oussamaanis2005@gmail.com') {
        await OneSignal.sendTag("role", "admin");
        console.log('✅ OneSignal user tagged as admin');
      }
    }
  } catch (error) {
    console.error('Error setting OneSignal tags:', error);
  }
});
