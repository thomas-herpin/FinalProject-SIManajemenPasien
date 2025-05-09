require('dotenv').config();
const db = require('./config/db');
const initializeDatabase = require('./config/dbInit');

async function dropTables() {
    try {
        console.log('Dropping existing tables...');
        
        await db.query('DROP TABLE IF EXISTS reviews');
        await db.query('DROP TABLE IF EXISTS payments');
        await db.query('DROP TABLE IF EXISTS medical_records');
        await db.query('DROP TABLE IF EXISTS appointments');
        await db.query('DROP TABLE IF EXISTS schedules');
        await db.query('DROP TABLE IF EXISTS doctor_experience');
        await db.query('DROP TABLE IF EXISTS doctor_education');
        await db.query('DROP TABLE IF EXISTS doctor_specializations');
        await db.query('DROP TABLE IF EXISTS doctor_profiles');
        await db.query('DROP TABLE IF EXISTS users');
        
        console.log('All tables dropped successfully');
    } catch (error) {
        console.error('Error dropping tables:', error);
    }
}

async function reinitializeDatabase() {
    try {
        await dropTables();
        await initializeDatabase();
        console.log('Database reinitialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error reinitializing database:', error);
        process.exit(1);
    }
}

reinitializeDatabase(); 