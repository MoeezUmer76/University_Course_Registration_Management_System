const express = require('express');
const router = express.Router();
const { enrollStudent } = require('../controllers/enrollmentController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Only Admins or the Students themselves should be able to enroll
router.post('/', authenticateToken, authorizeRoles('Admin', 'Student'), enrollStudent);

module.exports = router;