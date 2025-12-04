
export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, userId } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // For now, just acknowledge receipt
    // In production, you'd save this to Firestore using Firebase Admin SDK
    console.log('📱 FCM token received:', token.substring(0, 20) + '...');
    console.log('👤 User ID:', userId || 'None');

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return res.status(500).json({ error: 'Failed to save token', message: error.message });
  }
}
