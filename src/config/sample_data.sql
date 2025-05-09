USE medical_health;

INSERT INTO users (name, email, password, role, phone, address) 
VALUES 
('Dr. Siti Aminah', 'siti@example.com', '$2b$10$1234567890123456789012', 'doctor', '081234567890', 'Jl. Pahlawan No. 123, Jakarta'),
('Dr. Budi Santoso', 'budi@example.com', '$2b$10$1234567890123456789012', 'doctor', '081234567891', 'Jl. Merdeka No. 45, Bandung'),
('Ani Wijaya', 'ani@example.com', '$2b$10$1234567890123456789012', 'user', '081234567892', 'Jl. Sudirman No. 78, Jakarta'),
('Rudi Hartono', 'rudi@example.com', '$2b$10$1234567890123456789012', 'user', '081234567893', 'Jl. Gatot Subroto No. 56, Surabaya'),
('Admin User', 'admin@example.com', '$2b$10$1234567890123456789012', 'admin', '081234567894', 'Jl. Admin No. 1, Jakarta')
ON DUPLICATE KEY UPDATE
    role = VALUES(role),
    phone = VALUES(phone),
    address = VALUES(address);

INSERT INTO doctor_profiles (user_id, specialty, experience, bio, image_url, rating, review_count)
SELECT id, 'Kardiologi', '10 tahun', 'Spesialis jantung dengan pengalaman lebih dari 10 tahun', '/assets/doctor1.jpg', 4.8, 120
FROM users WHERE email = 'siti@example.com'
ON DUPLICATE KEY UPDATE
    specialty = VALUES(specialty),
    experience = VALUES(experience);

INSERT INTO doctor_profiles (user_id, specialty, experience, bio, image_url, rating, review_count)
SELECT id, 'Neurologi', '8 tahun', 'Spesialis saraf dengan fokus pada penanganan stroke', '/assets/doctor2.jpg', 4.7, 95
FROM users WHERE email = 'budi@example.com'
ON DUPLICATE KEY UPDATE
    specialty = VALUES(specialty),
    experience = VALUES(experience);

INSERT INTO appointments (patient_id, doctor_id, date, time, status, complaint, notes)
SELECT 
    (SELECT id FROM users WHERE email = 'ani@example.com'),
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    CURDATE(),
    '10:00:00',
    'pending',
    'Nyeri dada dan sesak nafas',
    'Pasien memiliki riwayat hipertensi'
WHERE NOT EXISTS (
    SELECT 1 FROM appointments 
    WHERE patient_id = (SELECT id FROM users WHERE email = 'ani@example.com')
    AND doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND date = CURDATE()
    AND time = '10:00:00'
);

INSERT INTO appointments (patient_id, doctor_id, date, time, status, complaint, notes)
SELECT 
    (SELECT id FROM users WHERE email = 'rudi@example.com'),
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    CURDATE(),
    '11:00:00',
    'confirmed',
    'Detak jantung tidak teratur',
    'Pasien mengonsumsi obat jantung secara rutin'
WHERE NOT EXISTS (
    SELECT 1 FROM appointments 
    WHERE patient_id = (SELECT id FROM users WHERE email = 'rudi@example.com')
    AND doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND date = CURDATE()
    AND time = '11:00:00'
);

INSERT INTO appointments (patient_id, doctor_id, date, time, status, complaint, notes)
SELECT 
    (SELECT id FROM users WHERE email = 'ani@example.com'),
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    DATE_ADD(CURDATE(), INTERVAL 1 DAY),
    '14:00:00',
    'pending',
    'Sakit kepala berkepanjangan',
    'Pasien memiliki riwayat migrain'
WHERE NOT EXISTS (
    SELECT 1 FROM appointments 
    WHERE patient_id = (SELECT id FROM users WHERE email = 'ani@example.com')
    AND doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
    AND time = '14:00:00'
);

INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    CURDATE(),
    '08:00:00',
    '16:00:00',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_schedules 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND date = CURDATE()
);

INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    DATE_ADD(CURDATE(), INTERVAL 1 DAY),
    '08:00:00',
    '16:00:00',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_schedules 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND date = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
);

INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    CURDATE(),
    '09:00:00',
    '17:00:00',
    'active'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_schedules 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND date = CURDATE()
);

INSERT INTO doctor_work_hours (doctor_id, created_at, note)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    CONCAT(CURDATE(), ' 08:00:00'),
    'Check-in'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_work_hours 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND DATE(created_at) = CURDATE()
    AND TIME(created_at) = '08:00:00'
);

INSERT INTO doctor_work_hours (doctor_id, created_at, note)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    CONCAT(CURDATE(), ' 16:00:00'),
    'Check-out'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_work_hours 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND DATE(created_at) = CURDATE()
    AND TIME(created_at) = '16:00:00'
);

INSERT INTO doctor_work_hours (doctor_id, created_at, note)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    CONCAT(CURDATE(), ' 09:15:00'),
    'Check-in (terlambat karena macet)'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_work_hours 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND DATE(created_at) = CURDATE()
    AND TIME(created_at) = '09:15:00'
);

INSERT INTO notifications (user_id, sender_id, title, message, type, is_read, created_at)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Jadwal Baru',
    'Anda memiliki jadwal konsultasi baru hari ini pukul 10:00 dengan pasien Ani Wijaya.',
    'schedule',
    FALSE,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND title = 'Jadwal Baru'
    AND DATE(created_at) = CURDATE()
);

