import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder path (e.g., 'aadhaar', 'profile', 'resume')
 * @param {string} resourceType - 'image' or 'raw' (for PDFs, docs)
 * @returns {Promise<Object>} Cloudinary upload result
 */
export const uploadToCloudinary = async (fileBuffer, folder, resourceType = "auto") => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `shramik/${folder}`, // Organize files in Cloudinary
      resource_type: resourceType === "auto" ? "auto" : resourceType,
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    };

    cloudinary.uploader
      .upload_stream(uploadOptions, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      })
      .end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public ID (without extension)
 * @param {string} resourceType - 'image' or 'raw'
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export const deleteFromCloudinary = async (publicId, resourceType = "image") => {
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
};

/**
 * Get Cloudinary URL from public ID
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} Cloudinary URL
 */
export const getCloudinaryUrl = (publicId, options = {}) => {
  if (!publicId) return null;
  
  // If it's already a full URL, return it
  if (publicId.startsWith("http")) {
    return publicId;
  }
  
  return cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
};

export default cloudinary;

