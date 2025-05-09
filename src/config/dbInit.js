const db = require('./db');

async function initializeDatabase() {
    try {
        console.log('Initializing database...');

        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role ENUM('user', 'doctor', 'admin') NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS doctor_profiles (
                user_id INT PRIMARY KEY,
                specialty VARCHAR(255) NOT NULL,
                experience INT DEFAULT 0,
                bio TEXT,
                image_url VARCHAR(255),
                rating DECIMAL(3,1) DEFAULT 0.0,
                review_count INT DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS doctor_specializations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                specialization VARCHAR(255) NOT NULL,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS doctor_education (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                institution VARCHAR(255) NOT NULL,
                degree VARCHAR(255) NOT NULL,
                year VARCHAR(100) NOT NULL,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS doctor_experience (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                position VARCHAR(255) NOT NULL,
                hospital VARCHAR(255) NOT NULL,
                year VARCHAR(100) NOT NULL,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS schedules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                day_of_week INT NOT NULL,
                start_time TIME NOT NULL,
                end_time TIME NOT NULL,
                status ENUM('active', 'inactive') DEFAULT 'active',
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                date DATE NOT NULL,
                time TIME NOT NULL,
                status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
                FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id INT AUTO_INCREMENT PRIMARY KEY,
                doctor_id INT NOT NULL,
                patient_id INT NOT NULL,
                appointment_id INT,
                rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS medical_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                appointment_id INT,
                diagnosis TEXT NOT NULL,
                prescription TEXT,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
            )
        `);

        await db.query(`
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                appointment_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
                payment_method VARCHAR(50),
                payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
            )
        `);

        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        
        if (userCount[0].count === 0) {
            console.log('Database is empty, inserting sample data...');
            await insertSampleData();
        }

        console.log('Database initialization completed successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

async function insertSampleData() {
    try {
        await db.query(`
            INSERT INTO users (name, email, password, role) VALUES
            ('Admin User', 'admin@example.com', '$2a$10$FBKBaYq5y/zYbR1wtTPsUeaQgqkgvLOhy.u1f9JEDu3gopbkOBNYm', 'admin'),
            ('Dr. John Smith', 'doctor1@example.com', '$2a$10$FBKBaYq5y/zYbR1wtTPsUeaQgqkgvLOhy.u1f9JEDu3gopbkOBNYm', 'doctor'),
            ('Dr. Sarah Johnson', 'doctor2@example.com', '$2a$10$FBKBaYq5y/zYbR1wtTPsUeaQgqkgvLOhy.u1f9JEDu3gopbkOBNYm', 'doctor'),
            ('Dr. Andi Wijaya', 'doctor3@example.com', '$2a$10$FBKBaYq5y/zYbR1wtTPsUeaQgqkgvLOhy.u1f9JEDu3gopbkOBNYm', 'doctor'),
            ('Dr. Siti Rahayu', 'doctor4@example.com', '$2a$10$FBKBaYq5y/zYbR1wtTPsUeaQgqkgvLOhy.u1f9JEDu3gopbkOBNYm', 'doctor'),
            ('Jane Doe', 'patient1@example.com', '$2a$10$FBKBaYq5y/zYbR1wtTPsUeaQgqkgvLOhy.u1f9JEDu3gopbkOBNYm', 'user'),
            ('John Doe', 'patient2@example.com', '$2a$10$FBKBaYq5y/zYbR1wtTPsUeaQgqkgvLOhy.u1f9JEDu3gopbkOBNYm', 'user')
        `);

        await db.query(`
            INSERT INTO doctor_profiles (user_id, specialty, experience, bio, image_url, rating, review_count) VALUES
            (2, 'Cardiology', 10, 'Dr. John Smith adalah dokter spesialis jantung berpengalaman dengan lebih dari 10 tahun praktik klinis. Beliau dikenal karena pendekatan holistik dalam perawatan kardiovaskular dan fokus pada pencegahan penyakit jantung.', '/assets/doctor1.jpg', 4.8, 156),
            (3, 'Pediatrics', 8, 'Dr. Sarah Johnson adalah dokter spesialis anak yang berdedikasi dengan pengalaman lebih dari 8 tahun dalam merawat anak-anak dari semua usia. Beliau dikenal karena pendekatan yang penuh kasih sayang dan kemampuannya untuk membuat anak-anak merasa nyaman selama perawatan medis.', '/assets/doctor2.jpg', 4.7, 98),
            (4, 'Kardiologi', 15, 'Dr. Andi Wijaya adalah dokter spesialis jantung berpengalaman dengan lebih dari 15 tahun praktik klinis. Beliau lulus dari Fakultas Kedokteran Universitas Indonesia dengan predikat cumlaude dan menyelesaikan spesialisasi di bidang kardiologi di Rumah Sakit Jantung dan Pembuluh Darah Harapan Kita.', '/assets/doctor-placeholder.jpg', 4.9, 156),
            (5, 'Pediatri', 12, 'Dr. Siti Rahayu adalah dokter spesialis anak yang berdedikasi dengan pengalaman lebih dari 12 tahun dalam merawat anak-anak dari semua usia. Beliau dikenal karena pendekatan yang penuh kasih sayang dan kemampuannya untuk membuat anak-anak merasa nyaman selama perawatan medis.', '/assets/doctor-placeholder.jpg', 4.7, 120)
        `);

        await db.query(`
            INSERT INTO doctor_specializations (doctor_id, specialization) VALUES
            (2, 'Cardiovascular Disease'),
            (2, 'Heart Failure'),
            (2, 'Hypertension Management'),
            (3, 'General Pediatrics'),
            (3, 'Childhood Development'),
            (3, 'Immunizations'),
            (4, 'Kardiologi Intervensi'),
            (4, 'Aritmia'),
            (4, 'Gagal Jantung'),
            (4, 'Hipertensi'),
            (5, 'Pediatri Umum'),
            (5, 'Imunisasi'),
            (5, 'Tumbuh Kembang Anak'),
            (5, 'Alergi Anak')
        `);

        await db.query(`
            INSERT INTO doctor_education (doctor_id, institution, degree, year) VALUES
            (2, 'Harvard Medical School', 'Doctor of Medicine', '2000-2004'),
            (2, 'Johns Hopkins Hospital', 'Residency in Internal Medicine', '2004-2007'),
            (2, 'Cleveland Clinic', 'Fellowship in Cardiology', '2007-2010'),
            (3, 'Stanford University School of Medicine', 'Doctor of Medicine', '2003-2007'),
            (3, 'Boston Children\\'s Hospital', 'Residency in Pediatrics', '2007-2010'),
            (4, 'Universitas Indonesia', 'Dokter Umum', '2000-2006'),
            (4, 'Universitas Indonesia', 'Spesialis Jantung dan Pembuluh Darah', '2007-2011'),
            (5, 'Universitas Gadjah Mada', 'Dokter Umum', '2005-2011'),
            (5, 'Universitas Indonesia', 'Spesialis Anak', '2012-2016')
        `);

        await db.query(`
            INSERT INTO doctor_experience (doctor_id, position, hospital, year) VALUES
            (2, 'Cardiologist', 'Mayo Clinic', '2010-2015'),
            (2, 'Senior Cardiologist', 'Medical Health Center', '2015-Present'),
            (3, 'Pediatrician', 'Children\\'s Hospital of Philadelphia', '2010-2014'),
            (3, 'Senior Pediatrician', 'Medical Health Center', '2014-Present'),
            (4, 'Dokter Spesialis Jantung', 'RS Medical Health Center', '2012-Present'),
            (4, 'Konsultan Kardiologi', 'RS Jantung Harapan Kita', '2011-2012'),
            (5, 'Dokter Spesialis Anak', 'RS Medical Health Center', '2017-Present'),
            (5, 'Dokter Spesialis Anak', 'RSCM', '2016-2017')
        `);

        await db.query(`
            INSERT INTO schedules (doctor_id, day_of_week, start_time, end_time, status) VALUES
            (2, 1, '09:00:00', '12:00:00', 'active'),
            (2, 1, '13:00:00', '17:00:00', 'active'),
            (2, 3, '09:00:00', '12:00:00', 'active'),
            (2, 3, '13:00:00', '17:00:00', 'active'),
            (2, 5, '09:00:00', '14:00:00', 'active'),
            (3, 2, '10:00:00', '14:00:00', 'active'),
            (3, 2, '15:00:00', '18:00:00', 'active'),
            (3, 4, '10:00:00', '14:00:00', 'active'),
            (3, 4, '15:00:00', '18:00:00', 'active'),
            (4, 1, '08:00:00', '12:00:00', 'active'),
            (4, 2, '13:00:00', '17:00:00', 'active'),
            (4, 4, '08:00:00', '12:00:00', 'active'),
            (4, 5, '13:00:00', '17:00:00', 'active'),
            (5, 1, '13:00:00', '17:00:00', 'active'),
            (5, 3, '08:00:00', '12:00:00', 'active'),
            (5, 3, '13:00:00', '17:00:00', 'active'),
            (5, 5, '08:00:00', '12:00:00', 'active')
        `);

        await db.query(`
            INSERT INTO reviews (doctor_id, patient_id, rating, comment) VALUES
            (2, 6, 5, 'Dr. Smith is an excellent cardiologist. He explained everything clearly and made me feel at ease.'),
            (2, 7, 5, 'Knowledgeable doctor with great bedside manner. Highly recommend!'),
            (3, 6, 4, 'Dr. Johnson is wonderful with children. My son was initially afraid but she quickly made him feel comfortable.'),
            (3, 7, 5, 'Excellent pediatrician. Very thorough and caring.'),
            (4, 6, 5, 'Dr. Andi Wijaya sangat profesional dan memiliki pendekatan yang sangat baik dengan pasien.'),
            (4, 7, 5, 'Dokter terbaik untuk masalah jantung. Penjelasannya detail dan mudah dipahami.'),
            (5, 6, 5, 'Dr. Siti sangat sabar dengan anak-anak. Anak saya senang saat pemeriksaan.'),
            (5, 7, 4, 'Dokter anak yang profesional. Memberikan solusi yang tepat untuk masalah kesehatan anak saya.')
        `);

        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        
        await db.query(`
            INSERT INTO appointments (patient_id, doctor_id, date, time, status) VALUES
            (6, 2, '${today}', '10:00:00', 'scheduled'),
            (6, 3, '${tomorrow}', '11:00:00', 'scheduled'),
            (7, 2, '${today}', '14:00:00', 'scheduled'),
            (7, 3, '${tomorrow}', '15:00:00', 'scheduled'),
            (6, 4, '${nextWeek}', '09:00:00', 'scheduled'),
            (7, 5, '${nextWeek}', '14:00:00', 'scheduled')
        `);

        await db.query(`
            INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, prescription, notes) VALUES
            (6, 2, 1, 'Hypertension', 'Lisinopril 10mg daily', 'Follow up in 3 months'),
            (7, 3, 3, 'Common cold', 'Rest and fluids', 'Should recover within a week')
        `);

        console.log('Sample data inserted successfully');
    } catch (error) {
        console.error('Error inserting sample data:', error);
    }
}

module.exports = initializeDatabase; 