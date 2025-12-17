const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllMedicines,
  getAllReminders,
} = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', getDashboardStats);
router.get('/users', getAllUsers);
router.get('/medicines', getAllMedicines);
router.get('/reminders', getAllReminders);

module.exports = router;
