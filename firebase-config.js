// Firebase Configuration - fetches from server environment variables
// This keeps your Firebase credentials secure

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

let app = null;
let auth = null;
let db = null;
let storage = null;
let initPromise = null;

// Fetch Firebase config from server
async function loadFirebaseConfig() {
  try {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error(`Failed to fetch Firebase config: ${response.status}`);
    }
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Failed to load Firebase config:', error);
    throw error;
  }
}

// Initialize Firebase (singleton pattern)
async function initializeFirebase() {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      const config = await loadFirebaseConfig();
      app = initializeApp(config);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      console.log('Firebase initialized successfully with Firestore and Storage');
      return { app, auth, db, storage };
    } catch (error) {
      console.error('Firebase initialization failed:', error);
      initPromise = null; // Reset so it can be retried
      throw error;
    }
  })();

  return initPromise;
}

// Get auth instance (ensures Firebase is initialized)
export async function getAuthInstance() {
  if (auth) return auth;
  const result = await initializeFirebase();
  return result.auth;
}

// Get app instance (ensures Firebase is initialized)
export async function getAppInstance() {
  if (app) return app;
  const result = await initializeFirebase();
  return result.app;
}

// Get Firestore instance (ensures Firebase is initialized)
export async function getFirestoreInstance() {
  if (db) return db;
  const result = await initializeFirebase();
  return result.db;
}

// Get Storage instance (ensures Firebase is initialized)
export async function getStorageInstance() {
  if (storage) return storage;
  const result = await initializeFirebase();
  return result.storage;
}

// Auto-initialize on import
initializeFirebase().catch(err => {
  console.error('Auto-initialization failed:', err);
});

export { app, auth, db, storage };
