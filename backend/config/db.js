require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

let pool = null;
let isConnected = false;

// Persistent JSON storage path
const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Fallback synchronized data store populated with seed data
// Used automatically if local MySQL server is not yet started by the user
let fallbackStore = null;

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fallbackStore) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(fallbackStore, null, 2), 'utf8');
      try { lastStoreMtime = fs.statSync(STORE_FILE).mtimeMs; } catch (e) {}
    }
  } catch (err) {
    console.error('[Database] Error saving store to disk:', err.message);
  }
}

async function initFallbackStore() {
  // If persistent store exists on disk, load it
  if (fs.existsSync(STORE_FILE)) {
    try {
      const raw = fs.readFileSync(STORE_FILE, 'utf8');
      fallbackStore = JSON.parse(raw);
      console.log(`[Database] Loaded persistent data store (${fallbackStore.students?.length || 0} students) from disk.`);
      return;
    } catch (err) {
      console.warn('[Database] Failed to read store.json, re-creating defaults:', err.message);
    }
  }

  const adminHash = await bcrypt.hash('Admin@123', 10);
  const parentHash = await bcrypt.hash('Parent@123', 10);

  fallbackStore = {
    roles: [
      { id: 1, name: 'PRINCIPAL_ADMIN', description: 'School Principal & Admin' },
      { id: 2, name: 'PARENT', description: 'Parent / Guardian' }
    ],
    users: [
      {
        id: 1,
        role_id: 1,
        role_name: 'PRINCIPAL_ADMIN',
        email: 'admin@highlight.school',
        password_hash: adminHash,
        full_name: 'Admin Principal',
        phone: '+1 555-0199',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        is_active: 1
      }
    ],
    classes: [
      { id: 1, name: 'Nursery', section: 'A', room_number: 'Room 101', capacity: 30 },
      { id: 2, name: 'Prep', section: 'A', room_number: 'Room 102', capacity: 30 },
      { id: 3, name: 'Grade 1', section: 'A', room_number: 'Room 103', capacity: 30 },
      { id: 4, name: 'Grade 2', section: 'A', room_number: 'Room 104', capacity: 30 },
      { id: 5, name: 'Grade 3', section: 'A', room_number: 'Room 105', capacity: 30 },
      { id: 6, name: 'Grade 4', section: 'A', room_number: 'Room 106', capacity: 30 },
      { id: 7, name: 'Grade 5', section: 'A', room_number: 'Room 201', capacity: 35 },
      { id: 8, name: 'Grade 6', section: 'A', room_number: 'Room 202', capacity: 35 },
      { id: 9, name: 'Grade 7', section: 'A', room_number: 'Room 203', capacity: 35 },
      { id: 10, name: 'Grade 8', section: 'A', room_number: 'Room 204', capacity: 35 },
      { id: 11, name: 'Grade 9', section: 'A', room_number: 'Room 301', capacity: 40 },
      { id: 12, name: 'Grade 10', section: 'A', room_number: 'Room 302', capacity: 40 }
    ],
    parents: [],
    students: [],
    devices: [
      {
        id: 1,
        device_name: 'ZKTeco F18',
        ip_address: process.env.DEFAULT_DEVICE_IP || '192.168.1.201',
        port: parseInt(process.env.DEFAULT_DEVICE_PORT || '4370', 10),
        device_uid: '123456',
        location: 'Main Gate',
        connection_status: 'Connected',
        last_sync_time: new Date().toISOString(),
        is_active: 1
      }
    ],
    device_logs: [],
    attendance: [],
    announcements: [],
    results: [],
    result_documents: [],
    student_documents: [],
    leave_requests: [],
    notifications: [],
    punches: [],
    student_registrations: []
  };
  saveStore();
}

// Initialize database pool
async function connectDB() {
  await initFallbackStore();

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'highlight_school',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000
    });

    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isConnected = true;
    console.log(`[Database] ✓ Connected to MySQL database "${process.env.DB_NAME || 'highlight_school'}" on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
  } catch (err) {
    isConnected = false;
    console.warn(`[Database] ⚠️ MySQL not reachable (${err.message}).`);
    console.warn('[Database] Using built-in synchronized active storage store with complete seeded school data.');
    console.warn('[Database] Run `npm run db:init` after starting your local MySQL service to create and populate MySQL tables.');
  }
}

// Safe query execution helper
async function query(sql, params = []) {
  if (isConnected && pool) {
    try {
      const [rows] = await pool.execute(sql, params);
      return rows;
    } catch (err) {
      console.error('[Database Query Error]', err.message);
      throw err;
    }
  }
  return null;
}

let lastStoreMtime = 0;

function getFallbackStore() {
  if (fs.existsSync(STORE_FILE)) {
    try {
      const stat = fs.statSync(STORE_FILE);
      if (!fallbackStore || stat.mtimeMs > lastStoreMtime) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        fallbackStore = JSON.parse(raw);
        lastStoreMtime = stat.mtimeMs;
      }
    } catch (e) {
      // keep in-memory fallbackStore if parse failed
    }
  }
  return fallbackStore;
}

module.exports = {
  connectDB,
  query,
  getPool: () => pool,
  isMySQLConnected: () => isConnected,
  getFallbackStore,
  saveStore
};
