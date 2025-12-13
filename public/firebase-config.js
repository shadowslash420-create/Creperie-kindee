// Firebase Configuration
// Add your Firebase project credentials here

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js';

let app = null;
let auth = null;
let db = null;
let storage = null;
let initPromise = null;

// Firebase configuration - hardcoded for static deployments (Vercel, Render, etc.)
const FIREBASE_CONFIG_FALLBACK = {
  apiKey: "AIzaSyApo_-Y96wRPfJ3zdDWmzOuj3E66c1hFxk",
  authDomain: "kinder-87e7e.firebaseapp.com",
  projectId: "kinder-87e7e",
  storageBucket: "kinder-87e7e.firebasestorage.app",
  messagingSenderId: "447252216729",
  appId: "1:447252216729:web:371d0ec1dce02b52db7108"
};

let firebaseConfig = null;

// Load Firebase config - uses hardcoded fallback for static deployments
async function loadFirebaseConfig() {
  if (firebaseConfig) {
    return firebaseConfig;
  }
  
  try {
    // Try to load from API first (for Replit with environment variables)
    const response = await fetch('/api/firebase-config');
    if (response.ok) {
      const config = await response.json();
      // Check if config has valid values (not undefined)
      if (config.apiKey && config.projectId) {
        firebaseConfig = config;
        console.log('Firebase config loaded successfully from API');
        return firebaseConfig;
      }
    }
    throw new Error('API config incomplete');
  } catch (error) {
    console.log('Using hardcoded Firebase config (static deployment)');
    // Use hardcoded fallback for static deployments (Vercel, Render, etc.)
    firebaseConfig = FIREBASE_CONFIG_FALLBACK;
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
      
      // CRITICAL: Set persistence to LOCAL to survive page reloads after redirect
      try {
        await setPersistence(auth, browserLocalPersistence);
        console.log('✅ Firebase persistence set to LOCAL');
      } catch (persistError) {
        console.warn('⚠️ Could not set persistence:', persistError.message);
      }
      
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

// CRITICAL FIX: Expose functions globally for non-module scripts
window.getAuthInstance = getAuthInstance;
window.getAppInstance = getAppInstance;
window.getFirestoreInstance = getFirestoreInstance;
window.getStorageInstance = getStorageInstance;
