// server/src/middleware/upload.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';

const root = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, root),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});
