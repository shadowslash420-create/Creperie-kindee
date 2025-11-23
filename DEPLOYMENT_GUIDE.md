# Deployment Guide for Creperie Kinder

## 🔥 Firebase Firestore Rules Deployment

### Important: You must deploy the updated Firestore security rules!

The Firestore rules have been updated to allow customers to query orders by phone number. To deploy these rules:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Firebase** (if not already done):
   ```bash
   firebase init firestore
   ```
   - Select your project: `creperie-kinder5`
   - Use existing `firestore.rules` file
   - Use existing `firestore.indexes.json` file (if any)

4. **Deploy Firestore Rules**:
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **Verify Deployment**:
   - Go to Firebase Console → Firestore Database → Rules
   - Confirm the rules show restricted read access (admin/delivery only) for orders collection
   - Phone lookups are now handled securely via server-side API endpoint

---

## 🚀 Vercel Deployment

### Environment Variables

Make sure these environment variables are set in Vercel (Project Settings → Environment Variables):

**Firebase credentials (REQUIRED for authentication):**
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

These credentials are served to the client through a secure serverless function at `/api/firebase-config` and are NOT exposed in your source code.

**Server-side Firebase Admin credentials (optional, for advanced features):**
- `FIREBASE_CLIENT_EMAIL` (from service account JSON)
- `FIREBASE_PRIVATE_KEY` (from service account JSON)

**Other:**
- `IMGBB_API_KEY` (optional, for image uploads)

#### How to get Firebase Admin credentials:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract these values from the JSON:
   - `FIREBASE_CLIENT_EMAIL`: The "client_email" field
   - `FIREBASE_PRIVATE_KEY`: The "private_key" field (keep the entire value including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)

### Deployment Steps

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your Git repository
   - Vercel will automatically detect the configuration

2. **Configure Build Settings**:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: `public`
   - Install Command: `npm install`

3. **Add Environment Variables** (CRITICAL for auth button to work):
   - Go to Project Settings → Environment Variables
   - Add all 6 Firebase credentials listed above:
     * FIREBASE_API_KEY
     * FIREBASE_AUTH_DOMAIN
     * FIREBASE_PROJECT_ID
     * FIREBASE_STORAGE_BUCKET
     * FIREBASE_MESSAGING_SENDER_ID
     * FIREBASE_APP_ID
   - Make sure to apply them to "Production", "Preview", and "Development" environments

4. **Deploy**:
   - Click "Deploy" (or redeploy if already deployed)
   - Vercel will build and deploy your application
   - The auth button will now work properly!

### Security Note

**Important:** Firebase API keys are designed to be public and can safely be exposed in client-side code. Firebase security is enforced through:
1. **Firestore Security Rules** (see section above for deployment)
2. **Firebase Authentication** (only authenticated users can access protected resources)
3. **API restrictions in Firebase Console** (limit which domains can use your API key)

The `/api/firebase-config` serverless function serves your Firebase config from environment variables, which is more secure than hardcoding them in your source code.

### Troubleshooting

If you see deployment errors:

1. **Check Environment Variables**: Ensure all Firebase credentials are set in Vercel
2. **Check Build Logs**: Look for any errors in the Vercel deployment logs
3. **Test API Routes**: Visit `https://your-domain.vercel.app/api/firebase-config` to verify API is working
4. **Check Firestore Rules**: Make sure you deployed the updated rules (see Firebase section above)
5. **Auth Button Not Working**: Verify all 6 Firebase environment variables are set in Vercel and redeploy

---

## ✅ Testing After Deployment

1. Visit your deployed site
2. Go to "My Orders" page (`/my-orders.html`)
3. Enter a phone number that has orders (e.g., `+213797086530`)
4. Click "Search" - orders should appear
5. If you see "permission-denied" error, you need to deploy the Firestore rules

