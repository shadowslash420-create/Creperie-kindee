
export default function handler(req, res) {
  const vapidKey = process.env.FIREBASE_VAPID_KEY;
  
  if (!vapidKey) {
    console.error('❌ VAPID key not configured in environment variables');
    return res.status(404).json({ error: 'VAPID key not configured' });
  }
  
  return res.status(200).json({ vapidKey });
}
