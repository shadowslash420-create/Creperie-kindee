import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';
import { getAppInstance } from './firebase-config.js';

let messaging = null;
let notificationPermission = Notification.permission;

async function initializeMessaging() {
  try {
    console.log('🔔 Initializing Firebase Messaging...');
    const app = await getAppInstance();
    messaging = getMessaging(app);
    console.log('✅ Firebase Messaging initialized successfully');
    return messaging;
  } catch (error) {
    console.error('❌ Error initializing messaging:', error);
    return null;
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service workers not supported in this browser');
    return null;
  }

  try {
    console.log('🔧 Checking for existing service worker registration...');
    
    // Try to unregister any existing service worker first
    try {
      const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (existing) {
        await existing.unregister();
        console.log('🗑️ Unregistered old service worker');
      }
    } catch (e) {
      console.log('ℹ️ No existing service worker to unregister');
    }

    console.log('📝 Registering service worker at /firebase-messaging-sw.js...');
    
    // Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('✅ Service Worker registered successfully');
    console.log('   Scope:', registration.scope);
    console.log('   Active:', registration.active ? 'Yes' : 'No');
    console.log('   Installing:', registration.installing ? 'Yes' : 'No');

    // Fetch and send config to service worker
    try {
      console.log('📡 Fetching Firebase config for service worker...');
      const configResponse = await fetch('/api/firebase-config');
      if (!configResponse.ok) {
        console.warn('⚠️ Could not fetch Firebase config:', configResponse.status);
        return registration;
      }
      const config = await configResponse.json();
      console.log('✅ Firebase config fetched for service worker');
      
      // Send config to active worker
      if (registration.active) {
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: config
        });
        console.log('📨 Config sent to active service worker');
      }

      // Also send when worker becomes ready
      const ready = await navigator.serviceWorker.ready;
      if (ready.active) {
        ready.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: config
        });
        console.log('📨 Config sent to ready service worker');
      }
    } catch (configError) {
      console.warn('⚠️ Could not send config to service worker:', configError.message);
    }

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    
    if (error.message.includes('https') || error.message.includes('insecure')) {
      console.error('ℹ️ Service Workers require HTTPS or localhost');
    }
    
    if (error.message.includes('not found') || error.message.includes('404')) {
      console.error('ℹ️ Service worker file not found at /firebase-messaging-sw.js');
    }
    
    throw error;
  }
}

export async function requestNotificationPermission() {
  console.log('🔔 Requesting notification permission...');
  
  if (!('Notification' in window)) {
    console.warn('⚠️ Notifications not supported in this browser');
    return { success: false, reason: 'not_supported' };
  }

  console.log('Current permission status:', Notification.permission);

  if (Notification.permission === 'granted') {
    console.log('✅ Permission already granted');
    return { success: true, permission: 'granted' };
  }

  if (Notification.permission === 'denied') {
    console.warn('⚠️ Permission previously denied');
    return { success: false, reason: 'denied' };
  }

  try {
    console.log('📱 Prompting user for permission...');
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted');
      return { success: true, permission: 'granted' };
    } else {
      console.log('❌ Notification permission denied');
      return { success: false, reason: 'denied' };
    }
  } catch (error) {
    console.error('❌ Error requesting notification permission:', error);
    return { success: false, reason: 'error', error };
  }
}

export async function getFCMToken(vapidKey) {
  try {
    console.log('🔑 Getting FCM Token...');
    
    if (!messaging) {
      console.log('📱 Messaging not initialized, initializing now...');
      await initializeMessaging();
    }

    if (!messaging) {
      throw new Error('Messaging not initialized');
    }

    if (!vapidKey) {
      console.error('❌ No VAPID key provided');
      throw new Error('VAPID key is required for push notifications');
    }

    console.log('✅ VAPID key available');
    console.log('🔧 Registering service worker...');

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Service worker registration failed');
    }

    console.log('✅ Service worker registered');
    console.log('🎫 Requesting FCM token from Firebase...');

    try {
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('✅ FCM Token obtained successfully:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.warn('⚠️ No registration token available');
        throw new Error('Failed to get FCM token from Firebase');
      }
    } catch (fcmError) {
      console.error('❌ Firebase FCM error:', fcmError);
      if (fcmError.message && fcmError.message.includes('Unsupported')) {
        throw new Error('Your browser does not support web push notifications');
      }
      throw fcmError;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    throw error;
  }
}

