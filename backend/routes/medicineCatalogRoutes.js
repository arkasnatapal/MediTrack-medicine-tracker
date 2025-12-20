const express = require('express');
const router = express.Router();
const medicineCatalogController = require('../controllers/medicineCatalogController');

// Route to look up medicine in local DB
router.post('/lookup', medicineCatalogController.lookupMedicine);

// Route for real-time search suggestions
router.get('/search', medicineCatalogController.searchMedicines);

// Route to trigger AI search and save to DB
router.post('/ai-search', medicineCatalogController.aiSearchMedicine);

module.exports = router;
