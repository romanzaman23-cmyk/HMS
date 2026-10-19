const { query, isMySQLConnected, getFallbackStore, saveStore } = require('../config/db');

// Get leaves (Admin gets all, Parent gets their children's leaves)
async function getLeaves(req, res) {
  try {
    const isParent = req.user?.role === 'PARENT';
    const parentUserId = req.user?.id;
    const { student_id } = req.query;

    if (isMySQLConnected()) {
      let sql = `
        SELECT lr.*, s.full_name as student_name, s.roll_number, c.name as class_name, 
               u.full_name as parent_name, u.phone as parent_phone
        FROM leave_requests lr
        JOIN students s ON lr.student_id = s.id
        JOIN classes c ON s.class_id = c.id
        JOIN parents p ON lr.parent_id = p.id
        JOIN users u ON p.user_id = u.id
      `;
      const params = [];

      if (isParent) {
        sql += ' WHERE p.user_id = ?';
        params.push(parentUserId);
      } else if (student_id) {
        sql += ' WHERE lr.student_id = ?';
        params.push(student_id);
      }
      sql += ' ORDER BY lr.submitted_at DESC, lr.id DESC';

      const leaves = await query(sql, params);
      return res.json({ success: true, count: leaves.length, leaves });
    }

    const store = getFallbackStore();
    let leaves = [...(store.leave_requests || [])];

    if (isParent) {
      const myStudentIds = (store.students || [])
        .filter(s => String(s.parent_user_id) === String(parentUserId) || s.parent_email === req.user?.email)
        .map(s => String(s.id));
      if (myStudentIds.length > 0) {
        leaves = leaves.filter(l => myStudentIds.includes(String(l.student_id)));
      }
    } else if (student_id) {
      leaves = leaves.filter(l => String(l.student_id) === String(student_id));
    }

    // Enrich with student details
    leaves = leaves.map(l => {
      const s = (store.students || []).find(st => String(st.id) === String(l.student_id));
      return {
        ...l,
        student_name: l.student_name || s?.full_name || 'Student',
        roll_number: l.roll_number || s?.roll_number || '',
        class_name: l.class_name || s?.class_name || '',
        parent_name: l.parent_name || s?.parent_name || s?.father_name || '',
        parent_phone: l.parent_phone || s?.parent_phone || ''
      };
    });

    return res.json({ success: true, count: leaves.length, leaves });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Submit leave request (from parent portal or mobile app)
async function createLeaveRequest(req, res) {
  try {
    const { student_id, start_date, end_date, reason, additional_details } = req.body;
    let attachmentUrl = null;
    if (req.file) {
      attachmentUrl = `/uploads/${req.file.filename}`;
    }

    if (!start_date || !end_date || !reason) {
      return res.status(400).json({ success: false, message: 'Start date, end date, and reason are required.' });
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    if (isMySQLConnected()) {
      const sid = parseInt(student_id, 10) || 1;
      const parents = await query('SELECT id FROM parents WHERE user_id = ?', [req.user?.id || 1]);
      const parentId = parents[0] ? parents[0].id : 1;

      const result = await query(
        `INSERT INTO leave_requests (student_id, parent_id, start_date, end_date, reason, additional_details, attachment_url, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
        [sid, parentId, start_date, end_date, reason, additional_details, attachmentUrl]
      );

      const stuRows = await query('SELECT full_name, class_id FROM students WHERE id = ?', [sid]);
      const sName = stuRows && stuRows[0] ? stuRows[0].full_name : 'Student';

      // Notify Principal / Admin
      const admins = await query('SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = "PRINCIPAL_ADMIN"');
      for (const admin of admins) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, action_url)
           VALUES (?, 'New Leave Request Received', ?, 'Leave Request', '/admin/leave-management')`,
          [admin.id, `New leave request submitted for ${sName}: ${reason}`]
        );
      }

      return res.status(201).json({ success: true, message: 'Leave request submitted successfully.', id: result.insertId });
    }

    const store = getFallbackStore();
    if (!store.leave_requests) {
      store.leave_requests = [];
    }

    // Find student details from store.students
    const sid = student_id ? (parseInt(student_id, 10) || student_id) : null;
    let targetStudent = null;
    if (sid) {
      targetStudent = (store.students || []).find(s =>
        String(s.id) === String(sid) ||
        (s.roll_number && s.roll_number.toLowerCase() === String(sid).toLowerCase())
      );
    }
    if (!targetStudent && store.students && store.students.length > 0) {
      targetStudent = store.students[0];
    }

    const resolvedStudentId = targetStudent ? targetStudent.id : (sid || 1792104861336);
    const studentName = targetStudent ? (targetStudent.full_name || targetStudent.name) : 'ROMAN';
    const rollNumber = targetStudent ? targetStudent.roll_number : 'HMS-707';
    const className = targetStudent ? targetStudent.class_name : 'Grade 1';
    const parentName = targetStudent ? (targetStudent.parent_name || targetStudent.father_name) : 'Khalid';
    const parentPhone = targetStudent ? targetStudent.parent_phone : '0300-1234567';

    const newLeave = {
      id: Date.now(),
      student_id: resolvedStudentId,
      student_name: studentName,
      roll_number: rollNumber,
      class_name: className,
      parent_id: targetStudent ? targetStudent.parent_id : 1,
      parent_name: parentName,
      parent_phone: parentPhone,
      start_date,
      end_date,
      reason,
      additional_details: additional_details || '',
      attachment_url: attachmentUrl,
      status: 'Pending',
      submitted_at: todayStr
    };

    store.leave_requests.unshift(newLeave);

    // Notify Admin in persistent store
    store.notifications = store.notifications || [];
    store.notifications.unshift({
      id: Date.now() + 1,
      user_id: 1,
      title: 'New Leave Request Received',
      message: `New leave request submitted for ${studentName} (${className}, Roll: ${rollNumber}): ${reason}`,
      type: 'Leave Request',
      is_read: 0,
      action_url: '/admin/leave-management',
      created_at: new Date().toISOString()
    });

    // Save permanently to store.json
    saveStore();

    return res.status(201).json({
      success: true,
      message: `Leave request for ${studentName} submitted successfully.`,
      leave: newLeave
    });
  } catch (err) {
    console.error('createLeaveRequest error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Admin approve leave request
async function approveLeave(req, res) {
  try {
    const { id } = req.params;
    const { admin_remarks } = req.body || {};

    if (isMySQLConnected()) {
      await query(
        `UPDATE leave_requests 
         SET status = 'Approved', admin_remarks = ?, reviewed_by = ?, reviewed_at = NOW() 
         WHERE id = ?`,
        [admin_remarks || 'Approved by Principal', req.user?.id || 1, id]
      );

      const rows = await query(
        `SELECT lr.start_date, s.full_name, p.user_id as parent_user_id 
         FROM leave_requests lr
         JOIN students s ON lr.student_id = s.id
         JOIN parents p ON lr.parent_id = p.id
         WHERE lr.id = ?`,
        [id]
      );
      if (rows && rows[0]) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, action_url)
           VALUES (?, 'Leave Request Approved', ?, 'Leave Status', '/parent/leave-request')`,
          [rows[0].parent_user_id, `Your leave request for ${rows[0].full_name} (${rows[0].start_date}) has been approved.`]
        );
      }

      return res.json({ success: true, message: 'Leave request approved.' });
    }

    const store = getFallbackStore();
    const item = (store.leave_requests || []).find(l => String(l.id) === String(id));
    if (item) {
      item.status = 'Approved';
      item.admin_remarks = admin_remarks || 'Approved by Principal';
      item.reviewed_at = new Date().toISOString();

      store.notifications = store.notifications || [];
      store.notifications.unshift({
        id: Date.now(),
        user_id: 2,
        title: 'Leave Request Approved',
        message: `Your leave request for ${item.student_name} (${item.start_date}) has been approved.`,
        type: 'Leave Status',
        is_read: 0,
        action_url: '/parent/leave-request',
        created_at: new Date().toISOString()
      });

      saveStore();
    }

    return res.json({ success: true, message: 'Leave request approved.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Admin reject leave request
async function rejectLeave(req, res) {
  try {
    const { id } = req.params;
    const { admin_remarks } = req.body || {};

    if (isMySQLConnected()) {
      await query(
        `UPDATE leave_requests 
         SET status = 'Rejected', admin_remarks = ?, reviewed_by = ?, reviewed_at = NOW() 
         WHERE id = ?`,
        [admin_remarks || 'Unable to approve at this time', req.user?.id || 1, id]
      );

      const rows = await query(
        `SELECT lr.start_date, s.full_name, p.user_id as parent_user_id 
         FROM leave_requests lr
         JOIN students s ON lr.student_id = s.id
         JOIN parents p ON lr.parent_id = p.id
         WHERE lr.id = ?`,
        [id]
      );
      if (rows && rows[0]) {
        await query(
          `INSERT INTO notifications (user_id, title, message, type, action_url)
           VALUES (?, 'Leave Request Update', ?, 'Leave Status', '/parent/leave-request')`,
          [rows[0].parent_user_id, `Your leave request for ${rows[0].full_name} has been rejected.`]
        );
      }

      return res.json({ success: true, message: 'Leave request rejected.' });
    }

    const store = getFallbackStore();
    const item = (store.leave_requests || []).find(l => String(l.id) === String(id));
    if (item) {
      item.status = 'Rejected';
      item.admin_remarks = admin_remarks || 'Unable to approve at this time';
      item.reviewed_at = new Date().toISOString();

      store.notifications = store.notifications || [];
      store.notifications.unshift({
        id: Date.now(),
        user_id: 2,
        title: 'Leave Request Update',
        message: `Your leave request for ${item.student_name} has been rejected.`,
        type: 'Leave Status',
        is_read: 0,
        action_url: '/parent/leave-request',
        created_at: new Date().toISOString()
      });

      saveStore();
    }

    return res.json({ success: true, message: 'Leave request rejected.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getLeaves,
  createLeaveRequest,
  approveLeave,
  rejectLeave
};
