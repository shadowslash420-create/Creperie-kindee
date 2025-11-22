# 🚀 Vercel Deployment Guide for Crêperie Kinder 5

## ✅ Pre-Deployment Checklist

Your project is now configured for Vercel deployment with:
- ✓ Static files in `public/` directory
- ✓ Serverless API functions in `api/` directory
- ✓ Proper CORS and caching headers configured
- ✓ Firebase and ImgBB integration ready

---

## 📋 Step-by-Step Deployment Instructions

### **Step 1: Install Vercel CLI (if not already installed)**

```bash
npm install -g vercel
```

Or use npx (no installation needed):
```bash
npx vercel
```

---

### **Step 2: Login to Vercel**

```bash
vercel login
```

This will open your browser to authenticate with Vercel using GitHub, GitLab, or email.

---

### **Step 3: Configure Environment Variables on Vercel**

**CRITICAL:** Your app needs these environment variables to work on Vercel:

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add the following secrets (use the same values from your Replit Secrets):

| Variable Name | Description | Where to Get It |
|---------------|-------------|-----------------|
| `FIREBASE_API_KEY` | Firebase API Key | Firebase Console → Project Settings → General |
| `FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Firebase Console → Project Settings → General |
| `FIREBASE_PROJECT_ID` | Firebase Project ID | Firebase Console → Project Settings → General |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Firebase Console → Project Settings → General |
| `FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Firebase Console → Project Settings → General |
| `FIREBASE_APP_ID` | Firebase App ID | Firebase Console → Project Settings → General |
| `IMGBB_API_KEY` | ImgBB API Key | Get free key at https://api.imgbb.com/ |

**Important:** Add these to **ALL environments** (Production, Preview, and Development)

---

### **Step 4: Deploy to Vercel**

#### **Option A: Deploy via CLI (Recommended for first-time)**

```bash
# Deploy to preview environment
npx vercel

# Deploy to production
npx vercel --prod
```

#### **Option B: Deploy via GitHub (Automated)**

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your repository
4. Vercel auto-detects settings from `vercel.json`
5. Add environment variables (Step 3)
6. Click "Deploy"

**Auto-deployments:** Every push to main branch = production deploy, every PR = preview deploy

---

### **Step 5: Verify Deployment**

After deployment, Vercel will give you a URL like:
```
https://creperie-kinder-abc123.vercel.app
```

**Test these endpoints:**

1. **Homepage:** `https://your-app.vercel.app/`
   - Should show the Crêperie Kinder landing page

2. **Firebase Config API:** `https://your-app.vercel.app/api/firebase-config`
   - Should return JSON with Firebase configuration
   - **If you see empty values**, environment variables aren't set!

3. **Image Upload API:** `https://your-app.vercel.app/api/upload-image`
   - Test by uploading an image through the admin dashboard

4. **Menu Items:**
   - Open browser console and check for Firebase connection
   - Items should load from Firestore

---

## 🔧 Troubleshooting

### **Issue: Items Not Showing on Vercel Site**

**Symptoms:** Homepage loads but menu items are empty

**Solution:**
1. Open browser console (F12)
2. Look for Firebase errors like "invalid-api-key"
3. Go to **Vercel Dashboard → Settings → Environment Variables**
4. Make sure ALL 7 environment variables are set
5. Redeploy: `npx vercel --prod`

**Test the API endpoint directly:**
```bash
curl https://your-app.vercel.app/api/firebase-config
```

Should return:
```json
{
  "apiKey": "AIzaSy...",
  "authDomain": "your-project.firebaseapp.com",
  "projectId": "your-project",
  ...
}
```

If values are empty (`""`), your environment variables aren't set correctly.

---

### **Issue: API Endpoints Return 404**

**Cause:** Serverless functions not deploying

**Solution:**
1. Verify `api/` folder exists with `firebase-config.js` and `upload-image.js`
2. Check `vercel.json` has correct configuration
3. Redeploy: `npx vercel --prod`

---

### **Issue: CORS Errors**

