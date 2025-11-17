// Firebase Configuration - uses environment variables for security
// Get your Firebase config from: https://console.firebase.google.com/

const firebaseConfig = {
  apiKey: window.FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: window.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: window.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: window.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: window.FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: window.FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
