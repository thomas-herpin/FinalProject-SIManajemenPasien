module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'rahasiaaaaaaaaaa',
  
  cookieOptions: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, 
    path: '/',
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production'
  },
  
  port: process.env.PORT || 3000,
  
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medical_health',
    port: process.env.DB_PORT || 3306
  }
}; 