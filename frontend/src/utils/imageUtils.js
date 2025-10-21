/**
 * Helper function to get the correct image URL
 * Handles both Cloudinary URLs (full URL) and legacy local URLs (filename only)
 * @param {string} imageUrl - The image URL from database
 * @param {string} apiBase - The API base URL (for legacy files)
 * @param {string} folder - The folder name for legacy files (default: 'vendor-documents')
 * @returns {string} - The complete image URL
 */
export const getImageUrl = (imageUrl, apiBase, folder = 'vendor-documents') => {
  if (!imageUrl) return null;
  
  // If it's already a full URL (Cloudinary), use it as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Handle legacy local files - check if it already has uploads/ prefix
  if (imageUrl.startsWith('uploads/')) {
    return `${apiBase}/${imageUrl}`;
  }
  
  // Legacy local file - prepend API base URL and uploads folder
  return `${apiBase}/uploads/${folder}/${imageUrl}`;
};

/**
 * Helper function specifically for flavor images
 * @param {string} imageUrl - The image URL from database
 * @param {string} apiBase - The API base URL (for legacy files)
 * @returns {string} - The complete image URL
 */
export const getFlavorImageUrl = (imageUrl, apiBase) => {
  return getImageUrl(imageUrl, apiBase, 'flavor-images');
};

/**
 * Check if an image URL is from Cloudinary
 * @param {string} imageUrl - The image URL to check
 * @returns {boolean} - True if it's a Cloudinary URL
 */
export const isCloudinaryUrl = (imageUrl) => {
  if (!imageUrl) return false;
  return imageUrl.includes('cloudinary.com');
};

