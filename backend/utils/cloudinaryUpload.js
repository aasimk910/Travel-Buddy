// backend/utils/cloudinaryUpload.js
// Helper functions for uploading and deleting images via the Cloudinary SDK.
// Supports single and batch operations for base64-encoded images.

// #region Imports
const cloudinary = require('../config/cloudinary');

// #endregion Imports

// #region Upload
/**
 * Upload a Base64 image to Cloudinary
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} folder - Cloudinary folder path (e.g., 'travel-buddy/photos')
 * @returns {Promise<object>} - Cloudinary upload result
 */
const uploadBase64Image = async (base64Image, folder = 'travel-buddy') => {
  try {
    // Verify Cloudinary is configured before attempting upload
    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      throw new Error('Cloudinary credentials are missing. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env');
    }

    console.log(`Uploading image to Cloudinary (folder: ${folder}, size: ${Math.round(base64Image.length / 1024)}KB)...`);

    const result = await cloudinary.uploader.upload(base64Image, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { width: 1920, height: 1920, crop: 'limit' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log(`Cloudinary upload success: ${result.public_id}`);
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error('Cloudinary upload failed:', {
      message: error.message,
      httpCode: error.http_code,
      name: error.name,
    });
    throw new Error(`Failed to upload image to Cloudinary: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Upload multiple Base64 images to Cloudinary
 * @param {string[]} base64Images - Array of Base64 encoded image strings
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<object[]>} - Array of upload results
 */
const uploadMultipleBase64Images = async (base64Images, folder = 'travel-buddy') => {
  try {
    const uploadPromises = base64Images.map(image => uploadBase64Image(image, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw new Error('Failed to upload images to Cloudinary');
  }
};
// #endregion Upload

// #region Delete
/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} - Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
};

/**
 * Delete multiple images from Cloudinary
 * @param {string[]} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<object[]>} - Array of deletion results
 */
const deleteMultipleImages = async (publicIds) => {
  try {
    const deletePromises = publicIds.map(id => deleteImage(id));
    return await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw new Error('Failed to delete images from Cloudinary');
  }
};
// #endregion Delete

// #region Exports
module.exports = {
  uploadBase64Image,
  uploadMultipleBase64Images,
  deleteImage,
  deleteMultipleImages,
};
// #endregion Exports
