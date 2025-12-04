importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

let firebaseConfig = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FIREBASE_CONFIG') {
    firebaseConfig = event.data.config;
    initializeFirebase();
  }
});

function initializeFirebase() {
  if (!firebaseConfig) {
    console.warn('Firebase config not available yet');
    return;
  }

  try {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log('Received background message:', payload);

      const notificationTitle = payload.notification?.title || payload.data?.title || 'Creperie Kinder';
      const notificationOptions = {
        body: payload.notification?.body || payload.data?.body || 'لديك إشعار جديد',
        icon: payload.notification?.icon || '/images/logo.png',
        badge: '/images/badge.png',
        tag: payload.data?.tag || 'default',
        data: payload.data,
        actions: [
          { action: 'open', title: 'فتح' },
          { action: 'close', title: 'إغلاق' }
        ],
        vibrate: [200, 100, 200],
        requireInteraction: true
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    console.log('Firebase messaging initialized in service worker');
  } catch (error) {
    console.error('Error initializing Firebase in service worker:', error);
  }
}

self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});
