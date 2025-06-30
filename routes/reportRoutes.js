const express = require('express');
const router = express.Router();
// Update this line to match the actual export name
const { protect, doctorOnly } = require('../middleware/authMiddleware');
const { getReportData } = require('../controllers/reportController');

// Use doctorOnly instead of doctorProtect if that's what your middleware exports
router.get('/', protect, doctorOnly, getReportData);

module.exports = router;