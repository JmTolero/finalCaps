const express = require('express');
const passport = require('passport');
const router = express.Router();
const vendorGoogleAuthController = require('../../controller/vendor/vendorGoogleAuthController');
const multer = require('multer');
const path = require('path');
const cloudinary = require('../../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'vendor-documents', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    resource_type: 'auto', // Allows images and PDFs
    public_id: (req, file) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `${file.fieldname}-${uniqueSuffix}`;
    }
  }
});

const fileFilter = (req, file, cb) => {
  console.log('[Cloudinary Upload] Field name:', file.fieldname);
  console.log('[Cloudinary Upload] Original name:', file.originalname);
  console.log('[Cloudinary Upload] MIME type:', file.mimetype);
  
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  console.log('[Cloudinary Upload] Extension check:', extname);
  console.log('[Cloudinary Upload] MIME type check:', mimetype);
  
  if (mimetype && extname) {
    console.log('[Cloudinary Upload] File accepted ✅');
    return cb(null, true);
  } else {
    console.log('[Cloudinary Upload] File rejected ❌');
    cb(new Error('Only images and PDF files are allowed'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: fileFilter
});

// Vendor Google OAuth routes
router.get(
    '/google',
    passport.authenticate('vendor-google', {
        scope: ['profile', 'email'],
        prompt: 'select_account',
        session: false
    })
);

router.get('/google/callback',
    (req, res, next) => {
        passport.authenticate('vendor-google', { session: false }, (err, user, info) => {
            if (err) {
                console.error('Vendor Google OAuth error:', err);
                return res.redirect(`/api/vendor/auth/google/failure?error=${encodeURIComponent(err.message || 'Authentication failed')}`);
            }
            if (!user) {
                const errorMsg = info?.message || 'User is already registered as a vendor';
                console.log('Vendor Google OAuth failed:', errorMsg);
                return res.redirect(`/api/vendor/auth/google/failure?error=${encodeURIComponent(errorMsg)}`);
            }
            req.user = user;
            next();
        })(req, res, next);
    },
    vendorGoogleAuthController.vendorGoogleAuthSuccess
);

router.get('/google/failure', vendorGoogleAuthController.vendorGoogleAuthFailure);

// Complete vendor registration with documents
router.post('/complete-registration', 
    upload.fields([
        { name: 'valid_id', maxCount: 1 },
        { name: 'business_permit', maxCount: 1 },
        { name: 'proof_image', maxCount: 1 }
    ]), 
    vendorGoogleAuthController.completeVendorRegistration
);

module.exports = router;
