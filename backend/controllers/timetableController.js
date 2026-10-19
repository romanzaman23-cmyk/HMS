const { query, isMySQLConnected, getFallbackStore, saveStore } = require('../config/db');

// Default full template helper for newly initialized classes
const getDefaultTemplate = (className = 'Grade 1') => ({
  Monday: [
    { id: 1, period: 'Period 1', time: '08:00 - 08:45 AM', subject: 'Mathematics', teacher: 'Sir Tariq', room: 'Room 103' },
    { id: 2, period: 'Period 2', time: '08:45 - 09:30 AM', subject: 'English Language', teacher: 'Ms. Ayesha', room: 'Room 103' },
    { id: 3, period: 'Period 3', time: '09:30 - 10:15 AM', subject: 'Urdu', teacher: 'Ms. Fatima', room: 'Room 103' },
    { id: 4, period: 'Break / Recess', time: '10:15 - 10:45 AM', subject: 'Recess & Refreshment', teacher: 'Duty Staff', room: 'School Ground', isBreak: true },
    { id: 5, period: 'Period 4', time: '10:45 - 11:30 AM', subject: 'General Science', teacher: 'Sir Farman', room: 'Room 103' },
    { id: 6, period: 'Period 5', time: '11:30 - 12:15 PM', subject: 'Islamiat', teacher: 'Qari Usman', room: 'Room 103' },
    { id: 7, period: 'Period 6', time: '12:15 - 01:00 PM', subject: 'Computer Studies', teacher: 'Sir Roman', room: 'Computer Lab' }
  ],
  Tuesday: [
    { id: 1, period: 'Period 1', time: '08:00 - 08:45 AM', subject: 'English Language', teacher: 'Ms. Ayesha', room: 'Room 103' },
    { id: 2, period: 'Period 2', time: '08:45 - 09:30 AM', subject: 'Mathematics', teacher: 'Sir Tariq', room: 'Room 103' },
    { id: 3, period: 'Period 3', time: '09:30 - 10:15 AM', subject: 'Social Studies', teacher: 'Ms. Sadia', room: 'Room 103' },
    { id: 4, period: 'Break / Recess', time: '10:15 - 10:45 AM', subject: 'Recess & Refreshment', teacher: 'Duty Staff', room: 'School Ground', isBreak: true },
    { id: 5, period: 'Period 4', time: '10:45 - 11:30 AM', subject: 'General Science', teacher: 'Sir Farman', room: 'Room 103' },
    { id: 6, period: 'Period 5', time: '11:30 - 12:15 PM', subject: 'Urdu Literature', teacher: 'Ms. Fatima', room: 'Room 103' },
    { id: 7, period: 'Period 6', time: '12:15 - 01:00 PM', subject: 'Arts & Crafts', teacher: 'Ms. Hina', room: 'Art Room' }
  ],
  Wednesday: [
    { id: 1, period: 'Period 1', time: '08:00 - 08:45 AM', subject: 'Mathematics', teacher: 'Sir Tariq', room: 'Room 103' },
    { id: 2, period: 'Period 2', time: '08:45 - 09:30 AM', subject: 'General Science', teacher: 'Sir Farman', room: 'Room 103' },
    { id: 3, period: 'Period 3', time: '09:30 - 10:15 AM', subject: 'English Grammar', teacher: 'Ms. Ayesha', room: 'Room 103' },
    { id: 4, period: 'Break / Recess', time: '10:15 - 10:45 AM', subject: 'Recess & Refreshment', teacher: 'Duty Staff', room: 'School Ground', isBreak: true },
    { id: 5, period: 'Period 4', time: '10:45 - 11:30 AM', subject: 'Islamiat', teacher: 'Qari Usman', room: 'Room 103' },
    { id: 6, period: 'Period 5', time: '11:30 - 12:15 PM', subject: 'Urdu', teacher: 'Ms. Fatima', room: 'Room 103' },
    { id: 7, period: 'Period 6', time: '12:15 - 01:00 PM', subject: 'Library & Reading', teacher: 'Mr. Asad', room: 'School Library' }
  ],
  Thursday: [
    { id: 1, period: 'Period 1', time: '08:00 - 08:45 AM', subject: 'Social Studies', teacher: 'Ms. Sadia', room: 'Room 103' },
    { id: 2, period: 'Period 2', time: '08:45 - 09:30 AM', subject: 'English Language', teacher: 'Ms. Ayesha', room: 'Room 103' },
    { id: 3, period: 'Period 3', time: '09:30 - 10:15 AM', subject: 'Mathematics', teacher: 'Sir Tariq', room: 'Room 103' },
    { id: 4, period: 'Break / Recess', time: '10:15 - 10:45 AM', subject: 'Recess & Refreshment', teacher: 'Duty Staff', room: 'School Ground', isBreak: true },
    { id: 5, period: 'Period 4', time: '10:45 - 11:30 AM', subject: 'General Science', teacher: 'Sir Farman', room: 'Science Lab' },
    { id: 6, period: 'Period 5', time: '11:30 - 12:15 PM', subject: 'Computer Studies', teacher: 'Sir Roman', room: 'Computer Lab' },
    { id: 7, period: 'Period 6', time: '12:15 - 01:00 PM', subject: 'Physical Education (PT)', teacher: 'Coach Bilal', room: 'Sports Ground' }
  ],
  Friday: [
    { id: 1, period: 'Period 1', time: '08:00 - 08:40 AM', subject: 'Holy Quran & Hadith', teacher: 'Qari Usman', room: 'Room 103' },
    { id: 2, period: 'Period 2', time: '08:40 - 09:20 AM', subject: 'Mathematics', teacher: 'Sir Tariq', room: 'Room 103' },
    { id: 3, period: 'Period 3', time: '09:20 - 10:00 AM', subject: 'English', teacher: 'Ms. Ayesha', room: 'Room 103' },
    { id: 4, period: 'Break / Recess', time: '10:00 - 10:20 AM', subject: 'Quick Refreshment', teacher: 'Duty Staff', room: 'School Ground', isBreak: true },
    { id: 5, period: 'Period 4', time: '10:20 - 11:00 AM', subject: 'General Knowledge', teacher: 'Ms. Fatima', room: 'Room 103' },
    { id: 6, period: 'Period 5', time: '11:00 - 11:45 AM', subject: 'Moral Education & Ethics', teacher: 'Sir Farman', room: 'Room 103' }
  ],
  Saturday: [
    { id: 1, period: 'Period 1', time: '08:00 - 08:45 AM', subject: 'Spoken English & Public Speaking', teacher: 'Ms. Ayesha', room: 'Room 103' },
    { id: 2, period: 'Period 2', time: '08:45 - 09:30 AM', subject: 'Sports & Physical Fitness', teacher: 'Coach Bilal', room: 'Main Ground' },
    { id: 3, period: 'Period 3', time: '09:30 - 10:15 AM', subject: 'Robotics & Practical Science', teacher: 'Sir Roman', room: 'Computer Lab' },
    { id: 4, period: 'Break / Recess', time: '10:15 - 10:45 AM', subject: 'Recess & Refreshment', teacher: 'Duty Staff', room: 'School Ground', isBreak: true },
    { id: 5, period: 'Period 4', time: '10:45 - 11:30 AM', subject: 'Weekly Quiz & Review', teacher: 'Sir Tariq', room: 'Room 103' },
    { id: 6, period: 'Period 5', time: '11:30 - 12:15 PM', subject: 'Calligraphy & Drawing', teacher: 'Ms. Hina', room: 'Art Studio' }
  ]
});

