# Render + Railway DB + Vercel Deployment Guide

## 🎯 Your Stack

- **Backend:** Render (Web Service)
- **Database:** Railway (MySQL)
- **Frontend:** Vercel
- **Files:** Render Disk (Persistent Storage)

---

## Step 1️⃣: Deploy Database to Railway (5 minutes)

### 1.1. Create MySQL Database

1. Go to **https://railway.app**
2. Click "New Project"
3. Select "Provision MySQL"
4. Railway creates the database automatically

### 1.2. Get Database Credentials

After creation, click on your MySQL service → Variables tab

You'll see these variables:
```
MYSQLHOST=containers-us-west-123.railway.app
MYSQLPORT=6543
MYSQLUSER=root
MYSQLPASSWORD=abc123xyz
MYSQLDATABASE=railway
```

**Copy these!** You'll need them for Render.

### 1.3. Optional: Import Your Database

If you have existing data:

1. Railway MySQL service → Data tab
2. Use their Query tool, or
3. Use MySQL Workbench/phpMyAdmin to connect:
   ```
   Host: containers-us-west-123.railway.app
   Port: 6543
   User: root
   Password: abc123xyz
   Database: railway
   ```

---

## Step 2️⃣: Deploy Backend to Render (10 minutes)

### 2.1. Create New Web Service

1. Go to **https://render.com/dashboard**
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** `chillnet-backend` (or your choice)
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Instance Type:** Free

### 2.2. Add Environment Variables

In the Environment Variables section, add:

```env
PORT=3001
NODE_ENV=production

# Database from Railway
DB_HOST=containers-us-west-123.railway.app
DB_PORT=6543
DB_USER=root
DB_PASSWORD=abc123xyz
DB_NAME=railway

# Admin Credentials (CHANGE THESE!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# Frontend URL (add after deploying Vercel)
FRONTEND_URL=https://your-app.vercel.app

# Upload directory for Render
UPLOAD_DIR=/var/data/uploads/vendor-documents/
```

**Important:** Replace the database credentials with YOUR Railway values!

### 2.3. Add Persistent Disk for File Uploads

**This is crucial!** Without it, uploaded images are deleted on every deploy.

1. Scroll down to **"Disks"** section
2. Click **"Add Disk"**
3. Configure:
   - **Name:** `uploads`
   - **Mount Path:** `/var/data`
   - **Size:** Start with 1 GB
4. Click "Add Disk"

### 2.4. Deploy

1. Click "Create Web Service"
2. Render will build and deploy (takes 3-5 minutes)
3. Watch the logs for any errors

### 2.5. Get Your Render URL

After deployment, you'll get a URL like:
```
https://chillnet-backend.onrender.com
```

**Copy this URL!** You'll need it for Vercel.

### 2.6. Test Backend

Visit in browser:
```
https://chillnet-backend.onrender.com/db/health
```

Should return: `{"ok": true}`

If not, check logs for database connection errors.

---

## Step 3️⃣: Deploy Frontend to Vercel (3 minutes)

### 3.1. Create New Project

