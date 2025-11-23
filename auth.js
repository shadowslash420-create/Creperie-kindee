// Authentication Logic
import { getAuthInstance } from './firebase-config.js';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const provider = new GoogleAuthProvider();

// Sign in with Google
export async function signInWithGoogle() {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      throw new Error('Firebase authentication not initialized');
    }
    
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('User signed in:', user.displayName);
    return user;
  } catch (error) {
    console.error('Error signing in:', error.message);
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
    
    await signOut(auth);
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
          if (confirm(`مرحباً ${user.displayName}!\n\nهل تريد تسجيل الخروج؟`)) {
            signOutUser().then(() => {
              window.location.reload();
            });
          }
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

// Initialize auth UI when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthUI);
} else {
  initAuthUI();
}
