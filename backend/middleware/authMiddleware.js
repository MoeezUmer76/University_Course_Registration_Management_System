const jwt = require('jsonwebtoken');

// 1. Verify if the user has a valid token
const authenticateToken = (req, res, next) => {
    // Tokens usually come in the format: "Bearer [token]"
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Access denied. No token provided.' });
    }

    try {
        // Verify the token using your secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach the user info (id, role) to the request
        next(); // Let them pass to the next function
    } catch (error) {
        res.status(403).json({ status: 'error', message: 'Invalid or expired token.' });
    }
};

// 2. Check if the user has the right role
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                status: 'error', 
                message: `Access denied. Requires one of these roles: ${allowedRoles.join(', ')}` 
            });
        }
        next(); // Role is allowed, let them pass
    };
};

module.exports = { authenticateToken, authorizeRoles };