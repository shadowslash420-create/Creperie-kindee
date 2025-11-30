// Firebase Configuration
// Add your Firebase project credentials here

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

let app = null;
let auth = null;
let db = null;
let storage = null;
let initPromise = null;

// Firebase configuration object - will be loaded from backend
let firebaseConfig = null;

// Load Firebase config from backend API or fallback to hardcoded values
async function loadFirebaseConfig() {
  if (firebaseConfig) {
    return firebaseConfig;
  }
  
  try {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Failed to load Firebase config from API');
    }
    firebaseConfig = await response.json();
    console.log('Firebase config loaded successfully');
    return firebaseConfig;
  } catch (error) {
    console.warn('API endpoint failed, using embedded config:', error.message);
    // Fallback to embedded config from environment variables
    // These are set by Replit and are safe to use in frontend (public API keys)
    firebaseConfig = {
      apiKey: 'AIzaSyApo_-Y96wRPfJ3zdDWmzOuj3E66c1hFxk',
      authDomain: 'kinder-87e7e.firebaseapp.com',
      projectId: 'kinder-87e7e',
      storageBucket: 'kinder-87e7e.appspot.com',
      messagingSenderId: '447252216729',
      appId: '1:447252216729:web:371d0ec1dce02b52db7108'
    };
    console.log('Firebase config loaded successfully from embedded values');
    return firebaseConfig;
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
