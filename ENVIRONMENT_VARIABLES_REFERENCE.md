# Environment Variables Reference

## 📋 Quick Copy-Paste for Railway (Backend)

```env
PORT=3001
NODE_ENV=production
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_NAME=${MYSQLDATABASE}
DB_PORT=${MYSQLPORT}
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YOUR_SECURE_PASSWORD_HERE
FRONTEND_URL=https://your-app.vercel.app
UPLOAD_DIR=/app/uploads/vendor-documents/

# Email Configuration (NEW!)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=ChillNet Admin <noreply@chillnet.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

**Note:** Replace `your-app.vercel.app` with your actual Vercel URL after deploying frontend.

---

## 📋 Quick Copy-Paste for Vercel (Frontend)

Add in Vercel Dashboard → Settings → Environment Variables:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://your-app-name.up.railway.app` |

**Note:** Replace `your-app-name.up.railway.app` with your actual Railway URL.

---

## 🔄 How They Connect

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Frontend (Vercel)                   Backend (Railway)  │
│  ─────────────────                   ────────────────  │
│                                                         │
│  REACT_APP_API_URL ──────────────────► Railway URL     │
│  = https://backend.railway.app                         │
│                                                         │
│  Vercel URL ◄──────────────────────── FRONTEND_URL     │
│                    = https://app.vercel.app            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Both must reference each other for CORS to work!**

---

## 📝 Deployment Order

1. **Deploy Backend to Railway first**
   - Get Railway URL
   - Configure all environment variables
   - Test: `https://your-backend.railway.app/db/health`

2. **Deploy Frontend to Vercel**
   - Set `REACT_APP_API_URL` = Railway URL
   - Deploy

3. **Update Railway**
   - Set `FRONTEND_URL` = Vercel URL
   - Railway auto-redeploys

4. **Test Everything**
   - Visit Vercel URL
   - Register as vendor with images
   - Check admin panel

---

## ⚠️ Common Mistakes

### ❌ Wrong
```env
# Missing https://
FRONTEND_URL=your-app.vercel.app

# Missing domain
REACT_APP_API_URL=https://

# Using localhost in production
REACT_APP_API_URL=http://localhost:3001
```

### ✅ Correct
```env
FRONTEND_URL=https://your-app.vercel.app
REACT_APP_API_URL=https://your-app-name.up.railway.app
```

---

## 🔍 How to Find Your URLs

### Railway URL
1. Railway Dashboard → Your Project
2. Settings → Domains
3. Click "Generate Domain"
4. Copy: `https://your-app-name.up.railway.app`

### Vercel URL
1. Vercel Dashboard → Your Project
2. Visit tab → View Production
3. Copy URL from browser: `https://your-app.vercel.app`

---

## 🧪 Testing Environment Variables

### Test Railway Variables
Visit your Railway URL in browser:
```
https://your-backend.railway.app/
```
Should show: "Hello from backend"

### Test Vercel Variables
1. Open browser console (F12)
2. In console, type:
```javascript
console.log(process.env.REACT_APP_API_URL)
```
Should show your Railway URL

---

## 🚨 Troubleshooting

### Images Not Loading
- ✅ Check `REACT_APP_API_URL` in Vercel
- ✅ Check `FRONTEND_URL` in Railway
- ✅ Both must be HTTPS
- ✅ Both must include `https://`

### CORS Errors
```
Access to fetch blocked by CORS policy
```
**Fix:**
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Include the protocol: `https://`
- Redeploy backend after changing

### Environment Variable Not Working
**Vercel:**
- Must start with `REACT_APP_`
- Must redeploy after adding
- Check: Settings → Environment Variables

**Railway:**
- Auto-redeploys when changed
- Check: Variables tab
- View logs to confirm

---

## 📱 Local Development Variables

### Backend (`.env` in backend folder)
```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=chillnet_db
DB_PORT=3306
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
FRONTEND_URL=http://localhost:3000
UPLOAD_DIR=uploads/vendor-documents/

# Email Configuration (NEW!)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=ChillNet Admin <noreply@chillnet.com>
ENABLE_EMAIL_NOTIFICATIONS=true
```

### Frontend (`.env` in frontend folder)
```env
REACT_APP_API_URL=http://localhost:3001
```

---

## 🌐 Network Testing Variables (Phone/Tablet)

### Frontend (`.env` in frontend folder)
```env
REACT_APP_API_URL=http://192.168.1.4:3001
```
Replace `192.168.1.4` with your computer's IP (find with `ipconfig`)

---

## ✅ Final Checklist

Before going live, verify:

- [ ] Railway `FRONTEND_URL` = Your Vercel URL with https://
- [ ] Vercel `REACT_APP_API_URL` = Your Railway URL with https://
- [ ] Railway volume mounted at `/app/uploads`
- [ ] Railway `UPLOAD_DIR` = `/app/uploads/vendor-documents/`
- [ ] Database variables configured in Railway
- [ ] Admin password is strong (not "admin123"!)
- [ ] Both apps deployed successfully
- [ ] Health check works: `https://backend.railway.app/db/health`
- [ ] Frontend loads: `https://app.vercel.app`
- [ ] Can register user
- [ ] Can upload images
- [ ] Images appear in admin panel
- [ ] Tested on mobile device

---

## 💾 Save These URLs

After deployment, save these for reference:

```
Backend (Railway): https://__________________________.up.railway.app
Frontend (Vercel): https://__________________________.vercel.app
Database Host:     __________________________
Admin Email:       __________________________
```

---

## 🆘 Need Help?

Check the detailed guides:
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Step-by-step deployment
- `DEPLOYMENT_SETUP_RAILWAY_VERCEL.md` - Complete overview
- `FIX_SUMMARY_NETWORK_IMAGES.md` - Technical details of the fix

---

**Remember:** Environment variables are the KEY to making images work across all devices! 🔑

