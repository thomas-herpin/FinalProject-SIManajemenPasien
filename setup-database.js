const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  console.log('Setting up database...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  };
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL server');
    
    await connection.query('CREATE DATABASE IF NOT EXISTS medical_health');
    console.log('Database medical_health created or already exists');
    
    await connection.query('USE medical_health');
    console.log('Using database medical_health');
    
    const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Executing schema.sql...');
    try {
      await connection.query(schemaSql);
      console.log('Schema created successfully');
    } catch (schemaError) {
      console.error('Error creating schema:', schemaError.message);
    }
    
    const sampleDataPath = path.join(__dirname, 'src', 'config', 'sample_data.sql');
    const sampleDataSql = fs.readFileSync(sampleDataPath, 'utf8');
    console.log('Executing sample_data.sql...');
    try {
      await connection.query(sampleDataSql);
      console.log('Sample data inserted successfully');
    } catch (dataError) {
      console.error('Error inserting sample data:', dataError.message);
    }
    
    await connection.end();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase(); 