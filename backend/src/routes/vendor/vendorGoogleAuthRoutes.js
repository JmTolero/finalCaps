const express = require('express');
const passport = require('passport');
const router = express.Router();
const vendorGoogleAuthController = require('../../controller/vendor/vendorGoogleAuthController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/vendor-documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
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
router.get('/google', 
    passport.authenticate('vendor-google', { 
        scope: ['profile', 'email'] 
    })
);

router.get('/google/callback',
    passport.authenticate('vendor-google', { 
        failureRedirect: '/api/vendor/auth/google/failure' 
    }),
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
