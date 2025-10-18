# Railway Deployment Guide - Step by Step

## Prerequisites
- GitHub account with your code pushed
- Railway account (sign up at https://railway.app)
- Database ready (MySQL on Railway or external)

## Step 1: Deploy Backend to Railway

### 1.1. Create New Project
1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Choose "Deploy from GitHub repo"
4. Select your repository
5. Railway will detect Node.js automatically

### 1.2. Configure Build Settings
1. Go to project Settings
2. Under "Root Directory", enter: `backend`
3. Under "Build Command", it should auto-detect: `npm install`
4. Under "Start Command", it should be: `node src/server.js`

### 1.3. Add Environment Variables

Go to your project → Variables tab and add:

```
PORT=3001
NODE_ENV=production

# Database (if using Railway MySQL)
# Railway will provide these automatically if you add MySQL plugin
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
DB_PORT=${MYSQLPORT}

# Or if using external database, add your own values:
# DB_HOST=your-db-host.com
# DB_USER=your-db-user
# DB_PASSWORD=your-db-password
# DB_NAME=chillnet_db
# DB_PORT=3306

# Admin Credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here

# Frontend URL (Your Vercel URL - add this after deploying frontend)
FRONTEND_URL=https://your-app.vercel.app

# Upload directory for Railway
UPLOAD_DIR=/app/uploads/vendor-documents/
```

### 1.4. Add MySQL Database (if needed)

1. In your Railway project, click "New" → "Database" → "Add MySQL"
2. Railway will automatically create and link the database
3. The database environment variables will be available as `MYSQLHOST`, `MYSQLUSER`, etc.
4. Reference them in your variables as shown above

### 1.5. Add Storage Volume for File Uploads

**Important:** Railway's filesystem is ephemeral. Files are deleted on redeployment.

To persist uploaded files:
1. Go to your service → Settings → Volumes
2. Click "Add Volume"
3. Mount Path: `/app/uploads`
4. Size: Start with 1GB (adjust as needed)
5. Click "Add Volume"

### 1.6. Deploy

1. Railway should auto-deploy after pushing to GitHub
2. Or click "Deploy" button manually
3. Wait for deployment to complete (watch the logs)

### 1.7. Get Your Railway URL

1. Go to Settings → Domains
2. Click "Generate Domain"
3. You'll get a URL like: `https://your-app-name.up.railway.app`
4. **Copy this URL** - you'll need it for Vercel!

### 1.8. Test Backend

Visit in browser:
```
https://your-app-name.up.railway.app/db/health
```

Should return: `{"ok": true}`

## Step 2: Deploy Frontend to Vercel

### 2.1. Prepare Frontend

Make sure your frontend code is pushed to GitHub.

### 2.2. Import to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Create React App (auto-detected)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build` (auto-detected)

### 2.3. Add Environment Variable

**Before deploying**, add environment variable:

1. Expand "Environment Variables" section
2. Add:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://your-app-name.up.railway.app` (your Railway URL)
   - **Environments:** Select all (Production, Preview, Development)
3. Click "Add"

### 2.4. Deploy

1. Click "Deploy"
2. Wait for deployment (2-3 minutes)
3. Vercel will give you a URL like: `https://your-app.vercel.app`

### 2.5. Update Railway FRONTEND_URL

**Important:** Go back to Railway and update the `FRONTEND_URL` variable with your Vercel URL:

1. Railway Dashboard → Your Project → Variables
2. Edit `FRONTEND_URL` to: `https://your-app.vercel.app`
3. Railway will automatically redeploy

## Step 3: Test Everything

### 3.1. Test Frontend
1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Should load without errors
3. Open browser console (F12) - check for errors

### 3.2. Test Registration
1. Register a new user
2. If successful, backend connection works! ✅

### 3.3. Test Vendor Registration with Images
1. Go to "Become a Vendor"
2. Upload Valid ID, Business Permit, Proof Image
3. Submit application
4. Check browser Network tab - uploads should go to Railway URL

### 3.4. Test Admin Panel
1. Login as admin
2. Go to Vendor Approval
3. Click on pending vendor
4. Images should display correctly ✅

### 3.5. Test from Mobile
1. Open Vercel URL on phone
2. Register as vendor with images
3. Check if images appear on admin panel
4. If yes, CORS is working correctly! ✅

## Step 4: Monitor and Maintain

### Railway Monitoring
- **Logs:** Railway Dashboard → Your Service → Logs
- **Metrics:** Check CPU, Memory, Network usage
- **Deployments:** View deployment history and status

### Vercel Monitoring
- **Deployments:** Vercel Dashboard → Deployments
- **Analytics:** Check page views and performance
- **Functions:** Monitor serverless function execution

## Troubleshooting

### Images Not Loading

**1. Check Network Tab (F12)**
- Look at failed requests
- Check if image URLs are correct
- Should be: `https://your-backend.railway.app/uploads/...`

**2. Check Railway Logs**
```
Railway Dashboard → Your Service → View Logs
```
Look for:
- File upload errors
- Permission errors
- CORS errors

**3. Check CORS**
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Include protocol: `https://your-app.vercel.app` (not `your-app.vercel.app`)

**4. Check Volume Mount**
- Ensure volume is mounted at `/app/uploads`
- Verify `UPLOAD_DIR` environment variable is set

### Database Connection Issues

**Check Railway Variables:**
```bash
# In Railway logs, you should see connection attempt
# If it fails, verify these are set correctly:
DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
```

**Test Database Connection:**
Add this to your backend temporarily:
```javascript
pool.query('SELECT 1 AS test', (err, results) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Database connected successfully:', results);
  }
});
```

### CORS Errors

**Symptoms:**
- "Access to fetch blocked by CORS policy"
- "No 'Access-Control-Allow-Origin' header"

**Solutions:**
1. Verify `FRONTEND_URL` in Railway is correct
2. Check backend CORS configuration in `app.js`
3. Ensure you redeployed backend after adding `FRONTEND_URL`
4. Check Railway logs for CORS warning messages

### Environment Variables Not Working

**In Vercel:**
- Variables must start with `REACT_APP_`
- Must redeploy after adding/changing variables
- Check: Settings → Environment Variables

**In Railway:**
- Changes trigger automatic redeploy
- Check: Variables tab
- View logs to confirm variables are loaded

## Production Checklist

- [ ] Backend deployed to Railway successfully
- [ ] Database connected (test with health endpoint)
- [ ] Railway domain generated and copied
- [ ] Frontend deployed to Vercel successfully
- [ ] `REACT_APP_API_URL` set in Vercel
- [ ] `FRONTEND_URL` set in Railway (Vercel URL)
- [ ] Volume mounted for file uploads
- [ ] All environment variables configured
- [ ] Test: User registration works
- [ ] Test: Vendor registration with images works
- [ ] Test: Images display in admin panel
- [ ] Test: Admin can approve/reject vendors
- [ ] Test: Works on mobile devices
- [ ] Logs checked for errors
- [ ] CORS working correctly
- [ ] Strong admin password set

## Useful Commands

### Railway CLI (Optional)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Add variable
railway variables set KEY=VALUE

# Deploy manually
railway up
```

### Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod

# View logs
vercel logs your-deployment-url

# Add environment variable
vercel env add REACT_APP_API_URL production
```

## Costs

### Railway Free Tier
- $5 credit per month
- Should be sufficient for small projects
- Monitor usage in dashboard

### Vercel Free Tier
- Generous limits for personal projects
- 100GB bandwidth/month
- Unlimited deployments

### Upgrade Options
If you exceed free tier:
- Railway: Starts at $5/month for more resources
- Vercel: Pro plan at $20/month

## Security Best Practices

1. **Never commit `.env` files** ✅ (already in .gitignore)
2. **Use strong passwords** for admin and database
3. **Keep dependencies updated:** `npm audit fix`
4. **Monitor logs** for suspicious activity
5. **Set up database backups** (Railway provides automatic backups)
6. **Use environment variables** for all secrets ✅
7. **Configure CORS properly** ✅ (done)
8. **Validate all user inputs** ✅ (already implemented)

## Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Vercel Docs:** https://vercel.com/docs
- **Vercel Support:** https://vercel.com/support

---

## Quick Reference

**Railway Backend URL:** `https://your-app-name.up.railway.app`
**Vercel Frontend URL:** `https://your-app.vercel.app`

**Environment Variables:**
- Railway: `FRONTEND_URL` = Vercel URL
- Vercel: `REACT_APP_API_URL` = Railway URL

**Important:** Both must reference each other for CORS to work!

---

Your app is now deployed and ready to use! 🚀

All the fixes we made ensure images work perfectly in production. The environment variable approach means your app works seamlessly in any environment.

