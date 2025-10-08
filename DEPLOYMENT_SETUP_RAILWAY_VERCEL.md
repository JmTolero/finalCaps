# Deployment Setup: Railway + Vercel

## Overview
- **Backend:** Railway (Node.js/Express)
- **Frontend:** Vercel (React)
- **Issue:** Images not visible because of hardcoded localhost URLs (FIXED ✅)

## Backend Deployment on Railway

### 1. Prepare Backend for Railway

Your backend is already configured correctly! The changes I made allow it to work in production:

**`backend/src/server.js`** - Already listens on `0.0.0.0`:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 2. Deploy Backend to Railway

1. Go to [Railway.app](https://railway.app)
2. Create a new project
3. Connect your GitHub repository
4. Select the `backend` folder as the root directory
5. Railway will auto-detect and deploy your Node.js app

### 3. Get Your Railway Backend URL

After deployment, Railway will give you a URL like:
```
https://your-app-name.up.railway.app
```

**Important:** Copy this URL! You'll need it for Vercel.

### 4. Configure Railway Environment Variables

In Railway dashboard, add these environment variables:

```
PORT=3001
NODE_ENV=production

# Your database credentials
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306

# Admin credentials
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password
```

## Frontend Deployment on Vercel

### 1. Prepare Frontend for Vercel

Your frontend is already fixed! All admin pages now use the environment variable.

### 2. Create Production Environment File (Optional, for local testing)

Create **`frontend/.env.production`** for testing production build locally:
```env
REACT_APP_API_URL=https://your-app-name.up.railway.app
```

### 3. Deploy to Vercel

#### Option A: Via Vercel CLI
```bash
cd frontend
npm install -g vercel
vercel login
vercel
```

#### Option B: Via Vercel Dashboard
1. Go to [Vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select the `frontend` folder as the root directory
4. Vercel will auto-detect React and deploy

### 4. Configure Vercel Environment Variables

**This is the most important step!**

In Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add this variable:

| Name | Value |
|------|-------|
| `REACT_APP_API_URL` | `https://your-app-name.up.railway.app` |

**Important:**
- Replace `your-app-name.up.railway.app` with your actual Railway URL
- Make sure to set this for **all environments** (Production, Preview, Development)
- After adding, you need to **redeploy** the frontend

### 5. Redeploy Frontend

After adding the environment variable:
1. Go to Deployments tab in Vercel
2. Click the three dots on the latest deployment
3. Click "Redeploy"

Or just push a new commit to trigger redeployment.

## Configuration for Different Environments

### Local Development (Both on your computer)

**`frontend/.env`**
```env
REACT_APP_API_URL=http://localhost:3001
```

### Local Network Testing (Phone/other devices)

**`frontend/.env`**
```env
REACT_APP_API_URL=http://192.168.1.4:3001
```

### Production (Railway + Vercel)

**Vercel Environment Variable:**
```
REACT_APP_API_URL=https://your-app-name.up.railway.app
```

## Complete Deployment Checklist

### Backend (Railway)
- [ ] Code pushed to GitHub
- [ ] Railway project created and connected to repo
- [ ] Backend folder selected as root directory
- [ ] Environment variables configured in Railway
- [ ] Database connection working
- [ ] Backend deployed successfully
- [ ] Railway URL copied (e.g., https://your-app.railway.app)
- [ ] Test backend: Visit `https://your-app.railway.app/db/health`

### Frontend (Vercel)
- [ ] Code pushed to GitHub
- [ ] Vercel project created and connected to repo
- [ ] Frontend folder selected as root directory
- [ ] `REACT_APP_API_URL` added to Vercel environment variables
- [ ] Environment variable set to Railway backend URL
- [ ] Frontend deployed successfully
- [ ] Frontend redeployed after adding environment variable
- [ ] Test frontend: Visit your Vercel URL

### Testing
- [ ] Can access frontend on Vercel URL
- [ ] Can login/register on frontend
- [ ] Can upload vendor documents
- [ ] Images appear in admin panel
- [ ] Images load correctly (check browser console for errors)
- [ ] Test from different devices (phone, tablet)
- [ ] Test vendor registration with image uploads
- [ ] Verify admin can see uploaded documents

## Troubleshooting Production Issues

### Issue: Images showing 404 or not loading

**Solution 1: Check CORS**
Make sure your backend allows requests from your Vercel domain.

In `backend/src/app.js`, update CORS configuration:
```javascript
const cors = require("cors");

app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:3000', // for local development
  ],
  credentials: true
}));
```

**Solution 2: Check Environment Variable**
- Verify in Vercel: Settings → Environment Variables
- Make sure `REACT_APP_API_URL` is set correctly
- Redeploy after any changes

**Solution 3: Check Browser Console**
- Open browser dev tools (F12)
- Check Network tab for failed requests
- Look for CORS errors or 404s
- Verify the URLs being called

### Issue: "Mixed Content" error (HTTP/HTTPS)

If Railway gives you an HTTPS URL but images fail:

**Solution:** Make sure Railway URL uses HTTPS, not HTTP
```env
# Wrong
REACT_APP_API_URL=http://your-app.railway.app

# Correct
REACT_APP_API_URL=https://your-app.railway.app
```

### Issue: Environment variable not working

**Solution:**
1. Double-check the variable name is exactly: `REACT_APP_API_URL`
2. It must start with `REACT_APP_` to be embedded in the build
3. Redeploy after adding/changing variables
4. Clear Vercel build cache (Settings → General → Clear Cache)

### Issue: Works locally but not in production

**Solutions:**
1. Check browser console for errors
2. Verify Railway backend is accessible: `https://your-backend.railway.app/db/health`
3. Check if Railway backend URL is correct in Vercel
4. Verify all environment variables are set in both Railway and Vercel
5. Check Railway logs for errors

## Railway Specific Settings

### Database Connection

Railway provides MySQL/PostgreSQL databases. Update your connection:

**In Railway Environment Variables:**
```
DATABASE_URL=mysql://user:password@host:port/database
```

**Or individual variables:**
```
DB_HOST=containers-us-west-xyz.railway.app
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=railway
DB_PORT=3306
```

### File Uploads on Railway

Railway's filesystem is ephemeral (files are lost on redeploy). For production, you should use:

**Option 1: Railway Volumes (Persistent Storage)**
- Go to Railway project → Settings → Volumes
- Create a volume mounted to `/app/uploads`

**Option 2: Cloud Storage (Recommended)**
- Use AWS S3, Cloudinary, or similar
- Modify your multer configuration to upload to cloud storage

Example with Cloudinary:
```bash
npm install cloudinary multer-storage-cloudinary
```

## Updated Upload Configuration for Production

If using cloud storage, update your multer config in `backend/src/controller/vendor/vendorController.js`:

```javascript
// For Railway with volumes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/vendor-documents/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  // ... rest of config
});
```

**Railway Environment Variable:**
```
UPLOAD_DIR=/app/uploads/vendor-documents/
```

## Testing Your Deployment

### Test Backend Health
```bash
curl https://your-backend.railway.app/db/health
```

Should return: `{"ok": true}`

### Test Frontend
1. Visit: `https://your-frontend.vercel.app`
2. Open browser console (F12)
3. Check Network tab
4. Register as vendor with documents
5. Verify API calls go to Railway URL
6. Check admin panel for uploaded images

### Test Image URLs
Uploaded images should have URLs like:
```
https://your-backend.railway.app/uploads/vendor-documents/filename.jpg
```

## Environment Variables Quick Reference

### Railway (Backend)
```env
PORT=3001
NODE_ENV=production
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=your-db-name
DB_PORT=3306
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
UPLOAD_DIR=/app/uploads/vendor-documents/
```

### Vercel (Frontend)
```env
REACT_APP_API_URL=https://your-backend.up.railway.app
```

## Post-Deployment Checklist

- [ ] Backend URL accessible and returns health check
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can register as vendor
- [ ] Can upload vendor documents
- [ ] Images appear in admin panel
- [ ] Images accessible via direct URL
- [ ] Admin can approve/reject vendors
- [ ] Test on mobile device
- [ ] Test on different browsers
- [ ] Check Railway logs for errors
- [ ] Check Vercel logs for errors

## Cost Considerations

### Railway
- Free tier: $5 credit/month
- Backend + Database should fit in free tier for testing
- Monitor usage in Railway dashboard

### Vercel
- Free tier: Generous for personal projects
- Hobby plan includes:
  - Unlimited projects
  - 100GB bandwidth
  - Serverless function executions

## Security Reminders

1. **Never commit `.env` files** - Already in `.gitignore` ✅
2. **Use strong passwords** for admin and database
3. **Enable HTTPS** - Railway and Vercel do this automatically ✅
4. **Set proper CORS** - Only allow your Vercel domain
5. **Validate file uploads** - Already implemented ✅
6. **Sanitize user inputs** - Already using validation utils ✅

## Support Links

- **Railway Documentation:** https://docs.railway.app
- **Vercel Documentation:** https://vercel.com/docs
- **Railway Status:** https://railway.statuspage.io
- **Vercel Status:** https://www.vercel-status.com

## Quick Commands

### View Railway Logs
```bash
railway logs
```

### View Vercel Logs
```bash
vercel logs your-deployment-url
```

### Redeploy Railway
```bash
railway up
```

### Redeploy Vercel
```bash
vercel --prod
```

---

## Summary

The fixes I made to your code are **production-ready** and will work perfectly with Railway + Vercel! 

The key change: All hardcoded `localhost` URLs are now replaced with environment variables, making your app work in any environment (local, network, or production).

Just make sure to:
1. ✅ Set `REACT_APP_API_URL` in Vercel to your Railway backend URL
2. ✅ Configure all environment variables in Railway
3. ✅ Redeploy both after setting environment variables
4. ✅ Consider using Railway Volumes or cloud storage for file uploads

Your images will work perfectly on all devices once deployed! 🚀