export async function saveTokenToServer(token, userId = null) {
  try {
    if (!token) {
      console.warn('No token to save');
      return false;
    }
    
    const response = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId }),
      timeout: 5000
    });

    if (!response.ok) {
      console.error('Server returned:', response.status, response.statusText);
      if (response.status === 500) {
        console.warn('Server error saving token, but continuing');
        return true;
      }
      throw new Error(`Failed to save token: ${response.status}`);
    }

    console.log('✅ FCM token saved to server');
    return true;
  } catch (error) {
    console.warn('Warning saving token to server:', error.message);
    return true;
  }
}

export function setupForegroundMessageHandler(callback) {
  if (!messaging) {
    console.warn('Messaging not initialized yet');
    return;
  }

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);

    if (callback) {
      callback(payload);
    } else {
      showInAppNotification(payload);
    }
  });
}

export function showInAppNotification(payload) {
  const title = payload.notification?.title || payload.data?.title || 'إشعار جديد';
  const body = payload.notification?.body || payload.data?.body || '';
  const icon = payload.notification?.icon || payload.data?.icon;

  const container = document.createElement('div');
  container.className = 'in-app-notification';
  container.innerHTML = `
    <div class="notification-content">
      ${icon ? `<img src="${icon}" alt="" class="notification-icon">` : ''}
      <div class="notification-text">
        <div class="notification-title">${title}</div>
        ${body ? `<div class="notification-body">${body}</div>` : ''}
      </div>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
    </div>
  `;

  document.body.appendChild(container);

  setTimeout(() => {
    container.classList.add('show');
  }, 10);

  setTimeout(() => {
    container.classList.remove('show');
    setTimeout(() => container.remove(), 300);
  }, 5000);
}

export async function initializeNotifications(vapidKey, userId = null) {
  try {
    console.log('🚀 Starting notification initialization...');
    console.log('VAPID Key provided:', vapidKey ? 'Yes (' + vapidKey.substring(0, 20) + '...)' : 'No');
    console.log('User ID:', userId || 'None');
    console.log('Browser supports notifications:', 'Notification' in window);
    console.log('Browser supports service workers:', 'serviceWorker' in navigator);
    console.log('Current permission:', Notification.permission);
    
    if (!vapidKey) {
      console.error('❌ No VAPID key provided');
      return { success: false, reason: 'no_vapid_key', error: 'VAPID key is required' };
    }
    
    const permissionResult = await requestNotificationPermission();
    
    if (!permissionResult.success) {
      console.log('❌ Permission denied:', permissionResult.reason);
      return { success: false, reason: permissionResult.reason };
    }

    console.log('✅ Permission granted, initializing messaging...');
    await initializeMessaging();
    
    if (!messaging) {
      console.error('❌ Firebase messaging not initialized');
      return { success: false, reason: 'messaging_not_initialized', error: 'Firebase messaging failed to initialize' };
    }
    
    try {
      console.log('🎫 Getting FCM token...');
      const token = await getFCMToken(vapidKey);
      
      if (!token) {
        console.warn('⚠️ No token obtained');
        return { success: false, reason: 'no_token', error: 'Failed to obtain FCM token' };
      }

      console.log('💾 Saving token to server...');
      const saved = await saveTokenToServer(token, userId);
      if (!saved) {
        console.warn('⚠️ Token obtained but could not save to server');
      } else {
        console.log('✅ Token saved to server');
      }

      console.log('👂 Setting up foreground message handler...');
      setupForegroundMessageHandler();

      console.log('✅ Notification initialization complete!');
      return { success: true, token };
    } catch (tokenError) {
      console.error('❌ Error during token setup:', tokenError);
      console.error('Token error stack:', tokenError.stack);
      return { success: false, reason: 'token_setup_error', error: tokenError.message };
    }
  } catch (error) {
    console.error('❌ Notification initialization error:', error);
    console.error('Init error stack:', error.stack);
    return { success: false, reason: 'init_error', error: error.message };
  }
}

export function getNotificationPermissionStatus() {
  if (!('Notification' in window)) {
    return 'not_supported';
  }
  return Notification.permission;
}

export async function unsubscribeFromNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('Unsubscribed from push notifications');
    }

    return true;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}

if (typeof window !== 'undefined') {
  window.notificationService = {
    initialize: initializeNotifications,
    requestPermission: requestNotificationPermission,
    getPermissionStatus: getNotificationPermissionStatus,
    showInAppNotification,
    unsubscribe: unsubscribeFromNotifications
  };
}
