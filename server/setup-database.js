const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    // Connection without database to create it
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'nsengiyumva#2007'
    });

    console.log('Connected to MySQL server');

    // Create database if not exists
    const databaseName = process.env.DB_NAME || 'timetable_system';
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
    console.log(`Database "${databaseName}" created or already exists`);

    // Switch to the database
    await connection.query(`USE \`${databaseName}\``);

    // Read and execute SQL file
    const sqlFile = path.join(__dirname, 'database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split SQL file into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Executing ${statements.length} SQL statements...`);

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
          console.log('✓ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log('✗ Error:', error.message);
          }
        }
      }
    }

    console.log('Database setup completed successfully!');
    await connection.end();

  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config();

setupDatabase();
