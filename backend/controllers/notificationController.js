const { query, isMySQLConnected, getFallbackStore } = require('../config/db');

// Get notifications for current user
async function getNotifications(req, res) {
  try {
    const userId = req.user.id;

    if (isMySQLConnected()) {
      const notifications = await query(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC LIMIT 30`,
        [userId]
      );
      const unreadCount = notifications.filter(n => !n.is_read).length;
      return res.json({ success: true, unreadCount, notifications });
    }

    const store = getFallbackStore();
    const notifications = (store.notifications || []).filter(n => n.user_id === userId);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    return res.json({ success: true, unreadCount, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Mark single notification as read
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (isMySQLConnected()) {
      await query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
      return res.json({ success: true, message: 'Notification marked as read.' });
    }

    const store = getFallbackStore();
    const notif = (store.notifications || []).find(n => n.id === parseInt(id, 10) && n.user_id === userId);
    if (notif) notif.is_read = 1;

    return res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Mark all notifications as read
async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    if (isMySQLConnected()) {
      await query('UPDATE notifications SET is_read = TRUE WHERE user_id = ?', [userId]);
      return res.json({ success: true, message: 'All notifications marked as read.' });
    }

    const store = getFallbackStore();
    (store.notifications || []).forEach(n => {
      if (n.user_id === userId) n.is_read = 1;
    });

    return res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

const whatsappService = require('../services/whatsappService');

// Get WhatsApp dispatch audit logs (Admin)
async function getWhatsAppLogs(req, res) {
  try {
    const logs = whatsappService.getWhatsAppLogs(50);
    return res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Test send WhatsApp alert
async function testWhatsApp(req, res) {
  try {
    const { student_id = 1, phone = '03038262123' } = req.body;
    const store = getFallbackStore();
    const student = (store.students || []).find(s => s.id === parseInt(student_id, 10)) || {
      id: 1,
      full_name: 'Roman Zamam',
      roll_number: '026',
      class_name: 'Grade 8',
      parent_name: 'Khalid Zaman'
    };

    const result = await whatsappService.sendAttendanceAlert({
      student,
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attendanceDate: new Date().toISOString().slice(0, 10),
      source: 'Biometric Test Punch',
      parentPhone: phone,
      parentName: student.parent_name || 'Parent'
    });

    return res.json({ success: true, message: 'Test WhatsApp alert dispatched.', data: result });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getWhatsAppLogs,
  testWhatsApp
};
