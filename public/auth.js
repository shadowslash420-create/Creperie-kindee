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
  signOut as firebaseSignOut, // Alias to avoid naming conflict
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const provider = new GoogleAuthProvider();
// Force account selection dialog when signing in
provider.setCustomParameters({
  prompt: 'select_account'
});

// Check if in embedded webview/iframe
function isInWebview() {
  return window.self !== window.top;
}

// Get redirect result 
export async function getGoogleRedirectResult() {
  try {
    const auth = await getAuthInstance();
    if (!auth) return null;
    
    const result = await getRedirectResult(auth);
    if (result) {
      console.log('✅ Redirect result found:', result.user.email);
      return result;
    }
    return null;
  } catch (error) {
    console.error('Error getting redirect result:', error.code);
    return null;
  }
}

// Sign in with Google - auto-detects environment and uses appropriate method
export async function signInWithGoogle() {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      throw new Error('Firebase authentication not initialized');
    }

    const inWebview = isInWebview();
    console.log('🔐 Sign-in requested (webview:', inWebview, ')');
    
    if (inWebview) {
      // Use redirect for webview/embedded environments
      console.log('📤 Using redirect-based sign-in for webview...');
      await signInWithRedirect(auth, provider);
      // Page redirects to Google, no code runs after this
    } else {
      // Use popup for external websites
      console.log('🪟 Using popup-based sign-in for external website...');
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log('✅ User signed in with Google:', user.displayName, user.email);
      return user;
    }
  } catch (error) {
    console.error('Error signing in with Google:', error.message, error.code);
    
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('ℹ️ User closed the popup');
      return null;
    }
    
    alert('تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.\n' + error.message);
    throw error;
  }
}

// Sign in with Email/Password
export async function signInWithEmail(email, password) {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      throw new Error('Firebase authentication not initialized');
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    console.log('User signed in with email:', user.email);
    return user;
  } catch (error) {
    console.error('Error signing in with email:', error.message);
    throw error;
  }
}

// Sign up with Email/Password
export async function signUpWithEmail(email, password, displayName) {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      throw new Error('Firebase authentication not initialized');
    }

    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;

    // Update user profile with display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    console.log('User signed up with email:', user.email);
    return user;
  } catch (error) {
    console.error('Error signing up with email:', error.message);
    throw error;
  }
}

// Sign out
export async function signOutUser() {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      throw new Error('Firebase authentication not initialized');
    }

    await firebaseSignOut(auth); // Use the aliased function
    console.log('User signed out');
  } catch (error) {
    console.error('Error signing out:', error.message);
    throw error;
  }
}

// Listen to auth state changes
export async function onAuthChange(callback) {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      console.error('Firebase authentication not initialized');
      return () => {}; // Return empty unsubscribe function
    }

    return onAuthStateChanged(auth, callback);
  } catch (error) {
    console.error('Error setting up auth state listener:', error);
    return () => {}; // Return empty unsubscribe function
  }
}

