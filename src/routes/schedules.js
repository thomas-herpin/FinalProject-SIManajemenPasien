const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = auth.checkRole;
const db = require('../config/db');

router.get('/', [auth, checkRole(['admin', 'doctor'])], async (req, res) => {
    try {
        const [schedules] = await db.query(`
            SELECT s.*, u.name as doctor_name 
            FROM schedules s
            JOIN users u ON s.doctor_id = u.id
            ORDER BY s.date DESC
        `);
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching schedules:', error);
        res.status(500).json({ message: 'Error fetching schedules' });
    }
});

router.get('/doctor/:doctorId', [auth], async (req, res) => {
    try {
        const [schedules] = await db.query(`
            SELECT * FROM schedules 
            WHERE doctor_id = ? 
            ORDER BY date DESC
        `, [req.params.doctorId]);
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching doctor schedules:', error);
        res.status(500).json({ message: 'Error fetching doctor schedules' });
    }
});

router.post('/', [auth, checkRole(['admin', 'doctor'])], async (req, res) => {
    try {
        const { doctor_id, date, start_time, end_time, status } = req.body;
        
        const [doctors] = await db.query('SELECT * FROM users WHERE id = ? AND role = "doctor"', [doctor_id]);
        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const [overlapping] = await db.query(`
            SELECT * FROM schedules 
            WHERE doctor_id = ? 
            AND date = ? 
            AND (
                (start_time <= ? AND end_time > ?) OR
                (start_time < ? AND end_time >= ?) OR
                (start_time >= ? AND end_time <= ?)
            )
        `, [doctor_id, date, start_time, start_time, end_time, end_time, start_time, end_time]);

        if (overlapping.length > 0) {
            return res.status(400).json({ message: 'Schedule overlaps with existing schedule' });
        }

        const [result] = await db.query(`
            INSERT INTO schedules (doctor_id, date, start_time, end_time, status)
            VALUES (?, ?, ?, ?, ?)
        `, [doctor_id, date, start_time, end_time, status || 'pending']);

        const [newSchedule] = await db.query('SELECT * FROM schedules WHERE id = ?', [result.insertId]);
        res.status(201).json(newSchedule[0]);
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({ message: 'Error creating schedule' });
    }
});

router.put('/:id', [auth, checkRole(['admin', 'doctor'])], async (req, res) => {
    try {
        const { date, start_time, end_time, status } = req.body;
        
        const [schedules] = await db.query('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
        if (schedules.length === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        const schedule = schedules[0];

        const [overlapping] = await db.query(`
            SELECT * FROM schedules 
            WHERE doctor_id = ? 
            AND id != ?
            AND date = ? 
            AND (
                (start_time <= ? AND end_time > ?) OR
                (start_time < ? AND end_time >= ?) OR
                (start_time >= ? AND end_time <= ?)
            )
        `, [schedule.doctor_id, req.params.id, date, start_time, start_time, end_time, end_time, start_time, end_time]);

        if (overlapping.length > 0) {
            return res.status(400).json({ message: 'Schedule overlaps with existing schedule' });
        }

        await db.query(`
            UPDATE schedules 
            SET date = ?, start_time = ?, end_time = ?, status = ?
            WHERE id = ?
        `, [date, start_time, end_time, status, req.params.id]);

        const [updatedSchedule] = await db.query('SELECT * FROM schedules WHERE id = ?', [req.params.id]);
        res.json(updatedSchedule[0]);
    } catch (error) {
        console.error('Error updating schedule:', error);
        res.status(500).json({ message: 'Error updating schedule' });
    }
});

router.delete('/:id', [auth, checkRole(['admin', 'doctor'])], async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM schedules WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Schedule not found' });
        }
        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        console.error('Error deleting schedule:', error);
        res.status(500).json({ message: 'Error deleting schedule' });
    }
});

module.exports = router; 