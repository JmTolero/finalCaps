# Render Disk vs Railway Volumes - Storage Guide

## 🗂️ What You Need to Know

Both Render and Railway have **ephemeral filesystems** by default. Uploaded files are **deleted on every deploy** unless you add persistent storage.

---

## 📊 Quick Comparison

| Feature | Render Disk | Railway Volume |
|---------|-------------|----------------|
| **Mount Path** | `/var/data` | `/app/uploads` |
| **Setup Location** | Settings → Disks | Settings → Volumes |
| **Free Tier** | 1 GB included | 1 GB included |
| **Environment Variable** | `UPLOAD_DIR=/var/data/uploads/vendor-documents/` | `UPLOAD_DIR=/app/uploads/vendor-documents/` |

---

## 🎯 Your Configuration (Render + Railway DB)

### What's Stored Where:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Render Backend                                         │
│  ────────────────                                       │
│  Code:   /opt/render/project/src/                       │
│  Disk:   /var/data/                   ← Images here!   │
│          └── uploads/                                   │
│              └── vendor-documents/                      │
│                  ├── valid-id-123.jpg                   │
│                  ├── permit-456.pdf                     │
│                  └── proof-789.jpg                      │
│                                                         │
│  Railway Database                                       │
│  ────────────────                                       │
│  MySQL:  Tables, Users, Data          ← Data here!     │
│          ├── users                                      │
│          ├── vendors                                    │
│          ├── orders                                     │
│          └── flavors                                    │
│                                                         │
│  Vercel Frontend                                        │
│  ────────────────                                       │
│  React App:  Calls Render for images                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 How to Add Render Disk

### Step-by-Step:

1. **Go to Render Dashboard**
2. **Click your backend service**
3. **Settings** tab
4. Scroll to **"Disks"** section
5. Click **"Add Disk"**

### Configure Disk:

```
Name:        uploads
Mount Path:  /var/data
Size:        1 GB (adjustable)
```

6. Click **"Add Disk"**
7. Render will restart your service

---

## ⚙️ Environment Variable Configuration

### For Render Deployment:

In your Render environment variables:
```env
UPLOAD_DIR=/var/data/uploads/vendor-documents/
```

### Your Code (Already Fixed ✅):

The multer configuration in your backend already uses the environment variable:

```javascript
// backend/src/controller/vendor/vendorController.js
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || 'uploads/vendor-documents/';
    // ...
  }
});
```

So it automatically adapts to:
- **Local development:** `uploads/vendor-documents/`
- **Render production:** `/var/data/uploads/vendor-documents/`

---

## 🧪 How to Verify It's Working

### Test 1: Upload an Image
```
1. Register as vendor
2. Upload documents
3. Check admin panel
Expected: Images display ✅
```

### Test 2: Redeploy (Important!)
```
1. Push a small change to GitHub
2. Render redeploys automatically
3. Check admin panel again
Expected: Images still there! ✅
```

If images persist → Disk is working! 🎉

---

## 📂 File Path Examples

### Image Upload URL (in browser):
```
https://your-backend.onrender.com/uploads/vendor-documents/valid-id-1234567890.jpg
```

### Actual Path on Render Server:
```
/var/data/uploads/vendor-documents/valid-id-1234567890.jpg
```

### How It Works:
```javascript
// In backend/src/app.js (already configured ✅)
app.use('/uploads', express.static('uploads'));

// When Render serves files, it reads from:
// /var/data/uploads/ -> served as /uploads/
```

---

## ⚠️ Common Mistakes

### ❌ Wrong: No Disk Added
```
Result: Images uploaded successfully
        → Redeploy
        → Images gone! ❌
```

### ✅ Correct: Disk Added
```
Result: Images uploaded successfully
        → Redeploy
        → Images still there! ✅
```

### ❌ Wrong: Forgot to Update UPLOAD_DIR
```env
# Wrong - using default path
UPLOAD_DIR=uploads/vendor-documents/

Result: Files saved to ephemeral storage ❌
```

