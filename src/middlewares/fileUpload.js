import multer from "multer";
import { uploadToCloudinary, getCloudinaryUrl } from "../utils/cloudinary.js";

// Map field names to Cloudinary folders
const FIELD_TO_FOLDER = {
  aadhaarCard: "aadhaar",
  profilePhoto: "profile",
  resume: "resume",
  experienceCertificate: "experience",
  documents: "documents",
};

// Determine resource type based on MIME type
const getResourceType = (mimetype) => {
  if (mimetype.startsWith("image/")) {
    return "image";
  }
  if (mimetype === "application/pdf" || mimetype.includes("document") || mimetype.includes("word")) {
    return "raw"; // PDFs and documents as raw files
  }
  return "auto"; // Let Cloudinary auto-detect
};

// Configure multer to use memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedMimes.join(", ")}`), false);
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Middleware for single file uploads
export const uploadSingle = (fieldName) => upload.single(fieldName);

// Middleware for multiple file uploads
export const uploadMultiple = (fieldName, maxCount = 5) =>
  upload.array(fieldName, maxCount);

// Middleware for multiple fields
export const uploadFields = (fields) => upload.fields(fields);

/**
 * Middleware to upload files to Cloudinary after multer processes them
 * This should be used after uploadFields/uploadSingle/uploadMultiple
 */
export const uploadToCloudinaryMiddleware = async (req, res, next) => {
  try {
    // Handle single file
    if (req.file) {
      const folder = FIELD_TO_FOLDER[req.file.fieldname] || "documents";
      const resourceType = getResourceType(req.file.mimetype);
      
      const result = await uploadToCloudinary(
        req.file.buffer,
        folder,
        resourceType
      );
      
      // Store Cloudinary URL and public_id in file object
      req.file.cloudinaryUrl = result.secure_url;
      req.file.publicId = result.public_id;
      req.file.url = result.secure_url; // For backward compatibility
    }
    
    // Handle multiple files
    if (req.files) {
      for (const fieldname in req.files) {
        const files = Array.isArray(req.files[fieldname])
          ? req.files[fieldname]
          : [req.files[fieldname]];
        
        for (const file of files) {
          const folder = FIELD_TO_FOLDER[fieldname] || "documents";
          const resourceType = getResourceType(file.mimetype);
          
          const result = await uploadToCloudinary(
            file.buffer,
            folder,
            resourceType
          );
          
          // Store Cloudinary URL and public_id in file object
          file.cloudinaryUrl = result.secure_url;
          file.publicId = result.public_id;
          file.url = result.secure_url; // For backward compatibility
        }
      }
    }
    
    next();
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    next(error);
  }
};

/**
 * Helper to get file URL (Cloudinary URL or local path for backward compatibility)
 * @param {string|Object} filePathOrFile - File path string or file object with cloudinaryUrl
 * @returns {string|null} File URL
 */
export const getFileUrl = (filePathOrFile) => {
  if (!filePathOrFile) return null;
  
  // If it's a file object with cloudinaryUrl (from Cloudinary upload)
  if (typeof filePathOrFile === "object" && filePathOrFile.cloudinaryUrl) {
    return filePathOrFile.cloudinaryUrl;
  }
  
  // If it's already a URL (Cloudinary URL stored in DB)
  if (typeof filePathOrFile === "string" && filePathOrFile.startsWith("http")) {
    return filePathOrFile;
  }
  
  // If it's a file object with url property
  if (typeof filePathOrFile === "object" && filePathOrFile.url) {
    return filePathOrFile.url;
  }
  
  // If it's a file object with path (local file - for backward compatibility)
  if (typeof filePathOrFile === "object" && filePathOrFile.path) {
    // In production/Vercel, this shouldn't happen, but handle it gracefully
    // Return the path as-is (might be a relative path from old uploads)
    return filePathOrFile.path;
  }
  
  // If it's a string path (local file - for backward compatibility)
  if (typeof filePathOrFile === "string") {
    // If it's already a full URL, return it
    if (filePathOrFile.startsWith("http")) {
      return filePathOrFile;
    }
    // Otherwise, it's a local path (shouldn't happen in production)
    return filePathOrFile;
  }
  
  return null;
};
