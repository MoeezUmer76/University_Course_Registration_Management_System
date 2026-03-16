const db = require('../config/db');

// @desc    Get all courses
// @route   GET /api/v1/courses
const getAllCourses = async (req, res) => {
    try {
        // Fetch all courses from the database
        const [courses] = await db.execute('SELECT * FROM course');
        
        res.status(200).json({
            status: 'success',
            results: courses.length,
            data: courses
        });
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ status: 'error', message: 'Server error while fetching courses' });
    }
};

module.exports = { getAllCourses };