### ✅ Correct: Using Disk Path
```env
# Correct - using disk mount path
UPLOAD_DIR=/var/data/uploads/vendor-documents/

Result: Files saved to persistent disk ✅
```

---

## 💾 Disk Size Planning

### How Many Images Can You Store?

Average image sizes:
- Valid ID (photo): ~2-5 MB
- Business Permit (PDF): ~1-3 MB
- Proof Image (photo): ~2-5 MB
- **Per vendor:** ~10 MB

With **1 GB disk:**
- Approximately **100 vendors** with documents
- Plus flavor images and other uploads

### When to Upgrade:

**Monitor disk usage in Render dashboard**

Signs you need more space:
- Upload errors
- "Disk full" in logs
- Reaching 80%+ capacity

**Upgrading is easy:**
1. Render → Your service → Settings → Disks
2. Click on your disk
3. Increase size
4. Click "Update"

---

## 🔄 Migration Notes

### If You Deployed Without Disk:

**Don't worry!** You can add it anytime:

1. Add disk (steps above)
2. Render restarts service
3. Previous uploads are lost (if any)
4. New uploads will persist ✅

**Best practice:** Add disk BEFORE testing uploads!

---

## 💰 Cost

### Render Disk Pricing:
- **Free tier:** 1 GB included ✅
- **Additional storage:** $0.25/GB/month
- **Example:** 5 GB disk = $1/month

### Railway Database:
- **Free tier:** $5 credit/month
- Database uses minimal storage
- Should stay within free tier for small apps

**Total:** Can stay in free tier! 🎉

---

## 🆘 Troubleshooting

### Images Not Persisting After Redeploy

**Possible causes:**
1. ❌ Disk not added
2. ❌ Wrong mount path
3. ❌ `UPLOAD_DIR` not updated

**Solutions:**
```bash
# Check Render dashboard
Settings → Disks → Should see disk at /var/data

# Check environment variables
UPLOAD_DIR=/var/data/uploads/vendor-documents/

# Check Render logs after upload
Should see: "File uploaded to /var/data/uploads/..."
```

### Upload Fails with "ENOENT" Error

**Problem:** Directory doesn't exist

**Solution:** Your code creates it automatically:
```javascript
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
```

But if it fails, check:
1. Disk is mounted
2. Permissions are correct (Render handles this)
3. Path is correct in `UPLOAD_DIR`

### Can't See Disk in Settings

**Problem:** Using wrong Render plan

**Solution:**
- Disks only available for Web Services (not Static Sites)
- You should have "Web Service" selected ✅
- If not, recreate as Web Service

---

## ✅ Checklist for Render Storage

- [ ] Backend deployed as "Web Service" (not Static Site)
- [ ] Disk added in Settings → Disks
- [ ] Mount path is `/var/data`
- [ ] Environment variable `UPLOAD_DIR=/var/data/uploads/vendor-documents/`
- [ ] Test upload works
- [ ] Test redeploy (images persist)
- [ ] Monitor disk usage in dashboard

---

## 🎯 Summary

**For Render + Railway DB + Vercel:**

1. **Files (images)** → Render Disk at `/var/data`
2. **Data (database)** → Railway MySQL
3. **Frontend** → Vercel (no storage needed)

**Key environment variable:**
```env
UPLOAD_DIR=/var/data/uploads/vendor-documents/
```

**Don't forget:** Add the disk BEFORE testing uploads!

---

## 📚 Related Guides

- **START_HERE_RENDER.md** - Quick deployment guide
- **RENDER_DEPLOYMENT_GUIDE.md** - Complete step-by-step
- **ENVIRONMENT_VARIABLES_REFERENCE.md** - All variables

---

Your backend code is already configured to work with Render disks! ✅

Just add the disk and set the environment variable, and everything works perfectly! 🎉

