const pool = require('../../db/config');
const multer = require('multer');
const path = require('path');
const cloudinary = require('../../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for customer profile images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'customer-profiles', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png'],
    resource_type: 'image',
    public_id: (req, file) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `customer-${req.params.user_id}-${uniqueSuffix}`;
    }
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for profile images
  },
  fileFilter: (req, file, cb) => {
    console.log('[Customer Profile Upload] Field name:', file.fieldname);
    console.log('[Customer Profile Upload] Original name:', file.originalname);
    console.log('[Customer Profile Upload] MIME type:', file.mimetype);
    
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      console.log('[Customer Profile Upload] File accepted ✅');
      return cb(null, true);
    } else {
      console.log('[Customer Profile Upload] File rejected ❌');
      cb(new Error('Only JPG, JPEG, and PNG images are allowed'));
    }
  }
});

// Update customer profile
const updateCustomerProfile = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { fname, lname, email, contact_no } = req.body;
    
    console.log('Updating customer profile:', user_id, req.body);
    console.log('File upload:', req.file);
    
    // Validate required fields
    if (!fname || !email) {
      return res.status(400).json({ 
        success: false,
        error: 'First name and email are required' 
      });
    }
    
    // Check if email already exists for other users
    const [existingEmail] = await pool.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?', 
      [email, user_id]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already exists' 
      });
    }
    
    // Build update query dynamically based on whether profile image is included
    let updateQuery = 'UPDATE users SET fname = ?, lname = ?, email = ?, contact_no = ?';
    let updateData = [fname, lname, email, contact_no];
    
    // Handle profile image upload
    if (req.file) {
      updateQuery += ', profile_image_url = ?';
      updateData.push(req.file.path); // Cloudinary URL
      console.log('Profile image uploaded to:', req.file.path);
    }
    
    updateQuery += ' WHERE user_id = ?';
    updateData.push(user_id);
    
    // Update user information
    await pool.query(updateQuery, updateData);
    
    // Get updated user data
    const [updatedUser] = await pool.query(
      'SELECT user_id, fname, lname, email, contact_no, role, profile_image_url FROM users WHERE user_id = ?',
      [user_id]
    );
    
    console.log('Customer profile updated successfully');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser[0]
    });
    
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  updateCustomerProfile,
  upload
};
