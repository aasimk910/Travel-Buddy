// Configures and exports the Cloudinary SDK instance for image uploads/deletions.
// Credentials are loaded from environment variables.

// #region Imports
const cloudinary = require('cloudinary').v2;

// #endregion Imports
// Apply Cloudinary account credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// #region Exports
module.exports = cloudinary;
// #endregion Exports
