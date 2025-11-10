import multer from 'multer';
import fs from 'fs-extra';

// Ensure temp directory exists for uploads
const TEMP_UPLOAD_DIR = 'tmp/uploads';
fs.ensureDirSync(TEMP_UPLOAD_DIR);

// Configure multer with temporary upload directory
const upload = multer({ dest: TEMP_UPLOAD_DIR });

export default upload;