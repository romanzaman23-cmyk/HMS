// Database Initialization & Seed Script for Highlight Model School
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  console.log('--- Initializing Highlight Model School Database ---');
  console.log(`Target Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  console.log(`Target User: ${process.env.DB_USER || 'root'}`);
  console.log(`Database Name: ${process.env.DB_NAME || 'highlight_school'}`);

  let connection;
  try {
    // 1. Connect to MySQL server without DB selected
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });
    console.log('✓ Successfully connected to MySQL server.');

    // 2. Read schema.sql
    const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('✓ Executing schema.sql to create database and tables...');
    await connection.query(schemaSql);
    console.log('✓ Schema and all 14 relational tables created successfully.');

    // 3. Read seed.sql
    const seedPath = path.join(__dirname, '..', '..', 'database', 'seed.sql');
    if (fs.existsSync(seedPath)) {
      console.log('✓ Executing seed.sql to populate initial data...');
      
      // Update seed with freshly generated bcrypt hashes for reliability
      let seedSql = fs.readFileSync(seedPath, 'utf8');
      const adminHash = await bcrypt.hash('Admin@123', 10);
      const parentHash = await bcrypt.hash('Parent@123', 10);

      seedSql = seedSql.replace(
        /'admin@highlight\.school',\s*'[^']+'/,
        `'admin@highlight.school', '${adminHash}'`
      );
      seedSql = seedSql.replace(
        /'parent@highlight\.school',\s*'[^']+'/,
        `'parent@highlight.school', '${parentHash}'`
      );

      await connection.query(seedSql);
      console.log('✓ Seed data inserted successfully (Admin and Parent credentials configured).');
    }

    console.log('\n======================================================');
    console.log(' DATABASE INITIALIZATION COMPLETE!');
    console.log(' Admin Login: admin@highlight.school / Admin@123');
    console.log(' Parent Login: parent@highlight.school / Parent@123');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.error('Make sure MySQL service is running on port 3306 with the specified credentials in backend/.env.');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
