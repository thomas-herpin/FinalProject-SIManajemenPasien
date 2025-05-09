const express = require('express');
const auth = require('../middleware/auth');
const checkRole = auth.checkRole;
const db = require('../config/db');
const router = express.Router();
const { createAppointment, getPatientAppointments, getAvailableTimeSlots } = require('../utils/dbQueries');

router.post('/', [auth, checkRole(['user'])], async (req, res) => {
    try {
        const appointmentData = {
            ...req.body,
            patient_id: req.user.id
        };
        const appointmentId = await createAppointment(appointmentData);
        res.status(201).json({ id: appointmentId, ...appointmentData });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/user/:userId', [auth, checkRole(['user', 'doctor'])], async (req, res) => {
    try {
        if (req.user.role === 'user' && req.user.id !== parseInt(req.params.userId)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const appointments = await getPatientAppointments(req.params.userId);
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/available/:doctorId', [auth, checkRole(['user'])], async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ msg: 'Date is required' });
        }

        const timeSlots = await getAvailableTimeSlots(req.params.doctorId, date);
        res.json(timeSlots);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/:id/status', [auth, checkRole(['user', 'doctor'])], async (req, res) => {
    try {
        const { status } = req.body;
        await db.query(
            'UPDATE appointments SET status = ? WHERE id = ?',
            [status, req.params.id]
        );
        res.json({ msg: 'Appointment status updated' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.delete('/:id', [auth, checkRole(['user'])], async (req, res) => {
    try {
        await db.query(
            'UPDATE appointments SET status = "cancelled" WHERE id = ? AND patient_id = ?',
            [req.params.id, req.user.id]
        );
        res.json({ msg: 'Appointment cancelled' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/doctor/:doctorId/today', [auth, checkRole(['doctor', 'admin'])], async (req, res) => {
    try {
        if (req.user.role === 'doctor' && req.user.id !== parseInt(req.params.doctorId)) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        
        const today = new Date().toISOString().split('T')[0]; 
        
        const [appointments] = await db.query(
            `SELECT a.*, u.name as patientName 
             FROM appointments a 
             JOIN users u ON a.patient_id = u.id 
             WHERE a.doctor_id = ? AND a.date = ?
             ORDER BY a.time ASC`,
            [req.params.doctorId, today]
        );
        
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; 