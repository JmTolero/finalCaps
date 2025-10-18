# Cloudinary Setup - FREE Image Storage Alternative

## 🎯 Why Cloudinary?

**Free Tier Benefits:**
- ✅ **25 GB storage** (enough for ~2,500 vendor documents)
- ✅ **25 GB bandwidth/month**
- ✅ **Automatic image optimization**
- ✅ **Image transformations** (resize, crop, etc.)
- ✅ **No disk needed on Render!**
- ✅ **Fast CDN delivery worldwide**
- ✅ **Free forever** (no credit card required)

---

## 📋 Setup Steps

### Step 1: Create Cloudinary Account (2 minutes)

1. Go to **https://cloudinary.com/users/register/free**
2. Sign up (free, no credit card needed)
3. Verify your email
4. You'll get your dashboard

### Step 2: Get Your Credentials

1. Go to Dashboard → Settings → Access Keys
2. Copy these 3 values:
   ```
   Cloud Name: your-cloud-name
   API Key: 123456789012345
   API Secret: abc123xyz456def789
   ```

### Step 3: Install Cloudinary in Backend

```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

### Step 4: Update Backend Code

#### Create Cloudinary Configuration File

Create `backend/src/config/cloudinary.js`:

```javascript
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

module.exports = cloudinary;
```

#### Update Vendor Controller

Update `backend/src/controller/vendor/vendorController.js`:

```javascript
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vendor-documents', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto', // Allows images and PDFs
    public_id: (req, file) => {
      // Generate unique filename
      return `${file.fieldname}-${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  }
});

// Your existing controller code continues...
// No other changes needed! Multer will now upload to Cloudinary automatically
```

### Step 5: Add Environment Variables

#### For Render (Production):
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123xyz456def789
```

#### For Local Development (.env):
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123xyz456def789
```

### Step 6: Update Database Storage

Cloudinary returns a URL for uploaded files. Update your database to store the full URL:

**No code changes needed!** Cloudinary automatically provides the URL in the same format:
```javascript
// Before (local storage):
req.files.valid_id[0].filename
// Returns: "valid-id-123456.jpg"

// After (Cloudinary):
req.files.valid_id[0].path
// Returns: "https://res.cloudinary.com/your-cloud/image/upload/v123/vendor-documents/valid-id-123456.jpg"
```

**Update your controller to use `.path` instead of `.filename`:**

```javascript
// In vendorController.js - Update these lines:

// OLD:
const validIdUrl = req.files?.valid_id ? req.files.valid_id[0].filename : null;
const businessPermitUrl = req.files?.business_permit ? req.files.business_permit[0].filename : null;
const proofImageUrl = req.files?.proof_image ? req.files.proof_image[0].filename : null;

// NEW:
const validIdUrl = req.files?.valid_id ? req.files.valid_id[0].path : null;
const businessPermitUrl = req.files?.business_permit ? req.files.business_permit[0].path : null;
const proofImageUrl = req.files?.proof_image ? req.files.proof_image[0].path : null;
```

### Step 7: Update Frontend

**No changes needed!** The frontend will automatically display images from Cloudinary URLs.

**Remove the API base URL prefix for document viewing:**

In `frontend/src/components/admin/VendorDetailView.jsx` and other admin files:

```javascript
// OLD (for local storage):
const imageUrl = `${apiBase}/uploads/vendor-documents/${documentUrl}`;

// NEW (for Cloudinary - URL is already complete):
const imageUrl = documentUrl; // Cloudinary provides full URL
```

### Step 8: Update app.js

**Remove or comment out the static file serving** (no longer needed):

```javascript
// backend/src/app.js

// OLD - Comment this out:
// app.use('/uploads', express.static('uploads'));

// NEW - Not needed! Cloudinary serves images directly
```

---

## ✅ Benefits of Cloudinary

### Before (Render Disk):
```
User uploads → Render saves to disk → Serves from /uploads/
- Need to add disk on Render
- Limited to disk size
- Slower delivery
```

### After (Cloudinary):
```
User uploads → Cloudinary saves → Serves from CDN
- No disk needed! ✅
- 25 GB free storage
- Fast CDN delivery worldwide
- Automatic image optimization
```

---

## 🧪 Testing

### Test Upload:
```
1. Register as vendor
2. Upload images
3. Check database - should see Cloudinary URLs:
   https://res.cloudinary.com/your-cloud/image/upload/v123/vendor-documents/file.jpg
4. Click image in admin panel - should load from Cloudinary
```

### Test After Redeploy:
```
1. Redeploy backend
2. Images still accessible ✅ (stored on Cloudinary, not server)
```

---

## 💰 Cost Comparison

| Storage | Free Tier | Paid Tier |
|---------|-----------|-----------|
| **Cloudinary** | 25 GB storage<br>25 GB bandwidth | Starts at $99/month |
| **Render Disk** | 1 GB (free) | $0.25/GB/month |
| **Supabase** | 1 GB storage<br>2 GB bandwidth | $25/month (pro) |
| **Vercel Blob** | 500 MB | Starts at $20/month |

**Winner: Cloudinary** 🏆 (25 GB free!)

---

## 🎨 Bonus: Image Transformations

Cloudinary automatically optimizes images. You can also add transformations:

```javascript
// In your frontend, add transformations to image URLs:

// Original:
https://res.cloudinary.com/your-cloud/image/upload/v123/file.jpg

// Resized to 300px width:
https://res.cloudinary.com/your-cloud/image/upload/w_300/v123/file.jpg

// Thumbnail (200x200):
https://res.cloudinary.com/your-cloud/image/upload/w_200,h_200,c_fill/v123/file.jpg

// Optimized quality:
https://res.cloudinary.com/your-cloud/image/upload/q_auto,f_auto/v123/file.jpg
```

**Add to your frontend components:**
```javascript
// Display optimized thumbnails in lists
const thumbnailUrl = documentUrl.replace('/upload/', '/upload/w_200,h_200,c_fill,q_auto/');

// Full size in modal
const fullUrl = documentUrl.replace('/upload/', '/upload/q_auto,f_auto/');
```

---

## 🔄 Migration from Local/Render to Cloudinary

If you already have images on Render disk:

### Option 1: Manual Migration (Simple)
```
1. Download images from Render
2. Upload to Cloudinary dashboard
3. Update database URLs
```

### Option 2: Automated Migration (Advanced)
```javascript
// Create migration script
const cloudinary = require('./config/cloudinary');
const pool = require('./db/config');
const fs = require('fs');
const path = require('path');

async function migrateToCloudinary() {
  // Get all vendors with local file paths
  const [vendors] = await pool.query('SELECT * FROM vendors WHERE valid_id_url IS NOT NULL');
  
  for (const vendor of vendors) {
    // Upload each file to Cloudinary
    const validIdPath = path.join(__dirname, '../uploads/vendor-documents/', vendor.valid_id_url);
    
    if (fs.existsSync(validIdPath)) {
      const result = await cloudinary.uploader.upload(validIdPath, {
        folder: 'vendor-documents',
        resource_type: 'auto'
      });
      
      // Update database with new URL
      await pool.query(
        'UPDATE vendors SET valid_id_url = ? WHERE vendor_id = ?',
        [result.secure_url, vendor.vendor_id]
      );
      
      console.log(`Migrated ${vendor.vendor_id}: ${result.secure_url}`);
    }
  }
}
```

---

## 📊 Database Schema Update

Your database columns stay the same! Just store full URLs:

```sql
-- Before (local storage):
valid_id_url: "valid-id-123456.jpg"

-- After (Cloudinary):
valid_id_url: "https://res.cloudinary.com/your-cloud/image/upload/v123/vendor-documents/valid-id-123456.jpg"
```

**Note:** You might want to increase column length:
```sql
ALTER TABLE vendors 
MODIFY COLUMN valid_id_url VARCHAR(500),
MODIFY COLUMN business_permit_url VARCHAR(500),
MODIFY COLUMN proof_image_url VARCHAR(500),
MODIFY COLUMN profile_image_url VARCHAR(500);
```

---

## ✅ Deployment Checklist with Cloudinary

### Backend Setup
- [ ] Install cloudinary packages: `npm install cloudinary multer-storage-cloudinary`
- [ ] Create `backend/src/config/cloudinary.js`
- [ ] Update `vendorController.js` to use CloudinaryStorage
- [ ] Update to use `.path` instead of `.filename`
- [ ] Add Cloudinary environment variables to Render
- [ ] Comment out static file serving in `app.js`
- [ ] Deploy to Render

### Frontend Update
- [ ] Update admin components to use direct URLs (no API base prefix)
- [ ] Test image display
- [ ] Deploy to Vercel

### Testing
- [ ] Upload new vendor documents
- [ ] Check Cloudinary dashboard (Media Library)
- [ ] Verify images display in admin panel
- [ ] Check database for Cloudinary URLs
- [ ] Redeploy backend, verify images still accessible

---

## 🆘 Troubleshooting

### Upload Fails
**Error:** `Cloudinary upload failed`

**Solutions:**
1. Check environment variables are set correctly
2. Verify API credentials in Cloudinary dashboard
3. Check file size (max 20 MB for free tier)
4. Check Cloudinary logs in dashboard

### Images Don't Display
**Error:** Images show broken link

**Solutions:**
1. Check database - URLs should start with `https://res.cloudinary.com/`
2. Verify you removed the API base URL prefix in frontend
3. Check Cloudinary Media Library - files should be there
4. Check browser console for CORS errors

### "Invalid credentials"
**Error:** Authentication failed

**Solutions:**
1. Double-check Cloud Name, API Key, API Secret
2. No spaces in environment variables
3. Restart Render service after adding variables

---

## 🎉 Summary

**With Cloudinary:**
- ✅ No Render Disk needed
- ✅ 25 GB free storage
- ✅ Fast CDN delivery
- ✅ Automatic optimization
- ✅ Easy to implement
- ✅ Professional solution

**Steps:**
1. Sign up for Cloudinary (free)
2. Install packages
3. Update backend code
4. Add environment variables
5. Update frontend (remove API prefix)
6. Deploy and test!

**Result:** Images stored in the cloud, no Render disk needed! 🎉

---

## 📚 Resources

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **Node.js SDK:** https://cloudinary.com/documentation/node_integration
- **Multer Storage:** https://www.npmjs.com/package/multer-storage-cloudinary
- **Free Tier:** https://cloudinary.com/pricing

---

**Ready to switch?** Cloudinary is the best free alternative to Render Disk! 🚀

