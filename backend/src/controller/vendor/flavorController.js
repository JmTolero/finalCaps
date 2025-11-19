const pool = require('../../db/config');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const {
  hasSubscriptionExpired,
  downgradeVendorToFree,
  FREE_PLAN_LIMITS
} = require('../../services/subscriptionMaintenance');

// Configure Cloudinary storage for flavor image uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'flavor-images', // Folder in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image',
    public_id: (req, file) => {
      // Generate unique filename
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `flavor-${uniqueSuffix}`;
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit per file
  },
  fileFilter: (req, file, cb) => {
    console.log('[Cloudinary Flavor Upload] Field name:', file.fieldname);
    console.log('[Cloudinary Flavor Upload] Original name:', file.originalname);
    console.log('[Cloudinary Flavor Upload] MIME type:', file.mimetype);
    
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    console.log('[Cloudinary Flavor Upload] Extension check:', extname);
    console.log('[Cloudinary Flavor Upload] MIME type check:', mimetype);
    
    if (mimetype && extname) {
      console.log('[Cloudinary Flavor Upload] File accepted ✅');
      return cb(null, true);
    } else {
      console.log('[Cloudinary Flavor Upload] File rejected ❌');
      cb(new Error('Only image files are allowed for flavor images'));
    }
  }
});

