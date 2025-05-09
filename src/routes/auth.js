const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getUserByEmail, createUser } = require('../utils/dbQueries');
const auth = require('../middleware/auth');
const db = require('../config/db');
const config = require('../config');

router.post('/register', async (req, res) => {
    try {
        console.log('Register request received:', req.body);
        const { name, email, password } = req.body;
        const role = 'patient';
        if (!name || !email || !password) {
            console.log('Missing required registration fields');
            return res.status(400).json({ msg: 'Please provide name, email, and password' });
        }

        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            console.log('User already exists:', email);
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userId = await createUser({
            name,
            email,
            password: hashedPassword,
            role
        });

        console.log('User registered successfully:', userId);

        const payload = {
            user: {
                id: userId,
                role
            }
        };

        jwt.sign(
            payload,
            config.jwtSecret,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('JWT sign error:', err);
                    throw err;
                }
                
                console.log('Token generated for new user');
                res.cookie('token', token, config.cookieOptions);
                res.json({
                    token,
                    user: {
                        id: userId,
                        name,
                        role
                    }
                });
            }
        );
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', req.body);
        const { email, password } = req.body;
        
        if (!email || !password) {
            console.log('Missing email or password in login request');
            return res.status(400).json({ msg: 'Please provide email and password' });
        }

        const user = await getUserByEmail(email);
        console.log('User lookup result:', user ? 'User found' : 'User not found');
        
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };
        
        jwt.sign(
            payload,
            config.jwtSecret,
            { expiresIn: '24h' },
            (err, token) => {
                if (err) {
                    console.error('JWT sign error:', err);
                    throw err;
                }
                
                console.log('Token generated successfully for:', email);
                res.cookie('token', token, config.cookieOptions);
                console.log('Cookie set with token');
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        role: user.role
                    }
                });
            }
        );
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
});

router.get('/logout', (req, res) => {
    console.log('Logout request received');
    res.clearCookie('token', {
        path: '/',
        httpOnly: true
    });
    console.log('Token cookie cleared');
    res.json({ success: true, msg: 'Logged out successfully' });
});

router.get('/me', [auth], async (req, res) => {
    try {
        console.log('User profile request for ID:', req.user.id);
        const [user] = await db.query(
            'SELECT id, name, email, role, phone, address FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (!user) {
            console.log('User not found in database');
            return res.status(404).json({ message: 'User not found' });
        }
        
        console.log('User profile found');
        res.json(user);
    } catch (err) {
        console.error('Error in /me endpoint:', err.message);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

router.get('/verify', [auth], (req, res) => {
    console.log('Token verification successful for user:', req.user.id);
    res.json({ isValid: true, user: req.user });
});

module.exports = router; 