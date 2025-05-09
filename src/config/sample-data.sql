INSERT INTO users (name, email, password, role, phone, address) VALUES
('Admin User', 'admin@medical.com', '$2a$10$X7z3DBkKv1VHh7Uo5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO', 'admin', '081234567890', 'Jl. Admin No. 1'),
('Dr. Budi Santoso', 'dr.budi@medical.com', '$2a$10$X7z3DBkKv1VHh7Uo5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO', 'doctor', '081234567891', 'Jl. Dokter No. 1'),
('Dr. Ani Wijaya', 'dr.ani@medical.com', '$2a$10$X7z3DBkKv1VHh7Uo5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO', 'doctor', '081234567892', 'Jl. Dokter No. 2'),
('Pasien Satu', 'pasien1@medical.com', '$2a$10$X7z3DBkKv1VHh7Uo5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO', 'user', '081234567893', 'Jl. Pasien No. 1'),
('Pasien Dua', 'pasien2@medical.com', '$2a$10$X7z3DBkKv1VHh7Uo5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO5U5XUO', 'user', '081234567894', 'Jl. Pasien No. 2');

INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, is_verified, status) VALUES
(2, 1, '09:00:00', '17:00:00', true, 'approved'), -- Dr. Budi Monday
(2, 3, '09:00:00', '17:00:00', true, 'approved'), -- Dr. Budi Wednesday
(3, 2, '09:00:00', '17:00:00', true, 'approved'), -- Dr. Ani Tuesday
(3, 4, '09:00:00', '17:00:00', true, 'approved'); -- Dr. Ani Thursday

INSERT INTO appointments (patient_id, doctor_id, date, time, status, symptoms) VALUES
(4, 2, '2024-03-20', '10:00:00', 'confirmed', 'Demam dan batuk'),
(5, 3, '2024-03-21', '11:00:00', 'pending', 'Sakit kepala');

INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, symptoms, physical_examination, treatment) VALUES
(4, 2, 1, 'Flu', 'Demam dan batuk', 'Suhu 38°C, tenggorokan merah', 'Istirahat dan minum obat');

INSERT INTO prescriptions (medical_record_id, medicine, dosage, frequency, duration) VALUES
(1, 'Paracetamol', '500mg', '3x sehari', '3 hari'),
(1, 'Vitamin C', '500mg', '1x sehari', '7 hari');

INSERT INTO payments (appointment_id, amount, payment_method, status) VALUES
(1, 150000, 'bank_transfer', 'completed'); 