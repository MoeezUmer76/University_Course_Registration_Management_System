const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// @desc    Register a new user
// @route   POST /api/v1/auth/register
const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Check if user already exists
        const [existingUsers] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ status: 'error', message: 'User already exists' });
        }

        // 2. Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Insert into database using Raw SQL
        const [result] = await db.execute(
            'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            [email, password_hash, role]
        );

        res.status(201).json({ 
            status: 'success', 
            message: 'User registered successfully',
            userId: result.insertId 
        });

    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ status: 'error', message: 'Server error during registration' });
    }
};

// @desc    Login user & get token
// @route   POST /api/v1/auth/login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Find the user
        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }
        
        const user = users[0];

        // 2. Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        // 3. Generate JWT Token
        const token = jwt.sign(
            { user_id: user.user_id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(200).json({
            status: 'success',
            message: 'Logged in successfully',
            token,
            user: {
                id: user.user_id,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ status: 'error', message: 'Server error during login' });
    }
};

module.exports = { register, login };