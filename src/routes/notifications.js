const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');

router.get('/', auth, function(req, res) {
    pool.query(
        'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
        [req.user.id]
    )
    .then(([rows]) => {
        res.json(rows);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    });
});

router.put('/:id/read', auth, function(req, res) {
    const { id } = req.params;
    pool.query(
        'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
        [id, req.user.id]
    )
    .then(() => {
        res.json({ message: 'Notification marked as read' });
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    });
});

router.post('/', auth, function(req, res) {
    const { user_id, title, message, type, appointment_id } = req.body;
    
    if (req.user.role !== 'admin' && req.user.role !== 'doctor') {
        return res.status(403).json({ message: 'Not authorized' });
    }

    pool.query(
        'INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)',
        [user_id, title, message, type, appointment_id]
    )
    .then(([result]) => {
        return pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    })
    .then(([rows]) => {
        res.json(rows[0]);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    });
});

router.post('/reminder', auth, function(req, res) {
    const { appointment_id } = req.body;
    
    pool.query(
        'SELECT a.*, u.id as user_id, d.name as doctor_name FROM appointments a JOIN users u ON a.user_id = u.id JOIN users d ON a.doctor_id = d.id WHERE a.id = ?',
        [appointment_id]
    )
    .then(([rows]) => {
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        const appointment = rows[0];
        
        return pool.query(
            'INSERT INTO notifications (user_id, title, message, type, appointment_id) VALUES (?, ?, ?, ?, ?)',
            [
                appointment.user_id,
                'Appointment Reminder',
                `Reminder: You have an appointment with Dr. ${appointment.doctor_name} on ${new Date(appointment.appointment_date).toLocaleDateString()} at ${appointment.appointment_time}`,
                'reminder',
                appointment_id
            ]
        );
    })
    .then(([result]) => {
        return pool.query('SELECT * FROM notifications WHERE id = ?', [result.insertId]);
    })
    .then(([rows]) => {
        res.json(rows[0]);
    })
    .catch(err => {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    });
});

module.exports = router; 