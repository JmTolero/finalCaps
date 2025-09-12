-- Add UNIQUE constraint to email field in users table
-- This prevents duplicate email addresses from being inserted

-- First, remove any duplicate emails (keep the first occurrence)
DELETE u1 FROM users u1
INNER JOIN users u2 
WHERE u1.user_id > u2.user_id 
AND u1.email = u2.email;

-- Add UNIQUE constraint to email field
ALTER TABLE users ADD CONSTRAINT unique_email UNIQUE (email);

-- Add UNIQUE constraint to username field as well (should also be unique)
ALTER TABLE users ADD CONSTRAINT unique_username UNIQUE (username);
