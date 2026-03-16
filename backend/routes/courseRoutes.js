const express = require('express');
const router = express.Router();
const { getAllCourses } = require('../controllers/courseController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get all courses (Requires user to be logged in)
router.get('/', authenticateToken, getAllCourses);

module.exports = router;