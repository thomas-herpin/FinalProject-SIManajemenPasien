const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = auth.checkRole;
const db = require('../config/db');

router.get('/patient/:patientId', [auth, checkRole(['doctor', 'user'])], async (req, res) => {
    try {
        if (req.user.role === 'user' && req.user.id !== parseInt(req.params.patientId)) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const [records] = await db.query(
            `SELECT mr.*, u.name as doctor_name, a.date as appointment_date, a.time as appointment_time
             FROM medical_records mr
             JOIN users u ON mr.doctor_id = u.id
             LEFT JOIN appointments a ON mr.appointment_id = a.id
             WHERE mr.patient_id = ?`,
            [req.params.patientId]
        );
        res.json(records);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/', [auth, checkRole(['doctor'])], async (req, res) => {
    try {
        const { patient_id, appointment_id, diagnosis, symptoms, physical_examination, treatment } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO medical_records 
             (patient_id, doctor_id, appointment_id, diagnosis, symptoms, physical_examination, treatment) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [patient_id, req.user.id, appointment_id, diagnosis, symptoms, physical_examination, treatment]
        );

        if (req.body.prescriptions && req.body.prescriptions.length > 0) {
            const prescriptions = req.body.prescriptions.map(prescription => [
                result.insertId,
                prescription.medicine,
                prescription.dosage,
                prescription.frequency,
                prescription.duration
            ]);

            await db.query(
                `INSERT INTO prescriptions 
                 (medical_record_id, medicine, dosage, frequency, duration) 
                 VALUES ?`,
                [prescriptions]
            );
        }

        if (req.body.referral) {
            const { hospital, department, reason } = req.body.referral;
            await db.query(
                `INSERT INTO referrals 
                 (medical_record_id, hospital, department, reason) 
                 VALUES (?, ?, ?, ?)`,
                [result.insertId, hospital, department, reason]
            );
        }

        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/:id', [auth, checkRole(['doctor'])], async (req, res) => {
    try {
        const { diagnosis, symptoms, physical_examination, treatment } = req.body;
        
        const [record] = await db.query(
            'SELECT * FROM medical_records WHERE id = ? AND doctor_id = ?',
            [req.params.id, req.user.id]
        );

        if (!record) {
            return res.status(404).json({ msg: 'Medical record not found or access denied' });
        }

        await db.query(
            `UPDATE medical_records 
             SET diagnosis = ?, symptoms = ?, physical_examination = ?, treatment = ? 
             WHERE id = ?`,
            [diagnosis, symptoms, physical_examination, treatment, req.params.id]
        );

        res.json({ msg: 'Medical record updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:id', [auth], async (req, res) => {
    try {
        const [record] = await db.query(
            `SELECT mr.*, u.name as doctor_name, a.date as appointment_date, a.time as appointment_time
             FROM medical_records mr
             JOIN users u ON mr.doctor_id = u.id
             LEFT JOIN appointments a ON mr.appointment_id = a.id
             WHERE mr.id = ?`,
            [req.params.id]
        );

        if (!record) {
            return res.status(404).json({ msg: 'Medical record not found' });
        }

        if (req.user.role === 'user' && req.user.id !== record.patient_id) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const [prescriptions] = await db.query(
            'SELECT * FROM prescriptions WHERE medical_record_id = ?',
            [req.params.id]
        );

        const [referral] = await db.query(
            'SELECT * FROM referrals WHERE medical_record_id = ?',
            [req.params.id]
        );

        res.json({
            ...record,
            prescriptions: prescriptions || [],
            referral: referral[0] || null
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router; 