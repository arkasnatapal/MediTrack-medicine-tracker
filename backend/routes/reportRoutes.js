const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { uploadReport, getReports, deleteReport, analyzeReport, updateReport } = require('../controllers/reportController');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

router.post('/upload', protect, upload.array('files'), uploadReport);
router.get('/', protect, getReports);
router.delete('/:id', protect, deleteReport);
router.post('/analyze/:id', protect, analyzeReport);
router.put('/:id', protect, updateReport);

module.exports = router;
