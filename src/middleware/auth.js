const jwt = require('jsonwebtoken');
const config = require('../config');

const auth = (req, res, next) => {
    console.log('Auth middleware called');
    
    const tokenFromCookie = req.cookies.token;
    const tokenFromHeader = extractTokenFromHeader(req);
    const token = tokenFromCookie || tokenFromHeader;
    
    console.log('Token sources - Cookie:', !!tokenFromCookie, 'Header:', !!tokenFromHeader);

    if (!token) {
        console.log('No token found in request');
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        console.log('Verifying token with secret key from config');
        const decoded = jwt.verify(token, config.jwtSecret);
        console.log('Token successfully verified');
        
        req.user = decoded.user || decoded; 
        console.log('User info attached to request:', req.user.id, req.user.role);
        next();
    } catch (err) {
        console.error('Token verification failed:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

function extractTokenFromHeader(req) {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    return null;
}

const checkRole = (roles) => {
    return (req, res, next) => {
        console.log('Checking role access:', roles);
        
        if (!req.user) {
            console.log('No user object found in request');
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const hasRole = roles.find(role => req.user.role === role);
        console.log('User role:', req.user.role, 'Access granted:', !!hasRole);
        
        if (!hasRole) {
            return res.status(403).json({ message: 'Forbidden - No permission' });
        }

        next();
    };
};

module.exports = auth;
module.exports.checkRole = checkRole; 