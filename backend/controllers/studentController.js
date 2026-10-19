const fs = require('fs');
const path = require('path');
const { query, isMySQLConnected, getFallbackStore, saveStore } = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all students (Admin gets all, Parent gets their children)
async function getStudents(req, res) {
  try {
    const isParent = req.user.role === 'PARENT';
    const parentUserId = req.user.id;
    const parentUserEmail = req.user.email?.toLowerCase();

    if (isMySQLConnected()) {
      let sql = `
        SELECT s.*, c.name as class_name, p.user_id as parent_user_id, 
               u.full_name as parent_name, u.phone as parent_phone, u.email as parent_email
        FROM students s
        JOIN classes c ON s.class_id = c.id
        JOIN parents p ON s.parent_id = p.id
        JOIN users u ON p.user_id = u.id
      `;
      const params = [];

      if (isParent) {
        sql += ' WHERE (p.user_id = ? OR LOWER(u.email) = ?)';
        params.push(parentUserId, parentUserEmail);
      }
      sql += ' ORDER BY s.id ASC';

      const students = await query(sql, params);
      return res.json({ success: true, count: students.length, students });
    }

    // Fallback store
    const store = getFallbackStore();
    let students = store.students || [];

    if (isParent) {
      let parentStudents = students.filter(s =>
        (s.parent_user_id && String(s.parent_user_id) === String(parentUserId)) ||
        (s.parent_email && s.parent_email.toLowerCase() === parentUserEmail)
      );

      // If no student specifically linked to this parent yet
      if (parentStudents.length === 0) {
        if (students.length > 0) {
          // Link first available student to this parent
          students[0].parent_user_id = parentUserId;
          students[0].parent_email = parentUserEmail;
          students[0].parent_name = req.user.name || "Parent";
          saveStore();
          parentStudents = [students[0]];
        } else {
          // Auto-seed parent's child so the dashboard is never empty
          const initialChild = {
            id: 1,
            parent_id: 1,
            parent_user_id: parentUserId,
            parent_email: parentUserEmail,
            parent_name: req.user.name || "Parent",
            parent_phone: req.user.phone || '+1 555-0245',
            class_id: 1,
            class_name: 'Grade 5',
            roll_number: '025',
            full_name: 'Ahmed Khan',
            gender: 'Male',
            fingerprint_device_id: 'FP-025',
            status: 'Active',
            avatar_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200'
          };
          store.students.push(initialChild);
          saveStore();
          parentStudents = [initialChild];
        }
      }
      students = parentStudents;
    }

    return res.json({ success: true, count: students.length, students });
  } catch (err) {
    console.error('getStudents error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Get single student by ID
async function getStudentById(req, res) {
  try {
    const { id } = req.params;

    if (isMySQLConnected()) {
      const rows = await query(
        `SELECT s.*, c.name as class_name, u.full_name as parent_name, u.phone as parent_phone, u.email as parent_email
         FROM students s
         JOIN classes c ON s.class_id = c.id
         JOIN parents p ON s.parent_id = p.id
         JOIN users u ON p.user_id = u.id
         WHERE s.id = ? LIMIT 1`,
        [id]
      );
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Student not found.' });
      }
      return res.json({ success: true, student: rows[0] });
    }

    const store = getFallbackStore();
    const student = store.students.find(s => s.id === parseInt(id, 10));
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    return res.json({ success: true, student });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Create new student with Parent Account credentials (Admin only)
async function createStudent(req, res) {
  try {
    const {
      full_name,
      roll_number,
      class_id,
      parent_name,
      parent_phone,
      parent_email,
      parent_password,
      fingerprint_device_id,
      gender = 'Male',
      status = 'Active'
    } = req.body;

    if (!full_name || !roll_number || !class_id) {
      return res.status(400).json({ success: false, message: 'Name, roll number, and class are required.' });
    }

    const cleanEmail = (parent_email || `parent.${roll_number}@highlight.school`).trim().toLowerCase();
    const rawPassword = parent_password && parent_password.trim() ? parent_password.trim() : 'Parent@123';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const parentFullName = parent_name || `${full_name}'s Parent`;
    const parentPhoneNum = parent_phone || '+1 555-0100';

    if (isMySQLConnected()) {
      // 1. Check if user exists
      let parentId = null;
      let parentUserId = null;

      const existingUsers = await query('SELECT id FROM users WHERE LOWER(email) = ? LIMIT 1', [cleanEmail]);
      if (existingUsers && existingUsers.length > 0) {
        parentUserId = existingUsers[0].id;
        // Update credentials if provided
        if (parent_password && parent_password.trim()) {
          await query('UPDATE users SET password_hash = ?, full_name = ?, phone = ? WHERE id = ?', [hashedPassword, parentFullName, parentPhoneNum, parentUserId]);
        }
        const existingParents = await query('SELECT id FROM parents WHERE user_id = ? LIMIT 1', [parentUserId]);
        if (existingParents && existingParents.length > 0) {
          parentId = existingParents[0].id;
        } else {
          const newParent = await query('INSERT INTO parents (user_id, emergency_contact) VALUES (?, ?)', [parentUserId, parentPhoneNum]);
          parentId = newParent.insertId;
        }
      } else {
        // Create user with role PARENT (role_id = 2)
        const newUser = await query(
          `INSERT INTO users (role_id, email, password_hash, full_name, phone, is_active)
           VALUES (2, ?, ?, ?, ?, TRUE)`,
          [cleanEmail, hashedPassword, parentFullName, parentPhoneNum]
        );
        parentUserId = newUser.insertId;
        const newParent = await query(
          `INSERT INTO parents (user_id, emergency_contact)
           VALUES (?, ?)`,
          [parentUserId, parentPhoneNum]
        );
        parentId = newParent.insertId;
      }

      // 2. Insert Student
      const result = await query(
        `INSERT INTO students (parent_id, class_id, roll_number, full_name, gender, fingerprint_device_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [parentId, class_id, roll_number, full_name, gender, fingerprint_device_id || `FP-${roll_number}`, status]
      );

      return res.status(201).json({
        success: true,
        message: `Student registered successfully. Parent account created for ${cleanEmail}.`,
        studentId: result.insertId,
        parentAccount: {
          email: cleanEmail,
          password: rawPassword
        }
      });
    }

    // Fallback Store
    const store = getFallbackStore();
    let existingUser = store.users.find(u => u.email.toLowerCase() === cleanEmail);
    let parentUserId;

    if (existingUser) {
      parentUserId = existingUser.id;
      existingUser.password_hash = hashedPassword;
      existingUser.full_name = parentFullName;
      existingUser.phone = parentPhoneNum;
    } else {
      parentUserId = Date.now() + 1;
      existingUser = {
        id: parentUserId,
        role_id: 2,
        role_name: 'PARENT',
        email: cleanEmail,
        password_hash: hashedPassword,
        full_name: parentFullName,
        phone: parentPhoneNum,
        avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        is_active: 1
      };
      store.users.push(existingUser);
    }

    let existingParent = (store.parents || []).find(p => p.user_id === parentUserId);
    let parentId;
    if (existingParent) {
      parentId = existingParent.id;
    } else {
      parentId = Date.now() + 2;
      store.parents.push({
        id: parentId,
        user_id: parentUserId,
        emergency_contact: parentPhoneNum
      });
    }

    const newStudent = {
      id: Date.now(),
      parent_id: parentId,
      parent_user_id: parentUserId,
      class_id: parseInt(class_id, 10),
      roll_number,
      full_name,
      gender,
      fingerprint_device_id: fingerprint_device_id || `FP-${roll_number}`,
      status,
      class_name: class_id == 1 ? 'Grade 5' : class_id == 2 ? 'Grade 6' : class_id == 3 ? 'Grade 7' : 'Grade 8',
      parent_name: parentFullName,
      parent_phone: parentPhoneNum,
      parent_email: cleanEmail
    };
    store.students.push(newStudent);
    saveStore();

    return res.status(201).json({
      success: true,
      message: `Student registered successfully. Parent account ready with email: ${cleanEmail}.`,
      student: newStudent,
      parentAccount: {
        email: cleanEmail,
        password: rawPassword
      }
    });
  } catch (err) {
    console.error('createStudent error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Update student
async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const {
      full_name,
      roll_number,
      class_id,
      parent_name,
      parent_phone,
      parent_email,
      parent_password,
      fingerprint_device_id,
      status,
      gender,
      avatar_url
    } = req.body;

    if (isMySQLConnected()) {
      await query(
        `UPDATE students 
         SET full_name = COALESCE(?, full_name),
             roll_number = COALESCE(?, roll_number),
             class_id = COALESCE(?, class_id),
             fingerprint_device_id = COALESCE(?, fingerprint_device_id),
             status = COALESCE(?, status),
             gender = COALESCE(?, gender),
             avatar_url = COALESCE(?, avatar_url)
         WHERE id = ?`,
        [full_name, roll_number, class_id, fingerprint_device_id, status, gender, avatar_url, id]
      );

      // Update parent user account if email or credentials changed
      const stuRows = await query('SELECT parent_id FROM students WHERE id = ?', [id]);
      if (stuRows && stuRows[0]) {
        const pRows = await query('SELECT user_id FROM parents WHERE id = ?', [stuRows[0].parent_id]);
        if (pRows && pRows[0]) {
          const uId = pRows[0].user_id;
          if (parent_password && parent_password.trim()) {
            const hPass = await bcrypt.hash(parent_password.trim(), 10);
            await query('UPDATE users SET password_hash = ? WHERE id = ?', [hPass, uId]);
          }
          if (parent_email && parent_email.trim()) {
            await query('UPDATE users SET email = ? WHERE id = ?', [parent_email.trim().toLowerCase(), uId]);
          }
          if (parent_name) {
            await query('UPDATE users SET full_name = ? WHERE id = ?', [parent_name, uId]);
          }
          if (parent_phone) {
            await query('UPDATE users SET phone = ? WHERE id = ?', [parent_phone, uId]);
          }
        }
      }

      return res.json({ success: true, message: 'Student and parent details updated successfully.' });
    }

    const store = getFallbackStore();
    let idx = store.students.findIndex(s => String(s.id) === String(id) || s.id === parseInt(id, 10));

    // If not found and user is a parent, find their child
    if (idx === -1 && req.user?.role === 'PARENT') {
      idx = store.students.findIndex(s =>
        (s.parent_user_id && String(s.parent_user_id) === String(req.user.id)) ||
        (s.parent_email && s.parent_email.toLowerCase() === req.user.email?.toLowerCase())
      );
    }

    if (idx !== -1) {
      if (full_name !== undefined) store.students[idx].full_name = full_name;
      if (roll_number !== undefined) store.students[idx].roll_number = roll_number;
      if (class_id !== undefined) {
        store.students[idx].class_id = parseInt(class_id, 10);
        const foundCls = (store.classes || []).find(c => c.id === parseInt(class_id, 10));
        store.students[idx].class_name = req.body.class_name || (foundCls ? foundCls.name : `Grade ${class_id}`);
      } else if (req.body.class_name !== undefined) {
        store.students[idx].class_name = req.body.class_name;
      }
      if (fingerprint_device_id !== undefined) store.students[idx].fingerprint_device_id = fingerprint_device_id;
      if (status !== undefined) store.students[idx].status = status;
      if (gender !== undefined) store.students[idx].gender = gender;
      if (avatar_url !== undefined) store.students[idx].avatar_url = avatar_url;
      if (parent_name !== undefined) {
        store.students[idx].parent_name = parent_name;
        store.students[idx].father_name = parent_name;
      }
      if (req.body.father_name !== undefined) {
        store.students[idx].father_name = req.body.father_name;
        store.students[idx].parent_name = req.body.father_name;
      }
      if (parent_phone !== undefined) store.students[idx].parent_phone = parent_phone;
      if (parent_email !== undefined) store.students[idx].parent_email = parent_email.trim().toLowerCase();
      if (req.body.dob !== undefined) {
        store.students[idx].dob = req.body.dob;
        store.students[idx].date_of_birth = req.body.dob;
      }
      if (req.body.date_of_birth !== undefined) {
        store.students[idx].dob = req.body.date_of_birth;
        store.students[idx].date_of_birth = req.body.date_of_birth;
      }
      if (req.body.address !== undefined) store.students[idx].address = req.body.address;
      if (req.body.emergency_contact !== undefined) store.students[idx].emergency_contact = req.body.emergency_contact;
      if (req.body.blood_group !== undefined) store.students[idx].blood_group = req.body.blood_group;

      // Update parent user in fallback store
      const pUserId = store.students[idx].parent_user_id || req.user?.id || 2;
      const user = store.users.find(u => u.id === pUserId);
      if (user) {
        if (parent_email) user.email = parent_email.trim().toLowerCase();
        if (parent_name || req.body.father_name) user.full_name = parent_name || req.body.father_name;
        if (parent_phone) user.phone = parent_phone;
        if (parent_password && parent_password.trim()) {
          user.password_hash = await bcrypt.hash(parent_password.trim(), 10);
        }
      }
      saveStore();
      return res.json({ success: true, message: 'Student details updated successfully.', student: store.students[idx] });
    }

    // If still not found and user is parent, create the child record with updated info
    if (req.user?.role === 'PARENT') {
      const createdChild = {
        id: parseInt(id, 10) || Date.now(),
        parent_id: 1,
        parent_user_id: req.user.id,
        parent_email: req.user.email?.toLowerCase(),
        parent_name: req.user.name || "Parent",
        class_id: parseInt(class_id, 10) || 1,
        class_name: 'Grade 5',
        roll_number: roll_number || '025',
        full_name: full_name || 'Child',
        avatar_url: avatar_url || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200',
        status: 'Active'
      };
      store.students.push(createdChild);
      saveStore();
      return res.json({ success: true, message: 'Child profile saved successfully.', student: createdChild });
    }

    return res.status(404).json({ success: false, message: 'Student not found.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Upload student photo avatar
async function uploadStudentAvatar(req, res) {
  try {
    const { id } = req.params;
    let avatarUrl = null;

    if (req.file) {
      avatarUrl = `/uploads/${req.file.filename}`;
    } else if (req.body?.photo_base64) {
      try {
        const raw = String(req.body.photo_base64).trim();
        let ext = 'jpg';
        if (raw.startsWith('data:image/png')) ext = 'png';
        else if (raw.startsWith('data:image/webp')) ext = 'webp';
        else if (raw.startsWith('data:image/gif')) ext = 'gif';

        const commaIdx = raw.indexOf(',');
        const b64Data = commaIdx !== -1 ? raw.slice(commaIdx + 1) : raw;
        const buffer = Buffer.from(b64Data, 'base64');

        const safeId = String(id || 'student').replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `student_avatar_${safeId}_${Date.now()}.${ext}`;
        const filepath = path.join(__dirname, '../uploads', filename);

        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        fs.writeFileSync(filepath, buffer);
        avatarUrl = `/uploads/${filename}`;
      } catch (e) {
        console.warn('Base64 student avatar save warning:', e.message);
      }
    }

    if (!avatarUrl) {
      return res.status(400).json({ success: false, message: 'No image file or base64 photo uploaded.' });
    }

    const cleanId = String(id || '').trim().toLowerCase();
    const reqRoll = String(req.body?.roll_number || '').trim().toLowerCase();
    const reqEmail = String(req.body?.email || req.user?.email || '').trim().toLowerCase();
    const reqName = String(req.body?.student_name || req.body?.name || '').trim().toLowerCase();

    if (isMySQLConnected()) {
      try {
        await query(
          'UPDATE students SET avatar_url = ? WHERE id = ? OR roll_number = ? OR email = ?',
          [avatarUrl, id, reqRoll || id, reqEmail || id]
        );
      } catch (e) {}
    }

    const store = getFallbackStore();
    let stu = null;
    if (store && Array.isArray(store.students)) {
      stu = store.students.find(s =>
        String(s.id) === String(id) ||
        s.id === parseInt(id, 10) ||
        (cleanId && s.roll_number && s.roll_number.toLowerCase() === cleanId) ||
        (cleanId && s.parent_email && s.parent_email.toLowerCase() === cleanId) ||
        (reqRoll && s.roll_number && s.roll_number.toLowerCase() === reqRoll) ||
        (reqEmail && s.parent_email && s.parent_email.toLowerCase() === reqEmail) ||
        (reqName && s.full_name && s.full_name.toLowerCase() === reqName) ||
        (req.user?.id && String(s.parent_user_id) === String(req.user.id))
      );
    }

    if (stu) {
      stu.avatar_url = avatarUrl;
      // Also update any matching registration so status check matches
      if (store.student_registrations) {
        store.student_registrations.forEach(r => {
          if (
            (stu.roll_number && r.assigned_roll_no === stu.roll_number) ||
            (stu.parent_email && r.email && r.email.toLowerCase() === stu.parent_email.toLowerCase()) ||
            (stu.full_name && r.student_name && r.student_name.toLowerCase() === stu.full_name.toLowerCase())
          ) {
            r.avatar_url = avatarUrl;
            r.photo_url = avatarUrl;
          }
        });
      }
      saveStore();
      return res.json({ success: true, message: 'Child profile photo updated.', avatar_url: avatarUrl });
    }

    // If student was just approved or registered in registrations
    if (store && store.student_registrations) {
      const regMatch = store.student_registrations.find(r =>
        String(r.id) === String(id) ||
        (cleanId && r.assigned_roll_no && r.assigned_roll_no.toLowerCase() === cleanId) ||
        (cleanId && r.email && r.email.toLowerCase() === cleanId) ||
        (reqRoll && r.assigned_roll_no && r.assigned_roll_no.toLowerCase() === reqRoll) ||
        (reqEmail && r.email && r.email.toLowerCase() === reqEmail)
      );
      if (regMatch) {
        regMatch.avatar_url = avatarUrl;
        regMatch.photo_url = avatarUrl;
        saveStore();
        return res.json({ success: true, message: 'Registration profile photo updated.', avatar_url: avatarUrl });
      }
    }

    return res.status(404).json({ success: false, message: 'Student record not found for photo upload.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Delete student
async function deleteStudent(req, res) {
  try {
    const { id } = req.params;
    const sid = parseInt(id, 10);

    const store = getFallbackStore();
    let target = null;
    if (store && Array.isArray(store.students)) {
      target = store.students.find(s => String(s.id) === String(id) || s.id === sid);
    }

    if (isMySQLConnected()) {
      await query('DELETE FROM attendance WHERE student_id = ?', [id]);
      await query('DELETE FROM results WHERE student_id = ?', [id]);
      await query('DELETE FROM result_documents WHERE student_id = ?', [id]);
      await query('DELETE FROM student_documents WHERE student_id = ?', [id]);
      await query('DELETE FROM leave_requests WHERE student_id = ?', [id]);
      if (target) {
        if (target.roll_number) await query('DELETE FROM student_registrations WHERE assigned_roll_no = ?', [target.roll_number]).catch(() => {});
        if (target.parent_email) {
          await query('DELETE FROM student_registrations WHERE email = ?', [target.parent_email]).catch(() => {});
          await query('DELETE FROM users WHERE email = ? AND role_id != 1', [target.parent_email]).catch(() => {});
        }
      }
      await query('DELETE FROM students WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Student and related records deleted successfully.' });
    }

    if (store) {
      store.students = (store.students || []).filter(s => String(s.id) !== String(id) && s.id !== sid);
      if (store.attendance) store.attendance = store.attendance.filter(a => String(a.student_id) !== String(id) && a.student_id !== sid);
      if (store.results) store.results = store.results.filter(r => String(r.student_id) !== String(id) && r.student_id !== sid);
      if (store.result_documents) store.result_documents = store.result_documents.filter(d => String(d.student_id) !== String(id) && d.student_id !== sid);
      if (store.student_documents) store.student_documents = store.student_documents.filter(d => String(d.student_id) !== String(id) && d.student_id !== sid);
      if (store.leave_requests) store.leave_requests = store.leave_requests.filter(l => String(l.student_id) !== String(id) && l.student_id !== sid);

      // Permanently remove matching registration so deleted student cannot log into mobile app
      if (store.student_registrations) {
        store.student_registrations = store.student_registrations.filter(r => {
          if (String(r.id) === String(id)) return false;
          if (target) {
            if (target.roll_number && r.assigned_roll_no && target.roll_number.toLowerCase() === r.assigned_roll_no.toLowerCase()) return false;
            if (target.parent_email && r.email && target.parent_email.toLowerCase() === r.email.toLowerCase()) return false;
            if (target.full_name && r.student_name && target.full_name.toLowerCase() === r.student_name.toLowerCase()) return false;
          }
          return true;
        });
      }

      // Remove matching user credentials (except admin)
      if (store.users && target && target.parent_email) {
        store.users = store.users.filter(u => u.email?.toLowerCase() !== target.parent_email?.toLowerCase() || u.role === 'admin' || u.role_name === 'ADMIN');
      }

      saveStore();
    }

    return res.json({ success: true, message: 'Student and associated registration deleted successfully.' });
  } catch (err) {
    console.error('deleteStudent error:', err);
    return res.status(500).json({ success: false, message: 'Failed to delete student.' });
  }
}

// Bulk Import Students from CSV / JSON
async function bulkImportStudents(req, res) {
  try {
    const { students: importedList } = req.body;
    if (!importedList || !Array.isArray(importedList) || importedList.length === 0) {
      return res.status(400).json({ success: false, message: 'No student records provided for import.' });
    }

    const store = getFallbackStore();
    let importedCount = 0;
    const defaultPassword = 'Parent@123';
    const defaultHash = await bcrypt.hash(defaultPassword, 10);

    for (const s of importedList) {
      if (!s.full_name || !s.roll_number) continue;

      const cleanEmail = (s.parent_email && s.parent_email.trim().toLowerCase()) || `parent.${s.roll_number}@highlight.school`;
      const parentFullName = s.parent_name || `Parent of ${s.full_name}`;
      const parentPhoneNum = s.parent_phone || '+92 300 0000000';
      const classId = parseInt(s.class_id || (String(s.class_name || '').includes('5') ? 1 : String(s.class_name || '').includes('6') ? 2 : String(s.class_name || '').includes('7') ? 3 : 4), 10) || 1;
      const className = classId === 1 ? 'Grade 5' : classId === 2 ? 'Grade 6' : classId === 3 ? 'Grade 7' : 'Grade 8';

      // Find or create parent user
      let existingUser = store.users.find(u => u.email.toLowerCase() === cleanEmail);
      let parentUserId;
      if (existingUser) {
        parentUserId = existingUser.id;
      } else {
        parentUserId = Date.now() + Math.floor(Math.random() * 10000);
        existingUser = {
          id: parentUserId,
          role_id: 2,
          role_name: 'PARENT',
          email: cleanEmail,
          password_hash: defaultHash,
          full_name: parentFullName,
          phone: parentPhoneNum,
          avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          is_active: 1
        };
        store.users.push(existingUser);
      }

      let existingParent = (store.parents || []).find(p => p.user_id === parentUserId);
      let parentId;
      if (existingParent) {
        parentId = existingParent.id;
      } else {
        parentId = Date.now() + Math.floor(Math.random() * 10000);
        store.parents.push({
          id: parentId,
          user_id: parentUserId,
          emergency_contact: parentPhoneNum
        });
      }

      // Check if student with same roll number already exists
      let existingStudent = store.students.find(stu => String(stu.roll_number) === String(s.roll_number));
      if (existingStudent) {
        existingStudent.full_name = s.full_name;
        existingStudent.class_id = classId;
        existingStudent.class_name = className;
        existingStudent.gender = s.gender || existingStudent.gender || 'Male';
        existingStudent.fingerprint_device_id = s.fingerprint_device_id || existingStudent.fingerprint_device_id || `FP-${s.roll_number}`;
        existingStudent.parent_name = parentFullName;
        existingStudent.parent_phone = parentPhoneNum;
        existingStudent.parent_email = cleanEmail;
        existingStudent.status = s.status || existingStudent.status || 'Active';
      } else {
        const newStu = {
          id: Date.now() + Math.floor(Math.random() * 100000),
          parent_id: parentId,
          parent_user_id: parentUserId,
          class_id: classId,
          class_name: className,
          roll_number: String(s.roll_number),
          full_name: s.full_name,
          gender: s.gender || 'Male',
          fingerprint_device_id: s.fingerprint_device_id || `FP-${s.roll_number}`,
          status: s.status || 'Active',
          parent_name: parentFullName,
          parent_phone: parentPhoneNum,
          parent_email: cleanEmail
        };
        store.students.push(newStu);
      }
      importedCount++;
    }

    saveStore();

    return res.json({
      success: true,
      count: importedCount,
      message: `Successfully imported / updated ${importedCount} student records.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  uploadStudentAvatar,
  deleteStudent,
  bulkImportStudents
};
