const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkRole = auth.checkRole;
const db = require('../config/db');

router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 8; 
        const offset = (page - 1) * limit;
        const searchTerm = req.query.search || '';

        let query = `
            SELECT u.id, u.name, d.specialty, d.experience, d.bio, d.image_url, d.rating, d.review_count
            FROM users u
            JOIN doctor_profiles d ON u.id = d.user_id
            WHERE u.role = 'doctor'
        `;

        const queryParams = [];

        if (searchTerm) {
            query += ` AND (u.name LIKE ? OR d.specialty LIKE ?)`;
            queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`);
        }

        const [countResult] = await db.query(
            query.replace('SELECT u.id, u.name, d.specialty, d.experience, d.bio, d.image_url, d.rating, d.review_count', 'SELECT COUNT(*) as total'),
            queryParams
        );
        const totalDoctors = countResult[0].total;
        const totalPages = Math.ceil(totalDoctors / limit);

        query += ` ORDER BY d.rating DESC, d.experience DESC LIMIT ? OFFSET ?`;
        queryParams.push(limit, offset);

        const [doctors] = await db.query(query, queryParams);

        res.json({
            doctors,
            pagination: {
                currentPage: page,
                totalPages,
                totalDoctors,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/recommended', auth, async (req, res) => {
    try {
        let preferredSpecialties = [];
        
        if (req.user.role === 'user') {
            const [userAppointments] = await db.query(`
                SELECT d.specialty
                FROM appointments a
                JOIN doctor_profiles d ON a.doctor_id = d.user_id
                WHERE a.patient_id = ?
                GROUP BY d.specialty
                ORDER BY COUNT(*) DESC
                LIMIT 3
            `, [req.user.id]);
            
            preferredSpecialties = userAppointments.map(a => a.specialty);
        }
        
        let query = `
            SELECT u.id, u.name, d.specialty, d.experience, d.bio, d.image_url as imageUrl, d.rating, d.review_count
            FROM users u
            JOIN doctor_profiles d ON u.id = d.user_id
            WHERE u.role = 'doctor'
        `;
        
        if (preferredSpecialties.length > 0) {
            query += ` ORDER BY FIELD(d.specialty, ?) DESC, d.rating DESC, d.experience DESC LIMIT 3`;
            const [doctors] = await db.query(query, [preferredSpecialties]);
            res.json(doctors);
        } else {
            query += ` ORDER BY d.rating DESC, d.experience DESC LIMIT 3`;
            const [doctors] = await db.query(query);
            res.json(doctors);
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [doctorResult] = await db.query(`
            SELECT u.id, u.name, u.email, d.specialty, d.experience, d.bio, d.image_url, d.rating, d.review_count
            FROM users u
            JOIN doctor_profiles d ON u.id = d.user_id
            WHERE u.id = ? AND u.role = 'doctor'
        `, [req.params.id]);
        
        if (doctorResult.length === 0) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        
        const doctor = doctorResult[0];
        
        const [specializations] = await db.query(`
            SELECT specialization
            FROM doctor_specializations
            WHERE doctor_id = ?
        `, [req.params.id]);
        
        doctor.specialties = specializations.map(s => s.specialization);
        
        const [education] = await db.query(`
            SELECT institution, degree, year
            FROM doctor_education
            WHERE doctor_id = ?
            ORDER BY year DESC
        `, [req.params.id]);
        
        doctor.education = education;
        
        const [experience] = await db.query(`
            SELECT position, hospital, year
            FROM doctor_experience
            WHERE doctor_id = ?
            ORDER BY year DESC
        `, [req.params.id]);
        
        doctor.experience = experience;
        
        const [reviews] = await db.query(`
            SELECT r.id, r.rating, r.comment, r.created_at, u.name as patient_name
            FROM reviews r
            JOIN users u ON r.patient_id = u.id
            WHERE r.doctor_id = ?
            ORDER BY r.created_at DESC
            LIMIT 5
        `, [req.params.id]);
        
        doctor.reviews = reviews;
        
        res.json(doctor);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/:id/schedules', async (req, res) => {
    try {
        const [schedules] = await db.query(`
            SELECT day_of_week, start_time, end_time, status
            FROM schedules
            WHERE doctor_id = ? AND status = 'active'
            ORDER BY day_of_week, start_time
        `, [req.params.id]);
        
        if (schedules.length === 0) {
            return res.json({ msg: 'No schedules found for this doctor' });
        }
        
        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/:id/reviews', [auth], async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const doctorId = req.params.id;
        
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }
        
        const [doctorCheck] = await db.query(
            'SELECT id FROM users WHERE id = ? AND role = "doctor"',
            [doctorId]
        );
        
        if (doctorCheck.length === 0) {
            return res.status(404).json({ msg: 'Doctor not found' });
        }
        
        const [result] = await db.query(
            'INSERT INTO reviews (doctor_id, patient_id, rating, comment) VALUES (?, ?, ?, ?)',
            [doctorId, req.user.id, rating, comment]
        );
        
        await db.query(`
            UPDATE doctor_profiles
            SET rating = (
                SELECT AVG(rating) FROM reviews WHERE doctor_id = ?
            ),
            review_count = (
                SELECT COUNT(*) FROM reviews WHERE doctor_id = ?
            )
            WHERE user_id = ?
        `, [doctorId, doctorId, doctorId]);
        
        res.json({ 
            msg: 'Review added successfully',
            reviewId: result.insertId
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/profile', [auth, checkRole(['doctor'])], async (req, res) => {
    try {
        const [doctor] = await db.query(`
            SELECT u.id, u.name, u.email, d.specialty, d.experience, d.bio, d.image_url, d.rating, d.review_count
            FROM users u
            JOIN doctor_profiles d ON u.id = d.user_id
            WHERE u.id = ?
        `, [req.user.id]);
        
        if (doctor.length === 0) {
            return res.status(404).json({ msg: 'Doctor profile not found' });
        }
        
        res.json(doctor[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/profile', [auth, checkRole(['doctor'])], async (req, res) => {
    try {
        const { name, specialty, experience, bio } = req.body;
        
        await db.query(
            'UPDATE users SET name = ? WHERE id = ?',
            [name, req.user.id]
        );
        
        await db.query(
            'UPDATE doctor_profiles SET specialty = ?, experience = ?, bio = ? WHERE user_id = ?',
            [specialty, experience, bio, req.user.id]
        );
        
        res.json({ msg: 'Profile updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/appointments', [auth, checkRole(['doctor'])], async (req, res) => {
    try {
        const [appointments] = await db.query(
            `SELECT a.*, u.name as patient_name 
             FROM appointments a 
             JOIN users u ON a.patient_id = u.id 
             WHERE a.doctor_id = ?
             ORDER BY a.date, a.time`,
            [req.user.id]
        );
        res.json(appointments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.get('/schedule', [auth, checkRole(['doctor'])], async (req, res) => {
    try {
        const [schedules] = await db.query(
            'SELECT * FROM schedules WHERE doctor_id = ? ORDER BY day_of_week, start_time',
            [req.user.id]
        );
        res.json(schedules);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.put('/schedule', [auth, checkRole(['doctor'])], async (req, res) => {
    try {
        const { schedules } = req.body;
        
        if (!schedules || !Array.isArray(schedules)) {
            return res.status(400).json({ msg: 'Invalid schedule data' });
        }
        
        await db.query('START TRANSACTION');
        
        await db.query('DELETE FROM schedules WHERE doctor_id = ?', [req.user.id]);
        
        for (const schedule of schedules) {
            const { day_of_week, start_time, end_time, status } = schedule;
            await db.query(
                'INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, day_of_week, start_time, end_time, status || 'active']
            );
        }
        
        await db.query('COMMIT');
        
        res.json({ msg: 'Schedule updated successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;