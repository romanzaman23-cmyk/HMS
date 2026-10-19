const fs = require('fs');
const path = require('path');

const storePath = path.resolve(__dirname, '../backend/data/store.json');
console.log('Target store path:', storePath);

const existing = JSON.parse(fs.readFileSync(storePath, 'utf8'));

// Retain Admin Principal user (role_id 1)
const adminUser = existing.users?.find(u => u.email === 'admin@highlight.school') || {
  id: 1,
  role_id: 1,
  role_name: 'PRINCIPAL_ADMIN',
  email: 'admin@highlight.school',
  password_hash: '$2a$10$i.qhNJNsqkmnv1vyliuhLO1zwzWjydj/w7wdt1snYSEGEGV882/fe',
  full_name: 'Admin Principal',
  phone: '+1 555-0199',
  avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  is_active: 1
};

// Retain standard classes
const standardClasses = [
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
];

const cleanStore = {
  roles: existing.roles || [
    { id: 1, name: 'PRINCIPAL_ADMIN', description: 'School Principal & Admin' },
    { id: 2, name: 'PARENT', description: 'Parent / Guardian' }
  ],
  users: [adminUser],
  classes: standardClasses,
  parents: [],
  students: [],
  devices: existing.devices || [
    {
      id: 1,
      device_name: 'ZKTeco F18',
      ip_address: '192.168.1.201',
      port: 4370,
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
  settings: existing.settings || {
    school_name: 'Highlight Model School',
    tagline: 'Better Learning | Brighter Future',
    address: 'Saraghundi Thall, Hangu, KP, Pakistan',
    phone: '0333-1234567',
    email: 'info@highlight.school',
    academic_year: '2026-2027'
  },
  punches: [],
  student_registrations: []
};

fs.writeFileSync(storePath, JSON.stringify(cleanStore, null, 2), 'utf8');
console.log('store.json wiped clean successfully!');
console.log('Students count:', cleanStore.students.length);
console.log('Users count (only Admin Principal):', cleanStore.users.length);
console.log('Registrations count:', cleanStore.student_registrations.length);
console.log('Attendance count:', cleanStore.attendance.length);
