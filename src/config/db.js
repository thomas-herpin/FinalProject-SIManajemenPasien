const mysql = require('mysql2');
require('dotenv').config();

// Get database connection parameters from environment variables or use defaults
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medical_health',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Create a connection pool
const pool = mysql.createPool(dbConfig);

// Error handling for connection errors
pool.on('connection', (connection) => {
    console.log('New database connection established');
    connection.on('error', (err) => {
        console.error('Database connection error:', err);
    });
});

pool.on('error', (err) => {
    console.error('Database pool error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Database connection lost. Reconnecting...');
    }
});

// Convert pool to promise-based
const promisePool = pool.promise();

module.exports = promisePool; 