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
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration.scope);

    const config = await fetch('/api/firebase-config').then(r => r.json());
    
    if (registration.active) {
      registration.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: config
      });
    }

    navigator.serviceWorker.ready.then((reg) => {
      reg.active.postMessage({
        type: 'FIREBASE_CONFIG',
        config: config
      });
    });

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
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

    const registration = await registerServiceWorker();
    if (!registration) {
      throw new Error('Service worker registration failed');
    }

    const token = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration
    });

    if (token) {
      console.log('FCM Token obtained:', token.substring(0, 20) + '...');
      return token;
    } else {
      console.warn('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

export async function saveTokenToServer(token, userId = null) {
  try {
    const response = await fetch('/api/save-fcm-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, userId })
    });

    if (!response.ok) {
      throw new Error('Failed to save token');
    }

    console.log('FCM token saved to server');
    return true;
  } catch (error) {
    console.error('Error saving token:', error);
    return false;
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
  const permissionResult = await requestNotificationPermission();
  
  if (!permissionResult.success) {
    return { success: false, reason: permissionResult.reason };
  }

  await initializeMessaging();
  
  const token = await getFCMToken(vapidKey);
  
  if (!token) {
    return { success: false, reason: 'token_failed' };
  }

  await saveTokenToServer(token, userId);

  setupForegroundMessageHandler();

  return { success: true, token };
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
