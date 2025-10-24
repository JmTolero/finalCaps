const pool = require('../../db/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, GIF) are allowed'));
    }
  }
});

// Upload QR code for vendor
const uploadQRCode = async (req, res) => {
  try {
    // Get vendor_id from either params (for admin) or user token (for vendor)
    let vendor_id = req.params.vendor_id;
    
    if (!vendor_id) {
      // Get vendor ID from authenticated user
      const user = req.user;
      const [vendors] = await pool.query(
        'SELECT vendor_id FROM vendors WHERE user_id = ?',
        [user.user_id]
      );
      
      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found'
        });
      }
      
      vendor_id = vendors[0].vendor_id;
    }
    
    const { gcash_number, business_name } = req.body;

    // Validate required fields
    if (!gcash_number || !business_name) {
      return res.status(400).json({
        success: false,
        error: 'GCash number and shop name are required'
      });
    }

    // Validate GCash number format
    const cleanNumber = gcash_number.replace(/\D/g, '');
    let validatedNumber;
    
    if (cleanNumber.length === 11 && cleanNumber.startsWith('09')) {
      validatedNumber = `+63${cleanNumber.substring(1)}`;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('639')) {
      validatedNumber = `+${cleanNumber}`;
    } else if (cleanNumber.length === 13 && cleanNumber.startsWith('+639')) {
      validatedNumber = cleanNumber;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please enter a valid GCash number (e.g., 09123456789)'
      });
    }

    // Check if QR code file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'QR code image is required'
      });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'vendor-qr-codes',
          public_id: `qr-${vendor_id}-${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: 'limit' },
            { quality: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    const qrCodeUrl = cloudinaryResult.secure_url;

    // Check if vendor already has a QR code
    const [existingQR] = await pool.query(
      'SELECT * FROM vendor_gcash_qr WHERE vendor_id = ?',
      [vendor_id]
    );

    if (existingQR.length > 0) {
      // Delete old QR code from Cloudinary
      if (existingQR[0].qr_code_image) {
        try {
          const publicId = existingQR[0].qr_code_image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`vendor-qr-codes/${publicId}`);
        } catch (err) {
          console.log('Could not delete old QR code from Cloudinary:', err.message);
        }
      }

      // Update existing QR code
      const [result] = await pool.query(
        'UPDATE vendor_gcash_qr SET qr_code_image = ?, gcash_number = ?, business_name = ?, updated_at = CURRENT_TIMESTAMP WHERE vendor_id = ?',
        [qrCodeUrl, validatedNumber, business_name, vendor_id]
      );

      // Mark QR setup as completed
      await pool.query(
        'UPDATE vendors SET qr_code_setup_completed = TRUE WHERE vendor_id = ?',
        [vendor_id]
      );

      return res.status(200).json({
        success: true,
        message: 'QR code updated successfully',
        qrCode: {
          qr_id: existingQR[0].qr_id,
          vendor_id: vendor_id,
          qr_code_image: qrCodeUrl,
          gcash_number: validatedNumber,
          business_name: business_name,
          is_active: true,
          updated_at: new Date().toISOString()
        }
      });
    } else {
      // Create new QR code
      const [result] = await pool.query(
        'INSERT INTO vendor_gcash_qr (vendor_id, qr_code_image, gcash_number, business_name, is_active) VALUES (?, ?, ?, ?, ?)',
        [vendor_id, qrCodeUrl, validatedNumber, business_name, true]
      );

      // Mark QR setup as completed
      await pool.query(
        'UPDATE vendors SET qr_code_setup_completed = TRUE WHERE vendor_id = ?',
        [vendor_id]
      );

      return res.status(201).json({
        success: true,
        message: 'QR code uploaded successfully',
        qrCode: {
          qr_id: result.insertId,
          vendor_id: vendor_id,
          qr_code_image: qrCodeUrl,
          gcash_number: validatedNumber,
          business_name: business_name,
          is_active: true,
          created_at: new Date().toISOString()
        }
      });
    }

  } catch (error) {
    console.error('Error uploading QR code:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to upload QR code'
    });
  }
};

// Get QR code for vendor
const getQRCode = async (req, res) => {
  try {
    const { vendor_id } = req.params;

    const [qrCodes] = await pool.query(
      'SELECT * FROM vendor_gcash_qr WHERE vendor_id = ? AND is_active = 1',
      [vendor_id]
    );

    if (qrCodes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found for this vendor'
      });
    }

    const qrCode = qrCodes[0];

    return res.status(200).json({
      success: true,
      qrCode: qrCode
    });

  } catch (error) {
    console.error('Error fetching QR code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch QR code'
    });
  }
};

// Get QR code for current vendor (from token)
const getMyQRCode = async (req, res) => {
  try {
    const user = req.user;
    
    // Get vendor ID from user
    const [vendors] = await pool.query(
      'SELECT vendor_id FROM vendors WHERE user_id = ?',
      [user.user_id]
    );

    if (vendors.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    const vendor_id = vendors[0].vendor_id;

    const [qrCodes] = await pool.query(
      'SELECT * FROM vendor_gcash_qr WHERE vendor_id = ? AND is_active = 1',
      [vendor_id]
    );

    if (qrCodes.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    const qrCode = qrCodes[0];

    return res.status(200).json({
      success: true,
      qrCode: qrCode
    });

  } catch (error) {
    console.error('Error fetching QR code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch QR code'
    });
  }
};

// Delete QR code for vendor
const deleteQRCode = async (req, res) => {
  try {
    // Get vendor_id from either params (for admin) or user token (for vendor)
    let vendor_id = req.params.vendor_id;
    
    if (!vendor_id) {
      // Get vendor ID from authenticated user
      const user = req.user;
      const [vendors] = await pool.query(
        'SELECT vendor_id FROM vendors WHERE user_id = ?',
        [user.user_id]
      );
      
      if (vendors.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found'
        });
      }
      
      vendor_id = vendors[0].vendor_id;
    }

    // Get current QR code
    const [existingQR] = await pool.query(
      'SELECT * FROM vendor_gcash_qr WHERE vendor_id = ?',
      [vendor_id]
    );

    if (existingQR.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'QR code not found'
      });
    }

    // Delete QR code from database
    await pool.query(
      'DELETE FROM vendor_gcash_qr WHERE vendor_id = ?',
      [vendor_id]
    );

    // Delete QR code from Cloudinary
    if (existingQR[0].qr_code_image) {
      try {
        const publicId = existingQR[0].qr_code_image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`vendor-qr-codes/${publicId}`);
      } catch (err) {
        console.log('Could not delete QR code from Cloudinary:', err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'QR code deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting QR code:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete QR code'
    });
  }
};

module.exports = {
  upload,
  uploadQRCode,
  getQRCode,
  getMyQRCode,
  deleteQRCode
};
