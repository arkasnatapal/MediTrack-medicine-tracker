const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const { uploadReport, getReports, deleteReport, analyzeReport, updateReport, getPublicReports } = require('../controllers/reportController');
const upload = require('../middleware/uploadMiddleware');

// Test route for Supabase
router.get('/test-supabase', async (req, res) => {
  try {
    const { uploadToSupabase } = require('../utils/supabaseHelper');
    const mockFile = {
      originalname: 'server_test.pdf',
      mimetype: 'application/pdf',
      buffer: Buffer.from('Server test PDF content')
    };
    const result = await uploadToSupabase(mockFile);
    res.json({ success: true, message: 'Supabase Upload Working!', result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Supabase Upload Failed', error: error.message, details: error });
  }
});

router.post('/upload', protect, upload.array('files'), uploadReport);
router.get('/', protect, getReports);
router.delete('/:id', protect, deleteReport);
router.post('/analyze/:id', protect, analyzeReport);
router.put('/:id', protect, updateReport);
router.get('/public/:memberId', getPublicReports);

module.exports = router;