// GET /api/timetable
// Query: ?class_id=1 or ?class_name=Grade%201
async function getTimetable(req, res) {
  try {
    const store = getFallbackStore();
    if (!store.timetables) {
      store.timetables = [];
    }

    const { class_id, class_name } = req.query;

    if (!class_id && !class_name) {
      // Return all assigned timetables
      return res.json({
        success: true,
        count: store.timetables.length,
        timetables: store.timetables
      });
    }

    const matched = store.timetables.find(t => {
      if (class_id && String(t.class_id) === String(class_id)) return true;
      if (class_name && t.class_name && t.class_name.toLowerCase().trim() === class_name.toLowerCase().trim()) return true;
      return false;
    });

    if (matched) {
      return res.json({
        success: true,
        data: matched.schedule,
        record: matched
      });
    }

    // If none assigned yet, return empty object (or can return default preview if requested)
    return res.json({
      success: true,
      data: {},
      isNew: true,
      message: 'No timetable assigned yet for this class'
    });
  } catch (err) {
    console.error('[Timetable Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// GET /api/timetable/template?class_name=Grade%201
async function getTimetableTemplate(req, res) {
  try {
    const className = req.query.class_name || 'Grade 1';
    const template = getDefaultTemplate(className);
    return res.json({
      success: true,
      template
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/timetable - Save or update class timetable
async function saveTimetable(req, res) {
  try {
    const { class_id, class_name, schedule } = req.body;

    if (!class_name && !class_id) {
      return res.status(400).json({
        success: false,
        message: 'class_id or class_name is required'
      });
    }

    if (!schedule || typeof schedule !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'schedule data object is required'
      });
    }

    const store = getFallbackStore();
    if (!store.timetables) {
      store.timetables = [];
    }

    // Find class details from classes list if available
    let targetClass = null;
    if (store.classes) {
      targetClass = store.classes.find(c =>
        (class_id && String(c.id) === String(class_id)) ||
        (class_name && c.name.toLowerCase().trim() === class_name.toLowerCase().trim())
      );
    }

    const resolvedClassId = targetClass ? targetClass.id : (class_id || Date.now());
    const resolvedClassName = targetClass ? targetClass.name : (class_name || `Class ${resolvedClassId}`);

    // Check if entry already exists
    let existingIndex = store.timetables.findIndex(t =>
      String(t.class_id) === String(resolvedClassId) ||
      (t.class_name && t.class_name.toLowerCase().trim() === resolvedClassName.toLowerCase().trim())
    );

    const now = new Date().toISOString();
    let updatedRecord = null;

    if (existingIndex >= 0) {
      store.timetables[existingIndex] = {
        ...store.timetables[existingIndex],
        class_id: resolvedClassId,
        class_name: resolvedClassName,
        schedule,
        updated_at: now,
        updated_by: req.user?.full_name || 'Admin Principal'
      };
      updatedRecord = store.timetables[existingIndex];
    } else {
      updatedRecord = {
        id: Date.now(),
        class_id: resolvedClassId,
        class_name: resolvedClassName,
        schedule,
        created_at: now,
        updated_at: now,
        updated_by: req.user?.full_name || 'Admin Principal'
      };
      store.timetables.push(updatedRecord);
    }

    // Save to store.json
    saveStore();

    // Also broadcast notification to students of this class
    try {
      if (!store.notifications) store.notifications = [];
      const affectedStudents = (store.students || []).filter(s =>
        String(s.class_id) === String(resolvedClassId) ||
        (s.class_name && s.class_name.toLowerCase().trim() === resolvedClassName.toLowerCase().trim())
      );

      affectedStudents.forEach(stu => {
        store.notifications.unshift({
          id: Date.now() + Math.floor(Math.random() * 1000),
          user_id: stu.parent_user_id || stu.parent_id || stu.id,
          title: 'Class Timetable Updated',
          message: `The weekly timetable for ${resolvedClassName} has been updated by the administration. Check the Timetable tab in your app.`,
          type: 'Timetable',
          is_read: 0,
          action_url: '/timetable',
          created_at: now
        });
      });
      saveStore();
    } catch (e) {
      console.warn('[Timetable Notification Error]', e.message);
    }

    return res.json({
      success: true,
      message: `Timetable for ${resolvedClassName} has been successfully assigned and published!`,
      record: updatedRecord
    });
  } catch (err) {
    console.error('[Save Timetable Error]', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/timetable/:classId
async function deleteTimetable(req, res) {
  try {
    const { classId } = req.params;
    const store = getFallbackStore();
    if (!store.timetables) store.timetables = [];

    const prevCount = store.timetables.length;
    store.timetables = store.timetables.filter(t => String(t.class_id) !== String(classId));

    if (store.timetables.length === prevCount) {
      return res.status(404).json({ success: false, message: 'Timetable not found for specified class' });
    }

    saveStore();
    return res.json({ success: true, message: 'Timetable removed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getTimetable,
  getTimetableTemplate,
  saveTimetable,
  deleteTimetable,
  getDefaultTemplate
};
