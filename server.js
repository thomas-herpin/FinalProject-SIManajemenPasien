require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const db = require('./src/config/db');
const doctorRoutes = require('./src/routes/doctors');
const notificationRoutes = require('./src/routes/notifications');

// Load configuration
const config = require('./src/config');
const JWT_SECRET = config.jwtSecret;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path, stat) => {
    if (path.endsWith('.css')) {
      res.set('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.set('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.set('Content-Type', 'image/png');
    } else if (path.endsWith('.svg')) {
      res.set('Content-Type', 'image/svg+xml');
    }
  }
}));

app.use('/api/doctors', doctorRoutes);
app.use('/api/notifications', notificationRoutes);

app.use((req, res, next) => {
  next();
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  db.query(`
    SELECT id, name, email, password, role
    FROM users
    WHERE email = ?
  `, [email])
    .then(([results]) => {
      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      const user = results[0];
      return bcrypt.compare(password, user.password)
        .then(isMatch => {
          if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
          }
          const token = jwt.sign(
            { 
              userId: user.id,
              role: user.role
            },
            JWT_SECRET,
            { expiresIn: '7d' }
          );
          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
          });
          res.cookie('auth_status', 'authenticated', {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000
          });
          return res.json({
            user: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });
        });
    })
    .catch(err => {
      return res.status(500).json({ message: 'Error during login process' });
    });
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.query(`
    SELECT id, name, email, role
    FROM users
    WHERE id = ?
  `, [req.user.userId])
    .then(([results]) => {
      if (results.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      const userInfo = results[0];
      res.json(userInfo);
    })
    .catch(err => {
      return res.status(500).json({ message: 'Error fetching user data' });
    });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', {
    path: '/',
    httpOnly: true,
    sameSite: 'lax'
  });
  res.clearCookie('auth_status', {
    path: '/',
    httpOnly: false,
    sameSite: 'lax'
  });
  res.json({ message: 'Logged out successfully' });
});

function authenticateToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }
  let responseHandled = false;
  db.query(`
    SELECT id FROM users WHERE email = ?
  `, [email])
    .then(([results]) => {
      if (responseHandled) return;
      if (results.length > 0) {
        responseHandled = true;
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      return bcrypt.hash(password, saltRounds);
    })
    .then(hashedPassword => {
      if (responseHandled) return;
      const role = 'user';
      return db.query(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, ?)
      `, [name, email, hashedPassword, role]);
    })
    .then(result => {
      if (responseHandled) return;
      if (!result || !result[0]) {
        responseHandled = true;
        return res.status(500).json({ message: 'Error creating user' });
      }
      responseHandled = true;
      return res.status(201).json({ message: 'User registered successfully' });
    })
    .catch(err => {
      if (responseHandled) return;
      responseHandled = true;
      return res.status(500).json({ message: 'Error during registration' });
    });
});

app.get('/api/recommended-doctors', (req, res, next) => {
  try {
    db.query(`
      SELECT u.id, u.name, d.specialty, d.experience, d.bio, d.image_url, d.rating, d.review_count
      FROM users u
      JOIN doctor_profiles d ON u.id = d.user_id
      WHERE u.role = 'doctor'
      ORDER BY d.rating DESC, d.experience DESC
      LIMIT 3
    `).then(([doctors]) => {
      res.json(doctors);
    }).catch(err => {
      const mockRecommendedDoctors = [
        {
          id: '1',
          name: 'Dr. Siti Aminah',
          specialty: 'Kardiologi',
          experience: '10 tahun',
          rating: 4.8,
          patients: 1200,
          image: '/assets/doctor1.jpg',
          bio: 'Dr. Siti Aminah adalah spesialis kardiologi dengan pengalaman lebih dari 10 tahun.'
        },
        {
          id: '2',
          name: 'Dr. Budi Santoso',
          specialty: 'Neurologi',
          experience: '8 tahun',
          rating: 4.7,
          patients: 950,
          image: '/assets/doctor2.jpg',
          bio: 'Dr. Budi Santoso adalah spesialis neurologi dengan keahlian dalam penanganan stroke.'
        },
        {
          id: '3',
          name: 'Dr. Dewi Putri',
          specialty: 'Dermatologi',
          experience: '6 tahun',
          rating: 4.9,
          patients: 1500,
          image: '/assets/doctor3.jpg',
          bio: 'Dr. Dewi Putri adalah spesialis dermatologi dengan keahlian dalam perawatan kulit.'
        }
      ];
      res.json(mockRecommendedDoctors);
    });
  } catch (error) {
    next(error);
  }
});

app.get('/api/notifications', authenticateToken, (req, res) => {
  const notifications = [
    {
      id: '1',
      title: 'Janji Temu Dikonfirmasi',
      message: 'Janji temu Anda dengan Dr. Siti Aminah telah dikonfirmasi untuk tanggal 15 Mei 2023 pukul 10:00.',
      time: '2 jam yang lalu',
      read: false,
      type: 'appointment'
    },
    {
      id: '2',
      title: 'Pengingat Konsultasi',
      message: 'Jangan lupa konsultasi online Anda dengan Dr. Budi Santoso besok pukul 15:00.',
      time: '5 jam yang lalu',
      read: true,
      type: 'reminder'
    },
    {
      id: '3',
      title: 'Hasil Laboratorium',
      message: 'Hasil pemeriksaan laboratorium Anda telah tersedia. Silakan cek di menu Rekam Medis.',
      time: '1 hari yang lalu',
      read: false,
      type: 'lab'
    }
  ];
  res.json(notifications);
});

const appointments = [];

app.get('/api/dashboard/doctor-statistics/:doctorId', authenticateToken, (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    
    db.query(`
      SELECT COUNT(*) as appointment_count
      FROM appointments
      WHERE doctor_id = ?
    `, [doctorId])
    .then(([appointmentResults]) => {
      const appointmentCount = appointmentResults[0]?.appointment_count || 0;
      
      return db.query(`
        SELECT COUNT(DISTINCT patient_id) as patient_count
        FROM appointments
        WHERE doctor_id = ?
      `, [doctorId])
      .then(([patientResults]) => {
        const patientCount = patientResults[0]?.patient_count || 0;
        
        return db.query(`
          SELECT COUNT(*) * 0.5 as total_hours
          FROM appointments
          WHERE doctor_id = ? AND status = 'completed'
        `, [doctorId])
        .then(([hoursResults]) => {
          const workHours = Math.round(hoursResults[0]?.total_hours || 0);
          
          res.json({
            appointments: appointmentCount,
            patients: patientCount,
            workHours: workHours
          });
        });
      });
    })
    .catch(err => {
      console.error('Database error:', err);
      const doctorAppointments = appointments.filter(app => app.doctorId === doctorId);
      const uniquePatients = new Set(doctorAppointments.map(app => app.patientEmail)).size;
      const workHours = doctorAppointments.length * 0.5;
      
      res.json({
        appointments: doctorAppointments.length,
        patients: uniquePatients,
        workHours: Math.round(workHours)
      });
    });
  } catch (error) {
    console.error('Error fetching doctor statistics:', error);
    res.status(500).json({ message: 'Error fetching doctor statistics' });
  }
});

app.get('/api/appointments/doctor/:doctorId/today', authenticateToken, (req, res) => {
  try {
    const doctorId = req.params.doctorId;
    const today = new Date().toISOString().split('T')[0];
    
    db.query(`
      SELECT a.id, a.date, a.time, 
             u.name as patientName, u.email as patientEmail, 
             a.status
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = ? 
      AND a.date = ?
      ORDER BY a.time ASC
    `, [doctorId, today])
    .then(([results]) => {
      const mappedResults = results.map(app => ({
        id: app.id,
        appointmentDate: app.date,
        appointmentTime: app.time,
        patientName: app.patientName,
        patientEmail: app.patientEmail,
        notes: app.notes || '',
        status: app.status
      }));
      res.json(mappedResults);
    })
    .catch(err => {
      console.error('Database error:', err);
      const todayAppointments = appointments.filter(app => 
        app.doctorId === doctorId && 
        app.appointmentDate === today
      );
      res.json(todayAppointments);
    });
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({ message: 'Error fetching today\'s appointments' });
  }
});

app.post('/api/notifications/send', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors can send patient notifications' });
    }
    
    const { patientId, message, type } = req.body;
    
    if (!patientId || !message) {
      return res.status(400).json({ message: 'Patient ID and message are required' });
    }
    
    db.query(`
      INSERT INTO notifications 
      (user_id, sender_id, message, type, created_at, read)
      VALUES (?, ?, ?, ?, NOW(), 0)
    `, [patientId, req.user.userId, message, type || 'doctor_message'])
    .then(([result]) => {
      if (result.affectedRows > 0) {
        res.status(201).json({ message: 'Notification sent successfully' });
      } else {
        throw new Error('Failed to send notification');
      }
    })
    .catch(err => {
      console.error('Database error:', err);
      res.status(500).json({ message: 'Error sending notification' });
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/doctors/:doctorId/patients', authenticateToken, (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        
        if (req.user.userId !== doctorId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }
        
        db.query(`
            SELECT DISTINCT u.id, u.name, u.email, 
                TIMESTAMPDIFF(YEAR, u.birthdate, CURDATE()) as age,
                u.gender,
                (SELECT MAX(a.date) FROM appointments a WHERE a.doctor_id = ? AND a.patient_id = u.id) as last_consultation,
                (SELECT a.complaint FROM appointments a WHERE a.doctor_id = ? AND a.patient_id = u.id ORDER BY a.date DESC LIMIT 1) as last_complaint,
                'active' as status
            FROM users u
            JOIN appointments a ON u.id = a.patient_id
            WHERE a.doctor_id = ?
            ORDER BY last_consultation DESC
        `, [doctorId, doctorId, doctorId])
        .then(([results]) => {
            res.json(results);
        })
        .catch(err => {
            console.error('Database error:', err);
            res.status(500).json({ message: 'Error fetching patients' });
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { userId, doctorId, patientName, patientEmail, patientPhone, appointmentDate, appointmentTime, notes, symptoms } = req.body;
    
    if (!doctorId || !patientName || !patientEmail || !patientPhone || !appointmentDate || !appointmentTime) {
      return res.status(400).json({ message: 'Semua kolom wajib diisi' });
    }
    
    let patientId;
    const [existingPatients] = await db.query('SELECT id FROM users WHERE email = ?', [patientEmail]);
    
    if (existingPatients.length > 0) {
      patientId = existingPatients[0].id;
    } else {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, saltRounds);
      
      const [newUser] = await db.query(
        'INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)',
        [patientName, patientEmail, hashedPassword, 'user', patientPhone, '']
      );
      
      patientId = newUser.insertId;
    }
    
    const [result] = await db.query(
      'INSERT INTO appointments (patient_id, doctor_id, date, time, status, symptoms, complaint, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
      [patientId, doctorId, appointmentDate, appointmentTime, 'pending', symptoms || '', symptoms || '', notes || '']
    );
    
    const [newAppointment] = await db.query(
      'SELECT a.*, u.name as patient_name, u.email as patient_email FROM appointments a JOIN users u ON a.patient_id = u.id WHERE a.id = ?',
      [result.insertId]
    );
    
    res.status(201).json({
      message: 'Janji temu berhasil dibuat',
      appointment: newAppointment[0]
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat membuat janji temu' });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const userId = req.query.userId;
    const limit = parseInt(req.query.limit) || 10;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const [userResults] = await db.query('SELECT role FROM users WHERE id = ?', [userId]);
    if (userResults.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userRole = userResults[0].role;
    let query, params;
    
    if (userRole === 'doctor') {
      query = `
        SELECT a.*, u.name as patient_name, u.email as patient_email 
        FROM appointments a 
        JOIN users u ON a.patient_id = u.id 
        WHERE a.doctor_id = ? 
        ORDER BY a.date DESC, a.time DESC 
        LIMIT ?
      `;
      params = [userId, limit];
    } else {
      query = `
        SELECT a.*, d.name as doctor_name 
        FROM appointments a 
        JOIN users d ON a.doctor_id = d.id 
        WHERE a.patient_id = ? 
        ORDER BY a.date DESC, a.time DESC 
        LIMIT ?
      `;
      params = [userId, limit];
    }
    
    const [appointments] = await db.query(query, params);
    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Terjadi kesalahan saat mengambil data janji temu' });
  }
});

app.post('/api/notifications/:id/read', authenticateToken, (req, res) => {
  const notification = { id: req.params.id, read: true };
  res.json({ message: 'Notification marked as read' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  if (req.path.endsWith('.html')) {
    const basePath = req.path.replace('.html', '');
    switch (basePath) {
      case '/dashboard':
        return res.redirect('/dashboard');
      case '/dokter':
        return res.redirect('/dokter');
      case '/notifikasi':
        return res.redirect('/notifikasi');
      case '/profil':
        return res.redirect('/profil');
      case '/form':
        return res.redirect('/form');
      case '/payment':
        return res.redirect('/payment');
      default:
        return res.status(404).send('Page not found');
    }
  }

  if (req.path === '/dashboard') {
    const token = req.cookies.token;
    if (!token) {
      return res.redirect('/');
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const userRole = decoded.role;
      
      switch(userRole) {
        case 'admin':
          return res.redirect('/dashboard-admin');
        case 'doctor':
          return res.redirect('/dashboard-dokter');
        default:
          return res.redirect('/dashboard-user');
      }
    } catch(err) {
      console.error('Token verification failed:', err.message);
      return res.redirect('/');
    }
  }
  
  switch (req.path) {
    case '/dashboard-user':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'dashboard-user.html'));
    case '/dashboard-admin':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'dashboard-admin.html'));
    case '/dashboard-dokter':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'dashboard-dokter.html'));
    case '/dokter':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'user-fulldoctor.html'));
    case '/notifikasi':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'user-notifikasi.html'));
    case '/profil':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'user-profile.html'));
    case '/booking':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'user-booking1.html'));
    case '/form':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'user-form.html'));
    case '/rekam-medis':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'rekam-medis.html'));
    case '/payment':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'payment.html'));
    case '/jadwal-dokter':
    case '/dokter-jadwal':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'dokter-jadwal.html'));
    case '/pasien-dokter':
    case '/dokter-pasien':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'dokter-pasien.html'));
    case '/laporan-dokter':
    case '/dokter-laporan':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'dokter-laporan.html'));
    case '/notifikasi-dokter':
      return res.sendFile(path.join(__dirname, 'public', 'html', 'dokter-notifikasi.html'));
    default:
      return res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working correctly' });
});

app.get('/api/doctors/:doctorId/schedules', authenticateToken, async (req, res) => {
    try {
        const { doctorId } = req.params;
        const [schedules] = await db.query(
            'SELECT * FROM doctor_schedules WHERE doctor_id = ? ORDER BY date DESC',
            [doctorId]
        );
        res.json(schedules);
    } catch (error) {
        console.error('Error fetching doctor schedules:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.post('/api/doctors/:doctorId/schedules', authenticateToken, async (req, res) => {
    try {
        const { doctorId } = req.params;
        const { date, start_time, end_time, status } = req.body;

        const [overlapping] = await db.query(
            `SELECT * FROM doctor_schedules 
             WHERE doctor_id = ? AND date = ? 
             AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
            [doctorId, date, end_time, start_time, end_time, start_time]
        );

        if (overlapping.length > 0) {
            return res.status(400).json({ message: 'Jadwal bentrok dengan jadwal lain' });
        }

        const [result] = await db.query(
            'INSERT INTO doctor_schedules (doctor_id, date, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
            [doctorId, date, start_time, end_time, status]
        );

        res.json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Error creating doctor schedule:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/doctors/:doctorId/schedules/:scheduleId', authenticateToken, async (req, res) => {
    try {
        const { doctorId, scheduleId } = req.params;
        const { date, start_time, end_time, status } = req.body;

        const [overlapping] = await db.query(
            `SELECT * FROM doctor_schedules 
             WHERE doctor_id = ? AND date = ? AND id != ?
             AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))`,
            [doctorId, date, scheduleId, end_time, start_time, end_time, start_time]
        );

        if (overlapping.length > 0) {
            return res.status(400).json({ message: 'Jadwal bentrok dengan jadwal lain' });
        }

        const [result] = await db.query(
            'UPDATE doctor_schedules SET date = ?, start_time = ?, end_time = ?, status = ? WHERE id = ? AND doctor_id = ?',
            [date, start_time, end_time, status, scheduleId, doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating doctor schedule:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/doctors/:doctorId/schedules/:scheduleId', authenticateToken, async (req, res) => {
    try {
        const { doctorId, scheduleId } = req.params;
        const [result] = await db.query(
            'DELETE FROM doctor_schedules WHERE id = ? AND doctor_id = ?',
            [scheduleId, doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting doctor schedule:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/doctors/:doctorId/work-hours', authenticateToken, async (req, res) => {
    try {
        const { doctorId } = req.params;
        
        const today = new Date();
        const workHours = [];
        
        for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            
            if (date.getDay() === 0 || date.getDay() === 6) continue;
            
            const startHour = 8 + Math.floor(Math.random() * 2); // 8 or 9 AM
            const startTime = `${startHour.toString().padStart(2, '0')}:00:00`;
            
            const endHour = 16 + Math.floor(Math.random() * 2); // 4 or 5 PM
            const endTime = `${endHour.toString().padStart(2, '0')}:00:00`;
            
            const rand = Math.random();
            let status;
            if (rand < 0.8) status = 'present';
            else if (rand < 0.9) status = 'absent';
            else status = 'late';
            
            workHours.push({
                id: i + 1,
                date: date.toISOString().split('T')[0],
                start_time: startTime,
                end_time: endTime,
                status,
                notes: status === 'late' ? 'Terlambat karena macet' : null
            });
        }
        
        res.json(workHours);
    } catch (error) {
        console.error('Error fetching doctor work hours:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/doctors/:doctorId/appointments/count', authenticateToken, async (req, res) => {
    try {
        const { doctorId } = req.params;
        const [result] = await db.query(
            'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?',
            [doctorId]
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('Error fetching appointment count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/doctors/:doctorId/patients/count', authenticateToken, async (req, res) => {
    try {
        const { doctorId } = req.params;
        const [result] = await db.query(
            'SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = ?',
            [doctorId]
        );
        res.json({ count: result[0].count });
    } catch (error) {
        console.error('Error fetching patient count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.get('/api/doctors/:doctorId/appointments/today', authenticateToken, async (req, res) => {
    try {
        const { doctorId } = req.params;
        const today = new Date().toISOString().split('T')[0];
        
        const [appointments] = await db.query(`
            SELECT a.*, u.name as patient_name, u.email as patient_email
            FROM appointments a
            JOIN users u ON a.patient_id = u.id
            WHERE a.doctor_id = ? AND a.date = ?
            ORDER BY a.time ASC
        `, [doctorId, today]);
        
        res.json(appointments);
    } catch (error) {
        console.error('Error fetching today\'s appointments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/users/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, birthdate, gender, address } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ message: 'Nama dan email harus diisi' });
    }
    
    const emailCheck = await db.query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, userId]
    );
    
    if (emailCheck.length > 0) {
      return res.status(400).json({ message: 'Email sudah digunakan oleh pengguna lain' });
    }
    
    await db.query(
      `UPDATE users SET 
        name = ?, 
        email = ?, 
        phone = ?, 
        birthdate = ?, 
        gender = ?, 
        address = ?, 
        updated_at = NOW() 
      WHERE id = ?`,
      [name, email, phone || null, birthdate || null, gender || null, address || null, userId]
    );
    
    const [updatedUser] = await db.query(
      'SELECT id, name, email, phone, birthdate, gender, address, role, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT id, name, email, phone, birthdate, gender, address, role, created_at FROM users WHERE id = ?',
            [req.user.id]
        );
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to access the application`);
});