const express = require('express');
const router = express.Router();
const controller = require('./hospital-detail.controller');

router.get('/:id', controller.getDetails);
router.post('/:id/refresh', controller.refreshDetails);

module.exports = router;
