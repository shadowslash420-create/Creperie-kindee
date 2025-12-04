
export default function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const vapidKey = process.env.FIREBASE_VAPID_KEY;
  
  if (!vapidKey) {
    console.error('❌ VAPID key not configured in environment variables');
    console.error('Please add FIREBASE_VAPID_KEY to Vercel environment variables');
    return res.status(500).json({ 
      error: 'VAPID key not configured',
      message: 'Please configure FIREBASE_VAPID_KEY in Vercel environment variables' 
    });
  }
  
  return res.status(200).json({ vapidKey });
}