// Get all flavors for a vendor
const getVendorFlavors = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    
    console.log('🔍 Fetching flavors for vendor_id:', vendor_id);
    console.log('🔍 Request params:', req.params);
    console.log('🔍 Request headers:', req.headers);
    
    // First, let's check if there are any flavors at all for this vendor
    const [allFlavorsCheck] = await pool.query(`
      SELECT COUNT(*) as total_flavors FROM flavors WHERE vendor_id = ? AND deleted_at IS NULL
    `, [vendor_id]);
    
    console.log('📊 Total flavors in database for vendor', vendor_id, ':', allFlavorsCheck[0].total_flavors);
    
    const [flavors] = await pool.query(`
      SELECT 
        f.flavor_id,
        f.flavor_name,
        f.flavor_description,
        f.image_url,
        f.store_status,
        f.created_at,
        f.vendor_id,
        f.sold_count,
        f.average_rating,
        f.total_ratings,
        CASE 
          WHEN (a.address_id IS NULL OR (
            (a.cityVillage IS NULL OR a.cityVillage = '') AND 
            (a.province IS NULL OR a.province = '')
          )) AND (a2.address_id IS NULL OR (
            (a2.cityVillage IS NULL OR a2.cityVillage = '') AND 
            (a2.province IS NULL OR a2.province = '')
          ))
          THEN 'Location not specified'
          WHEN a.address_id IS NOT NULL AND (
            (a.cityVillage IS NOT NULL AND a.cityVillage != '') OR 
            (a.province IS NOT NULL AND a.province != '')
          )
          THEN CONCAT_WS(', ',
            COALESCE(NULLIF(a.cityVillage, ''), NULL),
            COALESCE(NULLIF(a.province, ''), NULL)
          )
          ELSE CONCAT_WS(', ',
            COALESCE(NULLIF(a2.cityVillage, ''), NULL),
            COALESCE(NULLIF(a2.province, ''), NULL)
          )
        END as location,
        COALESCE(SUM(CASE WHEN o.status = 'delivered' THEN oi.quantity ELSE 0 END), 0) as calculated_sold_count,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'small' THEN vdp.price END), 0) as small_price,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'medium' THEN vdp.price END), 0) as medium_price,
        COALESCE(MIN(CASE WHEN vdp.drum_size = 'large' THEN vdp.price END), 0) as large_price
      FROM flavors f
      LEFT JOIN vendors v ON f.vendor_id = v.vendor_id
      LEFT JOIN addresses a ON v.primary_address_id = a.address_id
      LEFT JOIN user_addresses ua ON v.user_id = ua.user_id AND ua.is_default = 1
      LEFT JOIN addresses a2 ON ua.address_id = a2.address_id
      LEFT JOIN vendor_drum_pricing vdp ON f.vendor_id = vdp.vendor_id
      LEFT JOIN products p ON f.flavor_id = p.flavor_id
      LEFT JOIN order_items oi ON p.product_id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.order_id
      WHERE f.vendor_id = ? AND f.deleted_at IS NULL
      GROUP BY f.flavor_id, f.flavor_name, f.flavor_description, f.image_url, f.store_status, f.created_at, f.vendor_id, f.sold_count, f.average_rating, f.total_ratings, a.address_id, a.unit_number, a.street_name, a.barangay, a.cityVillage, a.province, a.region, a.postal_code, a2.address_id, a2.unit_number, a2.street_name, a2.barangay, a2.cityVillage, a2.province, a2.region, a2.postal_code
      ORDER BY f.created_at DESC
    `, [vendor_id]);
    
    console.log('📦 Found flavors for vendor', vendor_id, ':', flavors.length, 'flavors');
    console.log('📦 Flavor details:', flavors.map(f => ({
      id: f.flavor_id,
      name: f.flavor_name,
      store_status: f.store_status,
      vendor_id: f.vendor_id
    })));

    // Update sold_count in database if calculated count is different
    for (const flavor of flavors) {
      // Calculate accurate sold count from order_items with proper status filtering
      const [soldCountResult] = await pool.query(`
        SELECT COALESCE(SUM(oi.quantity), 0) as total_sold
        FROM order_items oi
        LEFT JOIN orders o ON oi.order_id = o.order_id
        LEFT JOIN products p ON oi.product_id = p.product_id
        WHERE p.flavor_id = ?
        AND o.status = 'delivered'
      `, [flavor.flavor_id]);
      
      const accurateSoldCount = soldCountResult[0].total_sold || 0;
      
      if (accurateSoldCount !== flavor.sold_count) {
        await pool.query(`
          UPDATE flavors 
          SET sold_count = ? 
          WHERE flavor_id = ?
        `, [accurateSoldCount, flavor.flavor_id]);
        flavor.sold_count = accurateSoldCount;
      }
      // Remove the calculated_sold_count from response
      delete flavor.calculated_sold_count;
    }

    res.json({
      success: true,
      flavors: flavors
    });
  } catch (error) {
    console.error('Error fetching vendor flavors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch flavors',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Create a new flavor
const createFlavor = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    const { flavor_name, flavor_description } = req.body;
    
    console.log('🔍 Flavor creation debug:');
    console.log('  - vendor_id:', vendor_id);
    console.log('  - flavor_name:', flavor_name);
    console.log('  - flavor_description:', flavor_description);
    console.log('  - req.files:', req.files);
    console.log('  - req.body:', req.body);
    
    // Validate required fields
    if (!flavor_name || !flavor_name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Flavor name is required'
      });
    }

    // Check if vendor exists
    const [vendor] = await pool.query(
      'SELECT vendor_id FROM vendors WHERE vendor_id = ?',
      [vendor_id]
    );

    if (vendor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }

    // Handle multiple image uploads (Cloudinary URLs)
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => file.path); // Use .path for Cloudinary URLs
      console.log('  - Found images array (Cloudinary URLs):', imageUrls);
    } else {
      console.log('  - No images found in req.files');
    }
    
    // Store images as JSON array in the database
    const imageUrlJson = JSON.stringify(imageUrls);
    console.log('  - Image URL JSON:', imageUrlJson);

    // Insert flavor into database
    const [result] = await pool.query(`
      INSERT INTO flavors (flavor_name, flavor_description, image_url, vendor_id)
      VALUES (?, ?, ?, ?)
    `, [flavor_name.trim(), flavor_description?.trim() || '', imageUrlJson, vendor_id]);

    res.json({
      success: true,
      message: 'Flavor created successfully',
      flavor: {
        flavor_id: result.insertId,
        flavor_name: flavor_name.trim(),
        flavor_description: flavor_description?.trim() || '',
        image_url: imageUrlJson,
        vendor_id: vendor_id
      }
    });
  } catch (error) {
    console.error('Error creating flavor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create flavor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update a flavor
const updateFlavor = async (req, res) => {
  try {
    const { flavor_id } = req.params;
    const { flavor_name, flavor_description } = req.body;
    
    console.log('🔍 Flavor update debug:');
    console.log('  - flavor_id:', flavor_id);
    console.log('  - flavor_name:', flavor_name);
    console.log('  - flavor_description:', flavor_description);
    console.log('  - req.files:', req.files);
    
    // Validate required fields
    if (!flavor_name || !flavor_name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Flavor name is required'
      });
    }

    // Check if flavor exists (excluding deleted flavors)
    const [existingFlavor] = await pool.query(`
      SELECT flavor_id, image_url, deleted_at FROM flavors 
      WHERE flavor_id = ?
    `, [flavor_id]);

    if (existingFlavor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Flavor not found'
      });
    }

    // Prevent updating deleted flavors
    if (existingFlavor[0].deleted_at) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update a deleted flavor. Please restore it first.'
      });
    }

    // Handle image updates
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      // New images provided, replace existing ones (Cloudinary URLs)
      imageUrls = req.files.map(file => file.path); // Use .path for Cloudinary URLs
      console.log('  - New images (Cloudinary URLs):', imageUrls);
    } else {
      // No new images, keep existing ones
      try {
        imageUrls = JSON.parse(existingFlavor[0].image_url || '[]');
        console.log('  - Keeping existing images:', imageUrls);
      } catch (e) {
        if (existingFlavor[0].image_url) {
          imageUrls = [existingFlavor[0].image_url];
        }
      }
    }

    const imageUrlJson = JSON.stringify(imageUrls);
    console.log('  - Final image URL JSON:', imageUrlJson);

    // Update flavor
    await pool.query(`
      UPDATE flavors 
      SET flavor_name = ?, flavor_description = ?, image_url = ?
      WHERE flavor_id = ?
    `, [flavor_name.trim(), flavor_description?.trim() || '', imageUrlJson, flavor_id]);

    console.log('✅ Flavor updated successfully');

    res.json({
      success: true,
      message: 'Flavor updated successfully',
      flavor: {
        flavor_id: parseInt(flavor_id),
        flavor_name: flavor_name.trim(),
        flavor_description: flavor_description?.trim() || '',
        image_url: imageUrlJson
      }
    });
  } catch (error) {
    console.error('Error updating flavor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update flavor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete a flavor
const deleteFlavor = async (req, res) => {
  try {
    const { flavor_id } = req.params;
    
    console.log('🔍 Flavor delete debug:');
    console.log('  - flavor_id:', flavor_id);
    
    // Get user ID from request (from JWT token or headers)
    let userId = req.headers['x-user-id'] || req.user?.user_id || req.user?.id;
    
    // If not found, try to extract from JWT token in Authorization header
    if (!userId) {
      const authHeader = req.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          userId = decoded.user_id || decoded.id;
        } catch (error) {
          console.log('JWT token verification failed:', error.message);
        }
      }
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in again.'
      });
    }

    // Get vendor_id from user_id
    const [vendors] = await pool.query(`
      SELECT vendor_id FROM vendors WHERE user_id = ?
    `, [userId]);

    if (vendors.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Vendor account not found'
      });
    }

    const vendor_id = vendors[0].vendor_id;
    console.log('  - vendor_id:', vendor_id);
    
    // Check if flavor exists and belongs to this vendor (including deleted ones for ownership check)
    const [existingFlavor] = await pool.query(`
      SELECT flavor_id, image_url, vendor_id, deleted_at FROM flavors 
      WHERE flavor_id = ?
    `, [flavor_id]);

    if (existingFlavor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Flavor not found'
      });
    }

    // Verify ownership
    if (existingFlavor[0].vendor_id !== vendor_id) {
      console.log(`  - Ownership mismatch: flavor belongs to vendor ${existingFlavor[0].vendor_id}, but user is vendor ${vendor_id}`);
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this flavor'
      });
    }

    // Check if already deleted
    if (existingFlavor[0].deleted_at) {
      return res.status(400).json({
        success: false,
        error: 'Flavor is already deleted'
      });
    }

    // Soft delete: Set deleted_at timestamp instead of hard deleting
    // This preserves sales records and order history while hiding the flavor from display
    console.log('  - Performing soft delete (preserving sales records)...');
    
    await pool.query(`
      UPDATE flavors 
      SET deleted_at = NOW()
      WHERE flavor_id = ?
    `, [flavor_id]);

    console.log('✅ Flavor soft deleted successfully (hidden from display, sales records preserved)');

    res.json({
      success: true,
      message: 'Flavor deleted successfully. It has been hidden from display, but sales records are preserved.'
    });
  } catch (error) {
    console.error('Error deleting flavor:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete flavor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update flavor store status
const updateFlavorStoreStatus = async (req, res) => {
  try {
    const { flavor_id } = req.params;
    const { store_status } = req.body;
    
    console.log('🔍 Flavor store status update debug:');
    console.log('  - flavor_id:', flavor_id);
    console.log('  - store_status:', store_status);
    
    // Validate store_status
    const validStatuses = ['draft', 'ready', 'published'];
    if (!validStatuses.includes(store_status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid store status. Must be one of: draft, ready, published'
      });
    }

    // Check if flavor exists and get vendor + lock info (including deleted ones for status update)
    const [existingFlavor] = await pool.query(`
      SELECT flavor_id, vendor_id, locked_by_subscription, deleted_at FROM flavors 
      WHERE flavor_id = ?
    `, [flavor_id]);

    if (existingFlavor.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Flavor not found'
      });
    }

    // Prevent updating status of deleted flavors
    if (existingFlavor[0].deleted_at) {
      return res.status(400).json({
        success: false,
        error: 'Cannot update status of a deleted flavor. Please restore it first.'
      });
    }

    if (store_status === 'published') {
      if (existingFlavor[0].locked_by_subscription) {
        return res.status(403).json({
          success: false,
          error: 'This flavor is locked due to your current subscription limits. Upgrade your plan to publish it again.',
          upgrade_required: true
        });
      }

      const vendorId = existingFlavor[0].vendor_id;

      const [vendorRows] = await pool.query(`
        SELECT vendor_id, subscription_plan, subscription_end_date, flavor_limit
        FROM vendors
        WHERE vendor_id = ?
      `, [vendorId]);

      if (!vendorRows.length) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found'
        });
      }

      let vendor = vendorRows[0];

      if (hasSubscriptionExpired(vendor.subscription_end_date) && vendor.subscription_plan !== 'free') {
        await downgradeVendorToFree(vendor.vendor_id);
        const [refetched] = await pool.query(`
          SELECT vendor_id, subscription_plan, subscription_end_date, flavor_limit
          FROM vendors
          WHERE vendor_id = ?
        `, [vendorId]);
        if (!refetched.length) {
          return res.status(404).json({
            success: false,
            error: 'Vendor not found'
          });
        }
        vendor = refetched[0];
      }

      const flavorLimit = vendor.flavor_limit ?? FREE_PLAN_LIMITS.flavors;

      if (flavorLimit !== -1) {
        const [publishedCountRows] = await pool.query(`
          SELECT COUNT(*) as published_count
          FROM flavors
          WHERE vendor_id = ? AND store_status = 'published' AND flavor_id <> ? AND deleted_at IS NULL
        `, [vendorId, flavor_id]);

        if (publishedCountRows[0].published_count >= flavorLimit) {
          return res.status(403).json({
            success: false,
            error: `You reached your publish limit of ${flavorLimit} flavors. Upgrade your subscription to publish more flavors.`,
            upgrade_required: true
          });
        }
      }
    }

    // Update store status
    await pool.query(`
      UPDATE flavors 
      SET store_status = ?
      WHERE flavor_id = ?
    `, [store_status, flavor_id]);

    console.log('✅ Flavor store status updated successfully');

    res.json({
      success: true,
      message: `Flavor ${store_status === 'published' ? 'published to store' : 'status updated'} successfully`,
      flavor: {
        flavor_id: parseInt(flavor_id),
        store_status: store_status
      }
    });
  } catch (error) {
    console.error('Error updating flavor store status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update flavor store status',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  upload,
  getVendorFlavors,
  createFlavor,
  updateFlavor,
  updateFlavorStoreStatus,
  deleteFlavor
};
