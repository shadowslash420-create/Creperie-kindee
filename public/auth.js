// Authentication Logic
import { getAuthInstance } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account'
});

// Check if in embedded webview
function isInWebview() {
  return window.self !== window.top;
}

// Get redirect result for webview
export async function getGoogleRedirectResult() {
  try {
    const auth = await getAuthInstance();
    if (!auth) return null;
    
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('✅ Google login successful:', result.user.email);
      return result;
    }
    return null;
  } catch (error) {
    console.error('Error getting redirect result:', error.code);
    return null;
  }
}

// Sign in with Google - uses best method for platform
export async function signInWithGoogle() {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    const inWebview = isInWebview();
    console.log('🔐 Google sign-in (webview:', inWebview, ')');
    
    if (inWebview) {
      // Webview: use redirect (popups don't work in embedded iframes)
      console.log('📤 Using redirect for webview');
      await signInWithRedirect(auth, provider);
    } else {
      // Desktop/external: try popup first
      try {
        console.log('🪟 Using popup for external page');
        const result = await signInWithPopup(auth, provider);
        console.log('✅ Popup login successful');
        return result.user;
      } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') {
          console.log('Popup closed, trying redirect instead');
          await signInWithRedirect(auth, provider);
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Google sign-in error:', error.code);
    alert('تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.');
    throw error;
  }
}

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
