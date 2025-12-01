// Native Google Sign-In Authentication
// This uses Google Identity Services SDK (works on all platforms)

export async function initializeGoogleSignIn(clientId) {
  return new Promise((resolve) => {
    // Load Google Sign-In SDK
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('✅ Google SDK loaded');
      
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignIn
        });
        console.log('✅ Google Sign-In initialized with ID:', clientId.substring(0, 20) + '...');
        resolve(true);
      } else {
        console.error('❌ Google SDK not properly loaded');
        resolve(false);
      }
    };
    script.onerror = () => {
      console.error('❌ Failed to load Google SDK');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

export function handleGoogleSignIn(response) {
  if (response.credential) {
    try {
      // Decode JWT token to extract user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('✅ Google sign-in successful:', payload.email);
      
      // Dispatch custom event with user data
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
  }
}

export function renderGoogleSignInButton(containerId, options = {}) {
  if (!window.google?.accounts?.id) {
    console.error('Google SDK not initialized');
    return false;
  }

  const defaultOptions = {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    width: '100%',
    locale: 'ar',
    ...options
  };

  try {
    window.google.accounts.id.renderButton(
      document.getElementById(containerId),
      defaultOptions
    );
    console.log('✅ Google Sign-In button rendered');
    return true;
  } catch (error) {
    console.error('Error rendering button:', error);
    return false;
  }
}

export function renderGoogleOneTapUI(options = {}) {
  if (!window.google?.accounts?.id) {
    console.error('Google SDK not initialized');
    return;
  }

  const defaultOptions = {
    automatic_logout: true,
    ...options
  };

  try {
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log('One Tap UI not displayed:', notification.getNotDisplayedReason());
      }
    });
  } catch (error) {
    console.error('Error displaying One Tap:', error);
  }
}

// Helper to get user info from stored credential
export function getUserInfoFromCredential(credential) {
  try {
    return JSON.parse(atob(credential.split('.')[1]));
  } catch (error) {
    console.error('Error decoding credential:', error);
    return null;
  }
}
