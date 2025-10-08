const cloudinary = require('cloudinary').v2;

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Log configuration status (without exposing secrets)
if (process.env.CLOUDINARY_CLOUD_NAME) {
  console.log(`[Cloudinary] Configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  console.log('[Cloudinary] Warning: Cloudinary credentials not set in environment variables');
}

module.exports = cloudinary;