INSERT INTO notifications (user_id, sender_id, title, message, type, is_read, created_at)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    (SELECT id FROM users WHERE email = 'admin@example.com'),
    'Pengingat',
    'Jangan lupa mengisi laporan jam kerja untuk minggu ini.',
    'reminder',
    FALSE,
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM notifications 
    WHERE user_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND title = 'Pengingat'
    AND DATE(created_at) = CURDATE()
);

INSERT INTO doctor_specializations (doctor_id, specialization)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    'Kardiologi'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_specializations 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND specialization = 'Kardiologi'
);

INSERT INTO doctor_specializations (doctor_id, specialization)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    'Penyakit Jantung'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_specializations 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND specialization = 'Penyakit Jantung'
);

INSERT INTO doctor_specializations (doctor_id, specialization)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    'Neurologi'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_specializations 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND specialization = 'Neurologi'
);

INSERT INTO doctor_specializations (doctor_id, specialization)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    'Saraf'
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_specializations 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND specialization = 'Saraf'
);

INSERT INTO doctor_education (doctor_id, institution, degree, year)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    'Universitas Indonesia',
    'Dokter Spesialis Jantung',
    2010
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_education 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND institution = 'Universitas Indonesia'
    AND year = 2010
);

INSERT INTO doctor_education (doctor_id, institution, degree, year)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    'Universitas Gadjah Mada',
    'Dokter Umum',
    2005
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_education 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND institution = 'Universitas Gadjah Mada'
    AND year = 2005
);

INSERT INTO doctor_education (doctor_id, institution, degree, year)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    'Universitas Airlangga',
    'Dokter Spesialis Saraf',
    2012
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_education 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND institution = 'Universitas Airlangga'
    AND year = 2012
);

INSERT INTO doctor_education (doctor_id, institution, degree, year)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    'Universitas Padjadjaran',
    'Dokter Umum',
    2007
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_education 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND institution = 'Universitas Padjadjaran'
    AND year = 2007
);

INSERT INTO doctor_experience (doctor_id, position, hospital, year)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    'Dokter Spesialis Jantung',
    'Rumah Sakit Cipto Mangunkusumo',
    2012
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_experience 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND hospital = 'Rumah Sakit Cipto Mangunkusumo'
    AND year = 2012
);

INSERT INTO doctor_experience (doctor_id, position, hospital, year)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    'Dokter Spesialis Jantung',
    'Rumah Sakit Jantung Harapan Kita',
    2015
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_experience 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND hospital = 'Rumah Sakit Jantung Harapan Kita'
    AND year = 2015
);

INSERT INTO doctor_experience (doctor_id, position, hospital, year)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    'Dokter Spesialis Saraf',
    'Rumah Sakit Umum Pusat Dr. Soetomo',
    2014
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_experience 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND hospital = 'Rumah Sakit Umum Pusat Dr. Soetomo'
    AND year = 2014
);

INSERT INTO doctor_experience (doctor_id, position, hospital, year)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    'Dokter Spesialis Saraf',
    'Rumah Sakit Pusat Otak Nasional',
    2016
WHERE NOT EXISTS (
    SELECT 1 FROM doctor_experience 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND hospital = 'Rumah Sakit Pusat Otak Nasional'
    AND year = 2016
);

INSERT INTO reviews (doctor_id, patient_id, rating, comment, created_at)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    (SELECT id FROM users WHERE email = 'ani@example.com'),
    5,
    'Dokter sangat ramah dan profesional. Penjelasannya detail dan mudah dimengerti.',
    DATE_SUB(NOW(), INTERVAL 10 DAY)
WHERE NOT EXISTS (
    SELECT 1 FROM reviews 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND patient_id = (SELECT id FROM users WHERE email = 'ani@example.com')
);

INSERT INTO reviews (doctor_id, patient_id, rating, comment, created_at)
SELECT 
    (SELECT id FROM users WHERE email = 'siti@example.com'),
    (SELECT id FROM users WHERE email = 'rudi@example.com'),
    4,
    'Pelayanan yang baik, tapi waktu tunggu agak lama.',
    DATE_SUB(NOW(), INTERVAL 5 DAY)
WHERE NOT EXISTS (
    SELECT 1 FROM reviews 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'siti@example.com')
    AND patient_id = (SELECT id FROM users WHERE email = 'rudi@example.com')
);

INSERT INTO reviews (doctor_id, patient_id, rating, comment, created_at)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    (SELECT id FROM users WHERE email = 'ani@example.com'),
    5,
    'Dokter sangat ahli dalam bidangnya. Sangat membantu dalam mendiagnosis masalah saraf saya.',
    DATE_SUB(NOW(), INTERVAL 7 DAY)
WHERE NOT EXISTS (
    SELECT 1 FROM reviews 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND patient_id = (SELECT id FROM users WHERE email = 'ani@example.com')
);

INSERT INTO reviews (doctor_id, patient_id, rating, comment, created_at)
SELECT 
    (SELECT id FROM users WHERE email = 'budi@example.com'),
    (SELECT id FROM users WHERE email = 'rudi@example.com'),
    4,
    'Dokter memberikan penjelasan yang detail tentang kondisi saya.',
    DATE_SUB(NOW(), INTERVAL 3 DAY)
WHERE NOT EXISTS (
    SELECT 1 FROM reviews 
    WHERE doctor_id = (SELECT id FROM users WHERE email = 'budi@example.com')
    AND patient_id = (SELECT id FROM users WHERE email = 'rudi@example.com')
); 