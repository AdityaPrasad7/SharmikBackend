import multer from "multer";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const UPLOAD_BASE_DIR = path.join(__dirname, "../../uploads");
const UPLOAD_DIRS = {
  aadhaar: path.join(UPLOAD_BASE_DIR, "aadhaar"),
  profile: path.join(UPLOAD_BASE_DIR, "profile"),
  resume: path.join(UPLOAD_BASE_DIR, "resume"),
  documents: path.join(UPLOAD_BASE_DIR, "documents"),
  experience: path.join(UPLOAD_BASE_DIR, "experience"),
};

// Create directories if they don't exist
Object.values(UPLOAD_DIRS).forEach((dir) => {
  fs.ensureDirSync(dir);
});

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on field name
    let dest = UPLOAD_DIRS.documents; // default
    
    if (file.fieldname === "aadhaarCard") {
      dest = UPLOAD_DIRS.aadhaar;
    } else if (file.fieldname === "profilePhoto") {
      dest = UPLOAD_DIRS.profile;
    } else if (file.fieldname === "resume") {
      dest = UPLOAD_DIRS.resume;
    } else if (file.fieldname === "experienceCertificate") {
      dest = UPLOAD_DIRS.experience;
    } else if (file.fieldname === "documents") {
      dest = UPLOAD_DIRS.documents;
    }
    
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    const filename = `${name}-${uniqueSuffix}${ext}`;
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow all file types for now (as per requirement: "any type of file")
  // You can add restrictions later if needed
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

// Helper to get file path relative to project root for serving
export const getFileUrl = (filePath) => {
  if (!filePath) return null;
  // Convert absolute path to relative path from project root
  // Multer saves to: uploads/aadhaar/filename.ext (relative to project root)
  // We need: uploads/aadhaar/filename.ext
  const projectRoot = path.join(__dirname, "../../");
  const relativePath = path.relative(projectRoot, filePath);
  // Normalize path separators for URLs
  return relativePath.replace(/\\/g, "/");
};

