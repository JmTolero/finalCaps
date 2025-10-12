    -- Create feedback table for customer and vendor support requests
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_role VARCHAR(20) NOT NULL COMMENT 'customer or vendor',
    subject VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL COMMENT 'bug, feature_request, question, complaint, other',
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' COMMENT 'pending, in_progress, resolved, closed',
    priority VARCHAR(20) DEFAULT 'medium' COMMENT 'low, medium, high, urgent',
    admin_response TEXT,
    admin_id INT,
    responded_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create index on user_id for faster queries
CREATE INDEX idx_feedback_user_id ON feedback(user_id);

-- Create index on status for filtering
CREATE INDEX idx_feedback_status ON feedback(status);

-- Create index on created_at for sorting
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- Create index on user_role for filtering
CREATE INDEX idx_feedback_user_role ON feedback(user_role);

