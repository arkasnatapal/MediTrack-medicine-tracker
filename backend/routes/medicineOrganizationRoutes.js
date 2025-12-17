const express = require('express');
const router = express.Router();
const {
  organizeMedicines,
  getFolders,
  moveMedicineToFolder,
  deleteFolder,
  updateLookupCache,
} = require('../controllers/medicineOrganizationController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Organization routes
router.post('/organize', organizeMedicines);

// Folder management routes
router.get('/folders', getFolders);
router.delete('/folders/:folderId', deleteFolder);

// Medicine movement
router.post('/:medicineId/move', moveMedicineToFolder);

// Cache management
router.put('/lookup-cache/:normalizedName', updateLookupCache);

module.exports = router;
