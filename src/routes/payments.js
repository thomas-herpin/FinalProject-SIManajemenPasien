const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = auth.checkRole;
const db = require('../config/db');

router.post('/', [auth, checkRole(['user'])], async (req, res) => {
    try {
        const { appointment_id, amount, payment_method } = req.body;
        
        const [appointment] = await db.query(
            'SELECT * FROM appointments WHERE id = ? AND patient_id = ?',
            [appointment_id, req.user.id]
        );
        
        if (!appointment) {
            return res.status(404).json({ msg: 'Appointment not found' });
        }

        const [result] = await db.query(
            'INSERT INTO payments (appointment_id, amount, payment_method) VALUES (?, ?, ?)',
            [appointment_id, amount, payment_method]
        );

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/user/:userId', [auth, checkRole(['user', 'admin'])], async (req, res) => {
    try {
        if (req.user.role === 'user' && req.user.id !== parseInt(req.params.userId)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const [payments] = await db.query(
            `SELECT p.*, a.date, a.time, u.name as doctor_name 
             FROM payments p 
             JOIN appointments a ON p.appointment_id = a.id 
             JOIN users u ON a.doctor_id = u.id 
             WHERE a.patient_id = ?`,
            [req.params.userId]
        );

        res.json(payments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/:id/status', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const { status } = req.body;
        await db.query(
            'UPDATE payments SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        res.json({ msg: 'Payment status updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        const [payments] = await db.query(
            `SELECT p.*, a.date, a.time, u1.name as patient_name, u2.name as doctor_name 
             FROM payments p 
             JOIN appointments a ON p.appointment_id = a.id 
             JOIN users u1 ON a.patient_id = u1.id 
             JOIN users u2 ON a.doctor_id = u2.id`
        );
        res.json(payments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; 