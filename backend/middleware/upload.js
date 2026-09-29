import multer from 'multer';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '../services/storageService.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(String(file.mimetype || '').toLowerCase())) {
      const error = new Error('Unsupported file type. Allowed types are JPEG, PNG, WebP, GIF, and PDF.');
      error.code = 'INVALID_FILE_TYPE';
      return callback(error);
    }
    return callback(null, true);
  }
});

export default upload;