**Cause:** Missing CORS headers

**Solution:**
Your `vercel.json` already includes CORS headers. If you still see errors:
1. Clear browser cache
2. Check browser console for specific CORS error
3. Verify `vercel.json` is in root directory

---

### **Issue: Images Not Loading**

**Cause:** Images path incorrect or ImgBB key missing

**Solution:**
1. Verify `IMGBB_API_KEY` is set in Vercel environment variables
2. Check image URLs in Firestore point to ImgBB
3. Test upload through admin dashboard

---

## 🔄 Local Development

### **Option 1: Vercel Dev (Recommended - Tests Serverless Functions)**

```bash
npm run dev
# or
vercel dev
```

- Runs on `http://localhost:3000`
- Simulates Vercel serverless environment
- Uses your local `.env` file for secrets

**Create `.env` file:**
```env
FIREBASE_API_KEY=your-key-here
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-bucket
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
IMGBB_API_KEY=your-imgbb-key
```

### **Option 2: Simple HTTP Server (Faster for Frontend Only)**

```bash
npm run preview
# or
npx http-server public -p 5000 -c-1 --cors
```

- Runs on `http://localhost:5000`
- **Note:** API endpoints won't work (use Vercel dev for full testing)

---

## 📊 Monitoring & Analytics

### **View Deployment Logs:**
```bash
vercel logs [deployment-url]
```

### **View Function Logs:**
```bash
vercel logs [deployment-url] --follow
```

### **Access Vercel Dashboard:**
https://vercel.com/dashboard

**Dashboard Features:**
- Real-time deployment status
- Function execution logs
- Analytics and performance metrics
- Domain management
- Environment variable management

---

## 🌐 Custom Domain Setup

1. Go to **Vercel Dashboard → Your Project → Settings → Domains**
2. Add your custom domain (e.g., `creperie-kinder.com`)
3. Update DNS records as instructed:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Vercel handles SSL certificates automatically

---

## 💰 Pricing & Limits (Vercel Free Tier)

**Included Free:**
- ✅ 100 GB bandwidth/month
- ✅ 100 GB-hours serverless function execution
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments for every PR

**Your app's estimated usage:**
- ~1-2 GB bandwidth/month (small restaurant site)
- ~5 GB-hours functions/month (API calls)
- **Well within free tier limits!**

---

## 🚀 Production Deployment Checklist

Before deploying to production:

- [ ] All 7 environment variables set in Vercel
- [ ] Firebase Firestore rules configured for production
- [ ] Test menu items loading locally
- [ ] Test image upload functionality
- [ ] Test admin dashboard access
- [ ] Verify mobile responsiveness
- [ ] Test in multiple browsers (Chrome, Safari, Firefox)
- [ ] Check browser console for errors
- [ ] Run `npx vercel --prod`
- [ ] Test production URL
- [ ] Verify Firebase connection on production

---

## 📞 Support Resources

- **Vercel Documentation:** https://vercel.com/docs
- **Vercel Community:** https://github.com/vercel/vercel/discussions
- **Firebase Documentation:** https://firebase.google.com/docs
- **ImgBB API:** https://api.imgbb.com/

---

## 🎯 Quick Deploy Commands

```bash
# First-time deployment (preview)
npx vercel

# Deploy to production
npx vercel --prod

# Deploy with specific scope/team
npx vercel --scope=my-team --prod

# View logs
vercel logs [url]

# List all deployments
vercel ls

# Remove a deployment
vercel rm [deployment-name]
```

---

## ✨ Post-Deployment

After successful deployment:

1. ✅ **Test the live site** - Open Vercel URL and verify functionality
2. ✅ **Add menu items** - Use admin dashboard to populate your menu
3. ✅ **Upload images** - Add product images via ImgBB
4. ✅ **Share the URL** - Give your Vercel URL to customers
5. ✅ **Optional:** Set up custom domain for professional appearance

---

**Your Crêperie Kinder 5 website is now ready for the world!** 🎉