// Update UI based on auth state (for all pages)
export async function initAuthUI() {
  const authBtn = document.getElementById('auth-btn');
  if (!authBtn) {
    console.warn('Auth button not found on this page');
    return;
  }

  try {
    await onAuthChange((user) => {
      if (user) {
        // User is signed in
        authBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
        authBtn.title = user.displayName || 'Profile';
        authBtn.onclick = () => {
          showLogoutConfirmation(user);
        };
      } else {
        // User is signed out
        authBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>`;
        authBtn.title = 'تسجيل الدخول';
        authBtn.onclick = () => {
          window.location.href = 'login.html';
        };
      }
    });
  } catch (error) {
    console.error('Failed to initialize auth UI:', error);
    // Set default state on error
    authBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>`;
    authBtn.title = 'تسجيل الدخول';
    authBtn.onclick = () => {
      window.location.href = 'login.html';
    };
  }
}

// Custom logout confirmation dialog
function showLogoutConfirmation(user) {
  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: fadeIn 0.3s ease;
  `;

  // Create modal content
  const modal = document.createElement('div');
  modal.style.cssText = `
    background: linear-gradient(180deg, #FFF5F5 0%, #FFE8E8 100%);
    border-radius: 24px;
    padding: 40px 32px;
    max-width: 420px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(227,6,19,0.3), 0 0 0 3px rgba(227,6,19,0.1);
    text-align: center;
    animation: slideUp 0.3s ease;
    border: 2px solid rgba(227,6,19,0.2);
  `;

  const userName = user.displayName || 'المستخدم';
  
  modal.innerHTML = `
    <div style="font-size: 64px; margin-bottom: 20px; filter: drop-shadow(0 4px 8px rgba(227,6,19,0.2));">
      👋
    </div>
    <h2 style="font-family: 'Playfair Display', serif; font-size: 28px; color: #2C1810; margin-bottom: 12px; font-weight: 700;">
      مرحباً ${userName}!
    </h2>
    <p style="color: #5C4033; font-size: 17px; margin-bottom: 32px; line-height: 1.6;">
      هل تريد تسجيل الخروج من حسابك؟
    </p>
    <div style="display: flex; gap: 12px; justify-content: center;">
      <button id="cancel-logout" style="
        flex: 1;
        padding: 16px 24px;
        background: #ffffff;
        border: 2px solid #E30613;
        border-radius: 12px;
        color: #E30613;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Cormorant Garamond', serif;
        box-shadow: 0 4px 12px rgba(227,6,19,0.15);
      ">
        إلغاء
      </button>
      <button id="confirm-logout" style="
        flex: 1;
        padding: 16px 24px;
        background: linear-gradient(135deg, #E30613 0%, #C10510 100%);
        border: 2px solid #E30613;
        border-radius: 12px;
        color: #ffffff;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: 'Cormorant Garamond', serif;
        box-shadow: 0 4px 12px rgba(227,6,19,0.3);
      ">
        تسجيل الخروج
      </button>
    </div>
  `;

  // Add animations
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Add hover effects
  const cancelBtn = modal.querySelector('#cancel-logout');
  const confirmBtn = modal.querySelector('#confirm-logout');

  cancelBtn.addEventListener('mouseenter', () => {
    cancelBtn.style.background = '#FFF5F5';
    cancelBtn.style.transform = 'translateY(-2px)';
    cancelBtn.style.boxShadow = '0 6px 16px rgba(227,6,19,0.2)';
  });

  cancelBtn.addEventListener('mouseleave', () => {
    cancelBtn.style.background = '#ffffff';
    cancelBtn.style.transform = 'translateY(0)';
    cancelBtn.style.boxShadow = '0 4px 12px rgba(227,6,19,0.15)';
  });

  confirmBtn.addEventListener('mouseenter', () => {
    confirmBtn.style.background = 'linear-gradient(135deg, #C10510 0%, #A00408 100%)';
    confirmBtn.style.transform = 'translateY(-2px)';
    confirmBtn.style.boxShadow = '0 6px 20px rgba(227,6,19,0.4)';
  });

  confirmBtn.addEventListener('mouseleave', () => {
    confirmBtn.style.background = 'linear-gradient(135deg, #E30613 0%, #C10510 100%)';
    confirmBtn.style.transform = 'translateY(0)';
    confirmBtn.style.boxShadow = '0 4px 12px rgba(227,6,19,0.3)';
  });

  // Handle cancel
  cancelBtn.onclick = () => {
    overlay.style.animation = 'fadeOut 0.2s ease';
    setTimeout(() => overlay.remove(), 200);
  };

  // Handle logout
  confirmBtn.onclick = () => {
    confirmBtn.textContent = 'جاري تسجيل الخروج...';
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.7';
    
    signOutUser().then(() => {
      window.location.reload();
    }).catch(() => {
      overlay.remove();
      alert('حدث خطأ أثناء تسجيل الخروج');
    });
  };

  // Close on overlay click
  overlay.onclick = (e) => {
    if (e.target === overlay) {
      overlay.style.animation = 'fadeOut 0.2s ease';
      setTimeout(() => overlay.remove(), 200);
    }
  };

  // Add fadeOut animation
  style.textContent += `
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
}

// Initialize auth UI when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
  initAuthUI();
}