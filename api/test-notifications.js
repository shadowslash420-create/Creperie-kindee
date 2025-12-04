
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: 'Vercel',
    checks: {}
  };

  // Check VAPID key
  diagnostics.checks.vapidKey = {
    configured: !!process.env.FIREBASE_VAPID_KEY,
    length: process.env.FIREBASE_VAPID_KEY?.length || 0,
    preview: process.env.FIREBASE_VAPID_KEY?.substring(0, 20) + '...' || 'NOT SET'
  };

  // Check Firebase config
  diagnostics.checks.firebaseConfig = {
    apiKey: !!process.env.FIREBASE_API_KEY,
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    messagingSenderId: !!process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: !!process.env.FIREBASE_APP_ID
  };

  // Check Firebase Admin
  diagnostics.checks.firebaseAdmin = {
    projectId: !!process.env.FIREBASE_PROJECT_ID,
    clientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: !!process.env.FIREBASE_PRIVATE_KEY
  };

  // Overall status
  const allConfigured = 
    diagnostics.checks.vapidKey.configured &&
    diagnostics.checks.firebaseConfig.apiKey &&
    diagnostics.checks.firebaseAdmin.clientEmail;

  diagnostics.status = allConfigured ? 'ready' : 'missing_config';
  diagnostics.message = allConfigured 
    ? 'All notification services are configured' 
    : 'Some environment variables are missing';

  return res.status(200).json(diagnostics);
}
