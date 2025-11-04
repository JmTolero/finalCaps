const express = require('express');
const router = express.Router();
const feedbackController = require('../controller/feedbackController');
const { authenticateToken } = require('../middleware/auth');

// Submit feedback (authenticated users) - with optional image upload
router.post('/', authenticateToken, (req, res, next) => {
  feedbackController.uploadImage(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message || 'File upload error'
      });
    }
    next();
  });
}, feedbackController.submitFeedback);

// Get my feedback (authenticated users)
router.get('/my-feedback', authenticateToken, feedbackController.getMyFeedback);

// Get all feedback (admin only)
router.get('/all', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin only.'
    });
  }
  next();
}, feedbackController.getAllFeedback);

// Update feedback status/priority (admin only)
router.put('/:id/status', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin only.'
    });
  }
  next();
}, feedbackController.updateFeedbackStatus);

// Respond to feedback (admin only)
router.post('/:id/respond', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin only.'
    });
  }
  next();
}, feedbackController.respondToFeedback);

// Delete feedback (admin only)
router.delete('/:id', authenticateToken, (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin only.'
    });
  }
  next();
}, feedbackController.deleteFeedback);

module.exports = router;

