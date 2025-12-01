// Native Google Sign-In Authentication

export function handleGoogleSignIn(response) {
  if (response.credential) {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('✅ Google sign-in successful:', payload.email);
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
    // Make callback globally accessible
    window.handleGoogleSignInCallback = handleGoogleSignIn;
    
    // Load Google SDK
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
