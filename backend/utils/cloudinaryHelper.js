const cloudinary = require('./cloudinary');

/**
 * Uploads an image to Cloudinary
 * @param {string} imageSource - The image source (URL or base64 string)
 * @param {string} folder - Optional folder name in Cloudinary
 * @returns {Promise<string>} - The secure URL of the uploaded image
 */
const uploadToCloudinary = async (imageSource, folder = 'medicine_images') => {
  try {
    if (!imageSource) return null;

    const result = await cloudinary.uploader.upload(imageSource, {
      folder: folder,
      resource_type: 'auto', // Automatically detect image/video
    });

    return result.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Return null or throw error depending on how strict we want to be.
    // For now, returning null so the process doesn't crash if image fails.
    return null;
  }
};

module.exports = { uploadToCloudinary };
