export default function handler(req, res) {
  // Support both naming conventions (FIREBASE_APIKEY and FIREBASE_API_KEY)
  return res.status(200).json({
    apiKey: process.env.FIREBASE_API_KEY || process.env.FIREBASE_APIKEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  });
}
