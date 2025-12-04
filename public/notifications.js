import { getMessaging, getToken, onMessage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js';
import { getAppInstance } from './firebase-config.js';

let messaging = null;
let notificationPermission = Notification.permission;

async function initializeMessaging() {
  try {
    const app = await getAppInstance();
    messaging = getMessaging(app);
    console.log('Firebase Messaging initialized');
    return messaging;
  } catch (error) {
    console.error('Error initializing messaging:', error);
    return null;
  }
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }

  try {
    // Try to unregister any existing service worker first
    try {
      const existing = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
      if (existing) {
        await existing.unregister();
        console.log('Unregistered old service worker');
      }
    } catch (e) {
      // No existing registration, that's fine
    }

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    console.log('✅ Service Worker registered:', registration.scope);

    // Fetch and send config to service worker
    try {
      const configResponse = await fetch('/api/firebase-config');
      if (!configResponse.ok) {
        console.warn('Could not fetch Firebase config');
        return registration;
      }
      const config = await configResponse.json();
      
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
      console.warn('Could not send config to service worker:', configError);
    }

    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    if (error.message.includes('https')) {
      console.error('ℹ️ Service Workers require HTTPS or localhost');
    }
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser');
    return { success: false, reason: 'not_supported' };
  }

  if (Notification.permission === 'granted') {
    return { success: true, permission: 'granted' };
  }

  if (Notification.permission === 'denied') {
    return { success: false, reason: 'denied' };
  }

  try {
    const permission = await Notification.requestPermission();
    notificationPermission = permission;
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return { success: true, permission: 'granted' };
    } else {
      console.log('Notification permission denied');
      return { success: false, reason: 'denied' };
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { success: false, reason: 'error', error };
  }
}

export async function getFCMToken(vapidKey) {
  try {
    if (!messaging) {
      await initializeMessaging();
    }

    if (!messaging) {
      throw new Error('Messaging not initialized');
    }

    if (!vapidKey) {
      throw new Error('VAPID key is required for push notifications');
    }

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Service worker registration failed');
    }

    try {
      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        console.log('FCM Token obtained:', token.substring(0, 20) + '...');
        return token;
      } else {
        console.warn('No registration token available - this may be a permissions issue');
        throw new Error('Failed to get FCM token from Firebase');
      }
    } catch (fcmError) {
      console.error('Firebase FCM error:', fcmError);
      if (fcmError.message.includes('Unsupported')) {
        throw new Error('Your browser does not support web push notifications');
      }
      throw fcmError;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
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
    const permissionResult = await requestNotificationPermission();
    
    if (!permissionResult.success) {
      return { success: false, reason: permissionResult.reason };
    }

    await initializeMessaging();
    
    try {
      const token = await getFCMToken(vapidKey);
      
      if (!token) {
        console.warn('No token obtained, but continuing with notifications');
        return { success: true, token: null, partial: true };
      }

      const saved = await saveTokenToServer(token, userId);
      if (!saved) {
        console.warn('Token obtained but could not save to server');
      }

      setupForegroundMessageHandler();

      return { success: true, token };
    } catch (tokenError) {
      console.error('Error during token setup:', tokenError);
      return { success: false, reason: 'token_setup_error', error: tokenError.message };
    }
  } catch (error) {
    console.error('Notification initialization error:', error);
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
