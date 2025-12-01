// Authentication Logic - Firebase + Native Google Sign-In

import { getAuthInstance } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ===== FIREBASE AUTHENTICATION FUNCTIONS =====

export async function signInWithEmail(email, password) {
  try {
    const auth = await getAuthInstance();
    if (!auth) throw new Error('Firebase auth not initialized');
    const result = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Email login successful');
    return result.user;
  } catch (error) {
    console.error('Email login error:', error.message);
    throw error;
  }
}

export async function signUpWithEmail(email, password, displayName) {
  try {
    const auth = await getAuthInstance();
    if (!auth) throw new Error('Firebase auth not initialized');
    const result = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    console.log('✅ Signup successful');
    return result.user;
  } catch (error) {
    console.error('Signup error:', error.message);
    throw error;
  }
}

export async function signOutUser() {
  try {
    const auth = await getAuthInstance();
    if (!auth) throw new Error('Firebase auth not initialized');
    await firebaseSignOut(auth);
    console.log('✅ Logged out');
  } catch (error) {
    console.error('Logout error:', error.message);
    throw error;
  }
}

export async function onAuthChange(callback) {
  try {
    const auth = await getAuthInstance();
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error('Auth listener error:', error);
    return () => {};
  }
}

export async function initAuthUI() {
  const authBtn = document.getElementById('auth-btn');
  if (!authBtn) {
    console.warn('Auth button not found');
    return;
  }

  try {
    await onAuthChange((user) => {
      if (user) {
        authBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        authBtn.title = user.displayName || 'Profile';
        authBtn.onclick = () => showLogoutConfirmation(user);
      } else {
        authBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>`;
        authBtn.title = 'تسجيل الدخول';
        authBtn.onclick = () => window.location.href = 'login.html';
      }
    });
  } catch (error) {
    console.error('Auth UI init error:', error);
  }
}

function showLogoutConfirmation(user) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;`;
  
  const modal = document.createElement('div');
  modal.style.cssText = `background:linear-gradient(180deg,#FFF5F5,#FFE8E8);border-radius:24px;padding:40px 32px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(227,6,19,0.3);text-align:center;border:2px solid rgba(227,6,19,0.2);`;
  
  modal.innerHTML = `
    <div style="font-size:64px;margin-bottom:20px;">👋</div>
    <h2 style="font-family:Playfair Display,serif;font-size:28px;color:#2C1810;margin-bottom:12px;">مرحباً ${user.displayName || 'المستخدم'}!</h2>
    <p style="color:#5C4033;font-size:17px;margin-bottom:32px;">هل تريد تسجيل الخروج؟</p>
    <div style="display:flex;gap:12px;">
      <button id="cancel-logout" style="flex:1;padding:16px 24px;background:#fff;border:2px solid #E30613;border-radius:12px;color:#E30613;font-size:16px;font-weight:700;cursor:pointer;">إلغاء</button>
      <button id="confirm-logout" style="flex:1;padding:16px 24px;background:linear-gradient(135deg,#E30613,#C10510);border:none;border-radius:12px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;">تسجيل الخروج</button>
    </div>
  `;
  
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  modal.querySelector('#cancel-logout').onclick = () => overlay.remove();
  modal.querySelector('#confirm-logout').onclick = async () => {
    await signOutUser();
    window.location.reload();
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
  initAuthUI();
}

// ===== NATIVE GOOGLE SIGN-IN FUNCTIONS =====

export async function handleGoogleSignIn(response) {
  if (response.credential) {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('✅ Google sign-in successful:', payload.email);
      
      // Sign in with Firebase using the Google credential
      try {
        const credential = GoogleAuthProvider.credential(null, response.credential);
        const auth = await getAuthInstance();
        const userCredential = await signInWithCredential(auth, credential);
        console.log('✅ Firebase authentication successful:', userCredential.user.email);
      } catch (firebaseError) {
        console.warn('Firebase sign-in error (non-critical):', firebaseError.message);
      }
      
      window.dispatchEvent(new CustomEvent('google-signin-success', {
        detail: {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          credential: response.credential
        }
      }));
    } catch (error) {
      console.error('Error decoding JWT:', error);
      alert('تعذر معالجة تسجيل الدخول');
    }
  } else {
    console.error('No credential in response');
  }
}

export async function initializeGoogleSignIn(clientId) {
  return new Promise((resolve) => {
    window.handleGoogleSignInCallback = handleGoogleSignIn;
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google SDK script loaded');
      
      try {
        if (!window.google?.accounts?.id) {
          console.error('❌ window.google.accounts.id not available');
          resolve(false);
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: window.handleGoogleSignInCallback,
          auto_select: false
        });
        
        console.log('✅ Google SDK initialized');
        resolve(true);
      } catch (error) {
        console.error('❌ Error during initialization:', error);
        resolve(false);
      }
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google SDK script');
      resolve(false);
    };
    
    document.head.appendChild(script);
  });
}

export function renderGoogleSignInButton(containerId, options = {}) {
  if (!window.google?.accounts?.id) {
    console.error('❌ Google SDK not initialized');
    return false;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    console.error('❌ Button container not found:', containerId);
    return false;
  }

  const defaultOptions = {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    ...options
  };

  try {
    window.google.accounts.id.renderButton(container, defaultOptions);
    console.log('✅ Google Sign-In button rendered');
    return true;
  } catch (error) {
    console.error('❌ Error rendering button:', error);
    return false;
  }
}

export function getUserInfoFromCredential(credential) {
  try {
    return JSON.parse(atob(credential.split('.')[1]));
  } catch (error) {
    console.error('Error decoding credential:', error);
    return null;
  }
}
