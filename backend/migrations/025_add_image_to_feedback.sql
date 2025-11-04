-- Add image_url field to feedback table for screenshots/attachments
ALTER TABLE feedback 
ADD COLUMN image_url VARCHAR(500) NULL COMMENT 'URL to uploaded screenshot/image attachment';

