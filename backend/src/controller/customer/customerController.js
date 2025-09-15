const pool = require('../../db/config');

// Update customer profile
const updateCustomerProfile = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { fname, lname, email, contact_no } = req.body;
    
    console.log('Updating customer profile:', user_id, req.body);
    
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
    
    // Update user information
    const updateData = [fname, lname, email, contact_no, user_id];
    await pool.query(
      'UPDATE users SET fname = ?, lname = ?, email = ?, contact_no = ? WHERE user_id = ?',
      updateData
    );
    
    // Get updated user data
    const [updatedUser] = await pool.query(
      'SELECT user_id, fname, lname, email, contact_no, role FROM users WHERE user_id = ?',
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
  updateCustomerProfile
};
