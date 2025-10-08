# 🚀 START HERE - Render + Railway DB + Vercel

## ✅ Your Stack

- **Backend:** Render
- **Database:** Railway MySQL
- **Frontend:** Vercel

All fixed and ready for deployment! 🎉

---

## 🎯 Deploy in 4 Steps

### Step 1️⃣: Railway Database (3 minutes)

1. Go to **https://railway.app**
2. New Project → Provision MySQL
3. Click MySQL service → **Variables** tab
4. **Copy all database credentials:**
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

### Step 2️⃣: Render Backend (5 minutes)

1. Go to **https://render.com/dashboard**
2. New + → Web Service → Connect GitHub
3. Configure:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `node src/server.js`
   
4. **Add Environment Variables:**
   ```env
   PORT=3001
   NODE_ENV=production
   DB_HOST=<from Railway>
   DB_PORT=<from Railway>
   DB_USER=<from Railway>
   DB_PASSWORD=<from Railway>
   DB_NAME=<from Railway>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_password
   FRONTEND_URL=https://your-app.vercel.app
   UPLOAD_DIR=/var/data/uploads/vendor-documents/
   ```

5. **Add Disk (IMPORTANT!):**
   - Scroll to "Disks"
   - Add Disk
   - Name: `uploads`
   - Mount Path: `/var/data`
   - Size: 1 GB

6. Click "Create Web Service"
7. **Copy Render URL** (like `https://your-backend.onrender.com`)

### Step 3️⃣: Vercel Frontend (3 minutes)

1. Go to **https://vercel.com**
2. New Project → Import from GitHub
3. Configure:
   - Root Directory: `frontend`
   
4. **Add Environment Variable:**
   - Name: `REACT_APP_API_URL`
   - Value: `https://your-backend.onrender.com` (from Step 2)

5. Deploy
6. **Copy Vercel URL**

### Step 4️⃣: Connect Them (1 minute)

1. Go back to **Render**
2. Your service → Environment
3. Update `FRONTEND_URL` with your Vercel URL
4. Click "Save Changes"
5. **Done!** 🎉

---

## 🧪 Test It

1. Visit your Vercel URL
2. Register as vendor
3. Upload images
4. Check admin panel
5. Images should appear ✅

---

## ⚠️ Important: The Disk!

**Without Disk:** Images deleted on every redeploy ❌
**With Disk:** Images saved forever ✅

**Render Disk Setup:**
```
Settings → Disks → Add Disk
Mount Path: /var/data
```

**This is different from Railway Volumes!**

---

## 🔑 Environment Variables

### Render Must Have:
```env
DB_HOST=<Railway database host>
DB_PORT=<Railway database port>
DB_USER=<Railway database user>
DB_PASSWORD=<Railway database password>
DB_NAME=<Railway database name>
FRONTEND_URL=https://your-app.vercel.app
UPLOAD_DIR=/var/data/uploads/vendor-documents/
```

### Vercel Must Have:
```env
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## 💰 Free Tier Notes

### Render
- ✅ Free forever
- ⚠️ Spins down after 15 min inactivity
- ⚠️ First request after sleep: 30-60 seconds
- 💡 **Tip:** Show "Loading..." message for first request

### Railway
- ✅ $5 credit/month
- ✅ Database always-on
- ✅ No cold starts

### Vercel
- ✅ Always-on
- ✅ Unlimited deployments

---

## 🐛 Common Issues

### Backend Won't Start
**Check Render logs for:**
- Database connection errors
- Missing environment variables
- Port conflicts

**Solution:** Verify Railway DB credentials are correct

### Images Not Persisting
**Problem:** Forgot to add Disk

**Solution:**
1. Render → Your service → Settings → Disks
2. Add Disk at `/var/data`
3. Redeploy

### CORS Error
**Problem:** `FRONTEND_URL` doesn't match Vercel URL

**Solution:**
1. Check exact match: `https://your-app.vercel.app`
2. Include `https://`
3. Save and redeploy

### Slow First Request
**Problem:** Render free tier cold start (normal)

**Solution:**
- Upgrade to paid ($7/month) for always-on
- Or accept 30-60s delay on first request

---

## ✅ Deployment Checklist

- [ ] Railway MySQL database created
- [ ] Database credentials copied
- [ ] Render backend deployed
- [ ] **Disk added at /var/data** ← Important!
- [ ] All environment variables set
- [ ] Render URL copied
- [ ] Vercel frontend deployed
- [ ] `REACT_APP_API_URL` set in Vercel
- [ ] `FRONTEND_URL` updated in Render
- [ ] Health check works
- [ ] Can upload images
- [ ] Images appear in admin panel
- [ ] Tested after redeploy (images persist)

---

## 📚 Need More Details?

**Read:** `RENDER_DEPLOYMENT_GUIDE.md` for complete step-by-step instructions

**Environment Variables:** See `ENVIRONMENT_VARIABLES_REFERENCE.md`

**Technical Details:** See `FIX_SUMMARY_NETWORK_IMAGES.md`

---

## 🎯 Your URLs After Deployment

**Backend (Render):** `https://_______________.onrender.com`

**Database (Railway):** `containers-us-west-___.railway.app:____`

**Frontend (Vercel):** `https://_______________.vercel.app`

---

## 🚀 You're Ready!

Everything is configured for Render + Railway DB + Vercel.

Just follow the 4 steps above and you'll be live! 🎉

**Important Note:** Don't forget Step 2 #5 - **Add the Disk!** This is what keeps your images safe.

---

## 💡 Pro Tips

1. **Test database first** - Use Railway's query tool to verify DB works
2. **Add disk immediately** - Don't wait until after testing uploads
3. **Monitor Render logs** - Watch for database connection issues
4. **Expect cold starts** - Free tier sleeps after 15 minutes (normal)
5. **Use strong passwords** - Change admin password from default

---

**Ready?** Start with Step 1 and deploy! 🚀

