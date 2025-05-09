const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = auth.checkRole;
const db = require('../config/db');

router.get('/', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, name, email, role, phone, address FROM users');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/doctors', [auth], async (req, res) => {
    try {
        const [doctors] = await db.query(
            'SELECT id, name, email, phone, address FROM users WHERE role = "doctor"'
        );
        res.json(doctors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/patients', [auth, checkRole(['doctor', 'admin'])], async (req, res) => {
    try {
        const [patients] = await db.query(
            'SELECT id, name, email, phone, address FROM users WHERE role = "user"'
        );
        res.json(patients);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:id', [auth], async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT id, name, email, role, phone, address FROM users WHERE id = ?',
            [req.params.id]
        );
        
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/:id', [auth], async (req, res) => {
    try {
        const { name, phone, address } = req.body;

        if (req.user.role !== 'admin' && req.user.id !== parseInt(req.params.id)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        await db.query(
            'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
            [name, phone, address, req.params.id]
        );

        res.json({ msg: 'User updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.delete('/:id', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; 