# Vercel Deployment Guide

## Project Structure for Vercel

Your Creperie Kinder website has been restructured for optimal Vercel deployment:

```
creperie-kinder/
├── public/                    # Static files served by Vercel
│   ├── *.html                 # All HTML pages
│   ├── *.css                  # Stylesheets
│   ├── *.js                   # Frontend JavaScript
│   ├── *.md, *.txt, *.rules  # Documentation and configs
│   └── attached_assets/       # Images and media
├── api/                       # Vercel Serverless Functions
│   ├── firebase-config.js     # Returns Firebase configuration
│   └── upload-image.js        # Proxies image uploads to ImgBB
├── vercel.json               # Vercel configuration
├── package.json              # Dependencies and scripts
└── server.py                 # (Legacy - not used on Vercel)
```

## Key Changes from Replit Structure

1. **Static Files**: All HTML, CSS, JS moved to `public/` directory
2. **API Endpoints**: Python server converted to Node.js serverless functions
3. **Routing**: Vercel automatically serves files from `public/`
4. **Serverless Functions**: API routes in `/api` folder work as serverless endpoints

## How to Deploy to Vercel

### Prerequisites
- Vercel account (free at vercel.com)
- Vercel CLI installed (already in devDependencies)

### Step 1: Install Vercel CLI Globally (Optional)
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
npx vercel login
```

### Step 3: Configure Environment Variables
Before deploying, set your environment variables in Vercel:

Go to your Vercel project settings → Environment Variables and add:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `IMGBB_API_KEY`

### Step 4: Deploy

#### For First-Time Deployment:
```bash
npx vercel
```
Follow the prompts:
- Set up and deploy? **Yes**
- Which scope? Select your account
- Link to existing project? **No** (unless you already created one)
- What's your project's name? **creperie-kinder**
- In which directory is your code located? **./**

#### For Production Deployment:
```bash
npm run deploy
# or
npx vercel --prod
```

## Local Development with Vercel

### Option 1: Vercel Dev Server (Recommended for testing serverless functions)
```bash
npm run dev
# or
npx vercel dev
```
This runs your site with Vercel's local environment, including serverless functions.

### Option 2: Simple HTTP Server (Faster for frontend-only changes)
```bash
npm run preview
# or
npx http-server public -p 5000 -c-1 --cors
```
Note: API endpoints won't work with this method.

## Vercel Configuration (vercel.json)

The `vercel.json` file configures:
- **Output Directory**: `public/` is set as the root directory for static files
- **Headers**: CORS and cache-control settings for both API and static files
- **Clean URLs**: Removes `.html` extensions from URLs

**Important**: By setting `outputDirectory` to `public`, Vercel serves static files from that directory while automatically routing `/api/*` requests to serverless functions. No rewrites needed!

## API Endpoints

All API endpoints continue to work at the same paths:

- `GET /api/firebase-config` - Returns Firebase configuration
- `POST /api/upload-image` - Uploads images to ImgBB

## Firebase Integration

Your Firebase setup remains unchanged:
- Frontend fetches Firebase config from `/api/firebase-config`
- Firestore and Firebase Auth work client-side
- ImgBB uploads proxied through serverless function

## Troubleshooting

### Issue: API endpoints return 404
**Solution**: Make sure you've deployed with `vercel --prod` and environment variables are set

### Issue: Images not loading
**Solution**: Check that `attached_assets` folder is in `public/` directory

### Issue: Firebase not connecting
**Solution**: Verify all 6 Firebase environment variables are set in Vercel dashboard

### Issue: CORS errors
**Solution**: Vercel.json already includes CORS headers, ensure it's in root directory

## Monitoring and Logs

View deployment logs:
```bash
npx vercel logs [deployment-url]
```

Access Vercel dashboard: https://vercel.com/dashboard

## Automatic Deployments

### GitHub Integration
1. Push your code to GitHub
2. Import repository in Vercel dashboard
3. Vercel automatically deploys on every push to main branch

### Production vs Preview
- **Production**: Deploys from main branch
- **Preview**: Deploys from feature branches automatically

## Performance Optimizations

Vercel automatically provides:
- ✅ Global CDN distribution
- ✅ Automatic HTTPS
- ✅ Image optimization
- ✅ Serverless function edge caching
- ✅ Zero-config deployment

## Custom Domain

Add a custom domain in Vercel dashboard:
1. Go to Project Settings → Domains
2. Add your domain (e.g., creperie-kinder.com)
3. Update DNS records as instructed
4. Vercel handles SSL automatically

## Cost Considerations

**Free Tier Includes:**
- 100 GB bandwidth
- Unlimited projects
- Automatic HTTPS
- Serverless function executions (100 GB-hours)

For Creperie Kinder's current usage, the free tier should be sufficient.

## Migration Checklist

- [x] Static files moved to `public/`
- [x] Python server converted to Node.js serverless functions
- [x] `vercel.json` configuration created
- [x] Package.json updated with Vercel scripts
- [x] Environment variables documented
- [x] Deployment guide created
- [ ] Test locally with `vercel dev`
- [ ] Deploy to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Test production deployment

## Support

- Vercel Documentation: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions
- Firebase Documentation: https://firebase.google.com/docs
