# Environment Variables Template

Copy these placeholders and replace with your actual values in the Replit Secrets tab.

## Firebase Configuration (Required)
```
FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
FIREBASE_APP_ID=YOUR_APP_ID
```

## Firebase Admin (Optional - for server-side operations)
```
FIREBASE_ADMIN_SDK_KEY=YOUR_FIREBASE_ADMIN_KEY_JSON_HERE
```

## ImgBB API (Optional - for image uploads)
```
IMGBB_API_KEY=YOUR_IMGBB_API_KEY_HERE
```

## How to Get These Values:

### Firebase Keys:
1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Project Settings (gear icon)
4. Copy the config values from the "Your apps" section

### ImgBB API Key:
1. Go to ImgBB: https://imgbb.com/
2. Sign up for an account
3. Go to API: https://api.imgbb.com/
4. Copy your API key

## How to Add to Replit:
1. Click the "Secrets" tab in your Replit workspace
2. Add each key-value pair one by one
3. Values will be available as environment variables in your code
