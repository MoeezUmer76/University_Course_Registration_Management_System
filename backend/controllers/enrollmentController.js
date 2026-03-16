const db = require('../config/db');

// @desc    Enroll a student in a section (ACID Transaction)
// @route   POST /api/v1/enrollment
const enrollStudent = async (req, res) => {
    const { student_id, section_id } = req.body;
    
    // 1. Grab a dedicated connection from the pool for this specific transaction
    const conn = await db.getConnection();

    try {
        // 2. BEGIN TRANSACTION
        await conn.beginTransaction();
        console.log(`\n--- Transaction Started for Student ${student_id}, Section ${section_id} ---`);

        // Step A: Check Capacity (Using FOR UPDATE to lock the row so no one else grabs the last seat)
        const [sections] = await conn.execute(
            'SELECT capacity, enrolled_count FROM section WHERE section_id = ? FOR UPDATE',
            [section_id]
        );

        if (sections.length === 0) {
            throw new Error('Section not found');
        }
        
        if (sections[0].enrolled_count >= sections[0].capacity) {
            throw new Error('Section is at full capacity (Over-enrollment prevented)');
        }
        console.log('Capacity check passed.');

        // Step B: Check if already enrolled
        const [existingEnrollment] = await conn.execute(
            'SELECT * FROM enrollment WHERE student_id = ? AND section_id = ?',
            [student_id, section_id]
        );

        if (existingEnrollment.length > 0) {
            throw new Error('Student is already enrolled in this section');
        }
        console.log('Duplicate check passed.');

        // Step C: Insert the Enrollment
        // Note: Your Phase 1 Trigger (trg_after_enrollment_insert) will automatically update the enrolled_count!
        await conn.execute(
            'INSERT INTO enrollment (student_id, section_id, enrollment_date, status) VALUES (?, ?, CURDATE(), ?)',
            [student_id, section_id, 'Enrolled']
        );
        console.log('Enrollment record inserted.');

        // 3. COMMIT TRANSACTION
        await conn.commit();
        console.log('--- Transaction Committed Successfully! ---\n');
        
        res.status(201).json({ 
            status: 'success', 
            message: 'Student successfully enrolled.' 
        });

    } catch (error) {
        // 4. ROLLBACK ON ANY ERROR
        await conn.rollback();
        console.error('--- TRANSACTION FAILED & ROLLED BACK --- Reason:', error.message, '\n');
        
        res.status(400).json({ 
            status: 'error', 
            message: error.message 
        });
    } finally {
        // 5. ALWAYS release the connection back to the pool
        conn.release();
    }
};

module.exports = { enrollStudent };