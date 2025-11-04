const pool = require('../db/config');
const multer = require('multer');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary storage for feedback images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'feedback-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    resource_type: 'image',
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      return `feedback-${uniqueSuffix}`;
    }
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Export multer upload middleware
exports.uploadImage = upload.single('image');

/**
 * Submit feedback (customer or vendor)
 * POST /api/feedback
 */
exports.submitFeedback = async (req, res) => {
  try {
    const { subject, category, description } = req.body;
    const userId = req.user.user_id || req.user.id; // From auth middleware
    const userRole = req.user.role;
    
    // Get image URL from uploaded file (if any)
    const image_url = req.file ? req.file.path : null;

    // Validation
    if (!subject || !category || !description) {
      return res.status(400).json({
        success: false,
        error: 'Subject, category, and description are required'
      });
    }

    // Valid categories
    const validCategories = ['bug', 'feature_request', 'question', 'complaint', 'other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid category'
      });
    }

    // Insert feedback
    const query = `
      INSERT INTO feedback (user_id, user_role, subject, category, description, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(query, [userId, userRole, subject, category, description, image_url]);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        id: result.insertId,
        created_at: new Date()
      }
    });

  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    });
  }
};

/**
 * Get feedback for current user
 * GET /api/feedback/my-feedback
 */
exports.getMyFeedback = async (req, res) => {
  try {
    const userId = req.user.user_id || req.user.id;

    const query = `
      SELECT 
        f.*,
        CONCAT(u.fname, ' ', COALESCE(u.lname, '')) as user_name,
        u.email as user_email,
        a.fname as admin_name
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.user_id
      LEFT JOIN users a ON f.admin_id = a.user_id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `;

    const [result] = await pool.query(query, [userId]);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
};

/**
 * Get all feedback (admin only)
 * GET /api/feedback/all
 */
exports.getAllFeedback = async (req, res) => {
  try {
    const { status, category, role, priority } = req.query;

    let query = `
      SELECT 
        f.*,
        CONCAT(u.fname, ' ', COALESCE(u.lname, '')) as user_name,
        u.email as user_email,
        u.contact_no as user_contact,
        a.fname as admin_name
      FROM feedback f
      LEFT JOIN users u ON f.user_id = u.user_id
      LEFT JOIN users a ON f.admin_id = a.user_id
      WHERE 1=1
    `;

    const params = [];

    // Apply filters
    if (status) {
      query += ` AND f.status = ?`;
      params.push(status);
    }

    if (category) {
      query += ` AND f.category = ?`;
      params.push(category);
    }

    if (role) {
      query += ` AND f.user_role = ?`;
      params.push(role);
    }

    if (priority) {
      query += ` AND f.priority = ?`;
      params.push(priority);
    }

    query += ` ORDER BY 
      CASE f.priority 
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      f.created_at DESC
    `;

    const [result] = await pool.query(query, params);

    // Get statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed,
        SUM(CASE WHEN user_role = 'customer' THEN 1 ELSE 0 END) as customer_feedback,
        SUM(CASE WHEN user_role = 'vendor' THEN 1 ELSE 0 END) as vendor_feedback,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high
      FROM feedback
    `;

    const [statsResult] = await pool.query(statsQuery);

    res.json({
      success: true,
      data: result,
      stats: statsResult[0]
    });

  } catch (error) {
    console.error('Error fetching all feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feedback'
    });
  }
};

/**
 * Update feedback status/priority (admin only)
 * PUT /api/feedback/:id/status
 */
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority } = req.body;

    // Validation
    const validStatuses = ['pending', 'in_progress', 'resolved', 'closed'];
    const validPriorities = ['low', 'medium', 'high', 'urgent'];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    if (priority && !validPriorities.includes(priority)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid priority'
      });
    }

    // Build update query
    let updateFields = [];
    let params = [];

    if (status) {
      updateFields.push(`status = ?`);
      params.push(status);
    }

    if (priority) {
      updateFields.push(`priority = ?`);
      params.push(priority);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP()`);

    if (updateFields.length === 1) { // Only updated_at
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    params.push(id);
    const query = `
      UPDATE feedback
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const [result] = await pool.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // Fetch updated feedback
    const [updated] = await pool.query('SELECT * FROM feedback WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: updated[0]
    });

  } catch (error) {
    console.error('Error updating feedback status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update feedback'
    });
  }
};

/**
 * Respond to feedback (admin only)
 * POST /api/feedback/:id/respond
 */
exports.respondToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    const adminId = req.user.user_id || req.user.id;

    if (!response || response.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Response is required'
      });
    }

    const query = `
      UPDATE feedback
      SET 
        admin_response = ?,
        admin_id = ?,
        responded_at = CURRENT_TIMESTAMP(),
        status = CASE 
          WHEN status = 'pending' THEN 'in_progress'
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP()
      WHERE id = ?
    `;

    const [result] = await pool.query(query, [response, adminId, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    // Fetch updated feedback
    const [updated] = await pool.query('SELECT * FROM feedback WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Response submitted successfully',
      data: updated[0]
    });

  } catch (error) {
    console.error('Error responding to feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit response'
    });
  }
};

/**
 * Delete feedback (admin only)
 * DELETE /api/feedback/:id
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM feedback WHERE id = ?';
    const [result] = await pool.query(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete feedback'
    });
  }
};

