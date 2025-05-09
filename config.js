module.exports = {
  // JWT settings
  jwtSecret: process.env.JWT_SECRET || 'rahasiaaaaaaaaaa',
  
  // Cookie settings
  cookieOptions: {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    path: '/',
    sameSite: 'Lax'
  },
  
  // Server settings
  port: process.env.PORT || 3000,
  
  // Database settings
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medical_health',
    port: process.env.DB_PORT || 3306
  }
}; 