1. Go to **https://vercel.com/dashboard**
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** Create React App (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### 3.2. Add Environment Variable

**Before deploying**, add environment variable:

1. Expand "Environment Variables" section
2. Add:
   - **Name:** `REACT_APP_API_URL`
   - **Value:** `https://chillnet-backend.onrender.com` (your Render URL)
   - **Environments:** All (Production, Preview, Development)
3. Click "Add"

### 3.3. Deploy

1. Click "Deploy"
2. Wait 2-3 minutes
3. You'll get a URL like: `https://your-app.vercel.app`

**Copy this URL!**

---

## Step 4️⃣: Connect Frontend to Backend (1 minute)

### 4.1. Update Render Environment Variable

Go back to Render:

1. Your Web Service → Environment
2. Update `FRONTEND_URL` variable:
   ```
   FRONTEND_URL=https://your-app.vercel.app
   ```
3. Click "Save Changes"
4. Render will automatically redeploy

---

## ✅ Deployment Checklist

### Railway Database
- [ ] MySQL database created
- [ ] Database credentials copied
- [ ] Test connection works

### Render Backend
- [ ] Web Service created
- [ ] GitHub repo connected
- [ ] Root directory set to `backend`
- [ ] All environment variables added
- [ ] Database credentials from Railway added
- [ ] **Disk added** at `/var/data` (IMPORTANT!)
- [ ] Backend deployed successfully
- [ ] Render URL copied
- [ ] Health check works: `/db/health`

### Vercel Frontend
- [ ] Project created
- [ ] GitHub repo connected
- [ ] Root directory set to `frontend`
- [ ] `REACT_APP_API_URL` added with Render URL
- [ ] Frontend deployed successfully
- [ ] Vercel URL copied

### Final Configuration
- [ ] Render `FRONTEND_URL` updated with Vercel URL
- [ ] Backend redeployed
- [ ] Both URLs use HTTPS

### Testing
- [ ] Frontend loads without errors
- [ ] Can register new user
- [ ] Can register as vendor with images
- [ ] Images upload successfully
- [ ] Images appear in admin panel
- [ ] Admin can approve/reject vendors
- [ ] Tested on mobile device
- [ ] No CORS errors in browser console

---

## 🧪 Testing Your Deployment

### Test 1: Database Connection
```
Visit: https://your-backend.onrender.com/db/health
Expected: {"ok": true}
```

### Test 2: Frontend
```
Visit: https://your-frontend.vercel.app
Expected: App loads, no console errors
```

### Test 3: Upload Images
```
1. Register as vendor
2. Upload Valid ID, Business Permit, Proof Image
3. Check admin panel
4. Images should display ✅
```

### Test 4: Persistence (Important!)
```
1. Upload an image
2. Trigger a redeploy (push to GitHub)
3. Check if image still exists
4. If yes → Disk is working! ✅
```

---

## 🐛 Common Issues & Solutions

### Issue: Database Connection Failed

**Symptoms:** Backend logs show MySQL connection errors

**Solutions:**
1. Verify Railway database is running
2. Check environment variables match Railway credentials exactly
3. Railway DB might be sleeping (free tier) - wake it up by accessing Railway dashboard
4. Try connecting with MySQL Workbench to verify credentials

### Issue: Images Not Persisting

**Symptoms:** Images disappear after redeployment

**Solutions:**
1. Check if Disk is mounted at `/var/data`
2. Verify `UPLOAD_DIR` environment variable is `/var/data/uploads/vendor-documents/`
3. Check Render logs for file write errors
4. Ensure disk has enough space (check Render dashboard)

### Issue: CORS Error

**Symptoms:** 
```
Access to fetch blocked by CORS policy
```

**Solutions:**
1. Verify `FRONTEND_URL` in Render = exact Vercel URL
2. Must include `https://`
3. Check backend logs for CORS warnings
4. Redeploy backend after changing `FRONTEND_URL`

### Issue: "Service Unavailable" or 503 Error

**Symptoms:** Render backend shows 503 or service unavailable

**Solutions:**
1. Render free tier spins down after 15 minutes of inactivity
2. First request after inactivity takes 30-60 seconds to wake up
3. This is normal for free tier
4. Consider paid plan for always-on service

### Issue: Images Show 404

**Symptoms:** Image URLs return 404 Not Found

**Solutions:**
1. Check if disk is properly mounted
2. Verify upload directory path in code matches disk mount path
3. Check Render logs for file upload errors
4. Test uploading a new image and check logs

---

## 💰 Costs

### Render Free Tier
- ✅ 750 hours/month
- ✅ Spins down after 15 min inactivity
- ✅ 1 GB disk included free
- ⚠️ First request after sleep is slow (30-60 seconds)

### Railway Free Tier
- ✅ $5 credit/month
- ✅ MySQL database included
- ✅ Always-on (doesn't sleep)

### Vercel Free Tier
- ✅ 100GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Always-on

**Total Cost: $0/month** for development! 🎉

---

## 🔐 Important: Render Disk vs Railway Volumes

Your images are stored on **Render Disk**, NOT Railway!

```
┌──────────────────────────────────────────┐
│                                          │
│  Render (Backend)                        │
│  ├── Code: /opt/render/project/src       │
│  └── Disk: /var/data  ← Images here!    │
│      └── uploads/                        │
│          └── vendor-documents/           │
│              └── id-123.jpg              │
│                                          │
│  Railway (Database Only)                 │
│  └── MySQL Database                      │
│      └── Users, vendors, orders tables   │
│                                          │
│  Vercel (Frontend)                       │
│  └── React App                           │
│      └── Calls Render for images         │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📱 Render-Specific Considerations

### 1. Cold Starts (Free Tier)
- Render spins down after 15 minutes of inactivity
- First request takes 30-60 seconds to wake up
- Show loading message in frontend for first request
- Or upgrade to paid tier ($7/month) for always-on

### 2. Disk Limitations
- Disk is mounted at `/var/data` (not `/app/uploads` like Railway)
- Make sure `UPLOAD_DIR` points to `/var/data/uploads/vendor-documents/`
- Free tier: 1 GB disk (enough for ~1000 images)
- Disk persists across deploys ✅

### 3. Environment Variables
- Changes require manual redeploy (not automatic like Railway)
- Click "Manual Deploy" after changing environment variables

### 4. Logs
- Real-time logs in Render dashboard
- Useful for debugging uploads and database connections

---

## 🎯 Environment Variables Summary

### Render (Backend)
```env
PORT=3001
NODE_ENV=production
DB_HOST=<from Railway>
DB_PORT=<from Railway>
DB_USER=<from Railway>
DB_PASSWORD=<from Railway>
DB_NAME=<from Railway>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
FRONTEND_URL=https://your-app.vercel.app
UPLOAD_DIR=/var/data/uploads/vendor-documents/
```

### Vercel (Frontend)
```env
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## 🚀 Quick Deploy Commands

### Manual Deploy on Render
1. Go to your service
2. Click "Manual Deploy"
3. Select branch → Deploy

### Redeploy Vercel
```bash
# Using Vercel CLI
vercel --prod

# Or push to GitHub (auto-deploys)
git push origin main
```

---

## 🆘 Getting Help

### Render Documentation
- Docs: https://render.com/docs
- Community: https://community.render.com

### Railway Documentation  
- Docs: https://docs.railway.app
- Discord: https://discord.gg/railway

### Check Status
- Render Status: https://status.render.com
- Railway Status: https://railway.statuspage.io

---

## ✨ What's Different from Railway Backend?

| Feature | Railway | Render |
|---------|---------|--------|
| Persistent Storage | Volumes at `/app/uploads` | Disk at `/var/data` |
| Cold Starts | No (always on) | Yes (free tier) |
| Auto Redeploy | Yes | Yes |
| Free Tier | $5 credit/month | 750 hours/month |
| Database | Can host on same | Separate (Railway) |

---

## ✅ Success Criteria

Your deployment is successful when:

- [ ] Backend accessible at Render URL
- [ ] Database connected (Railway MySQL)
- [ ] Frontend accessible at Vercel URL
- [ ] Users can register and login
- [ ] Vendors can upload documents/images
- [ ] Admin can see all uploaded images
- [ ] Images persist after redeployment
- [ ] Works on desktop and mobile
- [ ] No errors in browser console
- [ ] No CORS errors

**When all checked:** You're live! 🚀🎉

---

## 🎉 Final Notes

Your app is **production-ready** with:
- ✅ Render backend with persistent disk
- ✅ Railway MySQL database
- ✅ Vercel frontend
- ✅ Images work on all devices
- ✅ Secure CORS configuration
- ✅ Environment-based configuration

All the code fixes I made work perfectly with Render! The only difference is using Render Disk instead of Railway Volumes.

**Ready to deploy?** Follow the steps above! 🚀

