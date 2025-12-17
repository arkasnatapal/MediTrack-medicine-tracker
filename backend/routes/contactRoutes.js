const express = require('express');
const router = express.Router();
const { submitContact, getAllMessages, updateMessageStatus } = require('../controllers/contactController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.post('/', submitContact);
router.get('/', authMiddleware, adminMiddleware, getAllMessages);
router.patch('/:id', authMiddleware, adminMiddleware, updateMessageStatus);

module.exports = router;
