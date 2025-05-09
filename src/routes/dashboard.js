const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = auth.checkRole;
const db = require('../config/db');

router.get('/statistics', [auth, checkRole(['admin'])], async (req, res) => {
    try {
        let schedules = { total: 0 };
        let shifts = { total: 0 };
        let bookings = { total: 0 };
        let reports = { total: 0 };
        
        try {
            [schedules] = await db.query('SELECT COUNT(*) as total FROM schedules');
            [shifts] = await db.query('SELECT COUNT(*) as total FROM schedules WHERE status = "active"');
            [bookings] = await db.query('SELECT COUNT(*) as total FROM appointments');
            [reports] = await db.query('SELECT COUNT(*) as total FROM medical_records');
        } catch (dbError) {
            console.error('Database query error:', dbError);
        }

        res.json({
            schedules: schedules[0]?.total || 0,
            shifts: shifts[0]?.total || 0,
            bookings: bookings[0]?.total || 0,
            reports: reports[0]?.total || 0
        });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({
            schedules: 0,
            shifts: 0,
            bookings: 0,
            reports: 0
        });
    }
});

router.get('/doctor-statistics/:doctorId', [auth, checkRole(['doctor', 'admin'])], async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        
        let appointments = { total: 0 };
        let patients = { total: 0 };
        let workHours = { total: 0 };
        
        try {
            [appointments] = await db.query(
                'SELECT COUNT(*) as total FROM appointments WHERE doctor_id = ?', 
                [doctorId]
            );
            
            [patients] = await db.query(
                'SELECT COUNT(DISTINCT patient_id) as total FROM appointments WHERE doctor_id = ?',
                [doctorId]
            );
            
            [workHours] = await db.query(
                'SELECT COUNT(*) as total FROM schedules WHERE doctor_id = ?',
                [doctorId]
            );
        } catch (dbError) {
            console.error('Database query error:', dbError);
        }
        
        res.json({
            appointments: appointments[0]?.total || 0,
            patients: patients[0]?.total || 0,
            workHours: workHours[0]?.total || 0
        });
    } catch (err) {
        console.error('Server error:', err);
        res.status(500).json({
            appointments: 0,
            patients: 0,
            workHours: 0
        });
    }
});

router.get('/user-statistics/:userId', [auth, checkRole(['user'])], async (req, res) => {
    try {
        const userId = req.params.userId;
        const [appointments] = await db.query(
            'SELECT COUNT(*) as total FROM appointments WHERE patient_id = ?', 
            [userId]
        );
        const [upcomingAppointments] = await db.query(
            'SELECT COUNT(*) as total FROM appointments WHERE patient_id = ? AND date >= CURDATE()',
            [userId]
        );
        const [doctors] = await db.query(
            'SELECT COUNT(DISTINCT doctor_id) as total FROM appointments WHERE patient_id = ?',
            [userId]
        );
        res.json({
            appointments: appointments[0].total,
            upcomingAppointments: upcomingAppointments[0].total,
            doctors: doctors[0].total
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; 