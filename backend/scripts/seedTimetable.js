const fs = require('fs');
const path = require('path');
const { getDefaultTemplate } = require('../controllers/timetableController');

const storePath = path.join(__dirname, '../data/store.json');
try {
  const store = JSON.parse(fs.readFileSync(storePath, 'utf8'));
  if (!store.timetables) {
    store.timetables = [];
  }

  const existing = store.timetables.find(t => t.class_name === 'Grade 1');
  if (!existing) {
    store.timetables.push({
      id: 1,
      class_id: 3,
      class_name: 'Grade 1',
      updated_at: new Date().toISOString(),
      updated_by: 'Admin Principal',
      schedule: getDefaultTemplate('Grade 1')
    });
    fs.writeFileSync(storePath, JSON.stringify(store, null, 2), 'utf8');
    console.log('Seeded Grade 1 timetable successfully!');
  } else {
    console.log('Grade 1 timetable already exists.');
  }
} catch (err) {
  console.error('Error seeding timetable:', err.message);
}
