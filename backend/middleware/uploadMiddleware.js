const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  console.log(`[Middleware] Processing file: ${file.originalname}, mimetype: ${file.mimetype}`);
  const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/pdf';

  if (extname && mimetype) {
    console.log('[Middleware] File accepted');
    cb(null, true);
  } else {
    console.error('[Middleware] File rejected');
    cb(new Error('Only image and PDF files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter
});

module.exports = upload;
