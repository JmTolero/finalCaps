-- Add birth_date and gender columns to users table
-- Migration: add_birth_date_gender_to_users.sql

USE chill_db;

-- Add birth_date column (DATE type for storing birth dates)
ALTER TABLE users ADD COLUMN birth_date DATE AFTER email;

-- Add gender column (ENUM for predefined gender options)
ALTER TABLE users ADD COLUMN gender ENUM('male', 'female', 'other', 'prefer_not_to_say') AFTER birth_date;

-- Add index for birth_date for potential queries
CREATE INDEX idx_users_birth_date ON users(birth_date);

-- Add index for gender for potential queries  
CREATE INDEX idx_users_gender ON users(gender);
