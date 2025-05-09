const db = require('../config/db');

// User queries
const getUserByEmail = async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

const createUser = async (userData) => {
    const { name, email, password, role } = userData;
    const [result] = await db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, password, role]
    );
    return result.insertId;
};

const getDoctorSchedules = async (doctorId) => {
    const [rows] = await db.query(
        'SELECT * FROM schedules WHERE doctor_id = ? AND status = "approved"',
        [doctorId]
    );
    return rows;
};

const getAvailableTimeSlots = async (doctorId, date) => {
    const dayOfWeek = new Date(date).getDay();
    const [schedules] = await db.query(
        'SELECT * FROM schedules WHERE doctor_id = ? AND day_of_week = ? AND status = "approved"',
        [doctorId, dayOfWeek]
    );
    
    const [appointments] = await db.query(
        'SELECT time FROM appointments WHERE doctor_id = ? AND date = ? AND status != "cancelled"',
        [doctorId, date]
    );
    
    return { schedules, appointments };
};

const createAppointment = async (appointmentData) => {
    const { patient_id, doctor_id, date, time, symptoms } = appointmentData;
    const [result] = await db.query(
        'INSERT INTO appointments (patient_id, doctor_id, date, time, symptoms) VALUES (?, ?, ?, ?, ?)',
        [patient_id, doctor_id, date, time, symptoms]
    );
    return result.insertId;
};

const getPatientAppointments = async (patientId) => {
    const [rows] = await db.query(
        `SELECT a.*, u.name as doctor_name 
         FROM appointments a 
         JOIN users u ON a.doctor_id = u.id 
         WHERE a.patient_id = ?`,
        [patientId]
    );
    return rows;
};

const getPatientMedicalRecords = async (patientId) => {
    const [rows] = await db.query(
        `SELECT mr.*, u.name as doctor_name, a.date as appointment_date 
         FROM medical_records mr 
         JOIN users u ON mr.doctor_id = u.id 
         LEFT JOIN appointments a ON mr.appointment_id = a.id 
         WHERE mr.patient_id = ?`,
        [patientId]
    );
    return rows;
};

const createMedicalRecord = async (recordData) => {
    const { patient_id, doctor_id, appointment_id, diagnosis, symptoms, physical_examination, treatment } = recordData;
    const [result] = await db.query(
        'INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, symptoms, physical_examination, treatment) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [patient_id, doctor_id, appointment_id, diagnosis, symptoms, physical_examination, treatment]
    );
    return result.insertId;
};

const createPayment = async (paymentData) => {
    const { appointment_id, amount, payment_method } = paymentData;
    const [result] = await db.query(
        'INSERT INTO payments (appointment_id, amount, payment_method) VALUES (?, ?, ?)',
        [appointment_id, amount, payment_method]
    );
    return result.insertId;
};

const updatePaymentStatus = async (paymentId, status) => {
    await db.query(
        'UPDATE payments SET status = ? WHERE id = ?',
        [status, paymentId]
    );
};

module.exports = {
    getUserByEmail,
    createUser,
    getDoctorSchedules,
    getAvailableTimeSlots,
    createAppointment,
    getPatientAppointments,
    getPatientMedicalRecords,
    createMedicalRecord,
    createPayment,
    updatePaymentStatus
}; 