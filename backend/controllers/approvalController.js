const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { query, isMySQLConnected, getFallbackStore, saveStore } = require('../config/db');

// Sample initial pending registrations
const DEFAULT_REGISTRATIONS = [];

function ensureApprovalsStore() {
  const store = getFallbackStore();
  if (store) {
    if (!store.student_registrations) {
      store.student_registrations = [];
      saveStore();
    }
    // Automatically purge any REJECTED applications so they are completely removed
    const beforeCount = store.student_registrations.length;
    store.student_registrations = store.student_registrations.filter(r => r.status !== 'REJECTED');
    if (store.student_registrations.length !== beforeCount) {
      saveStore();
    }
    return store.student_registrations;
  }
  return [];
}

// 1. Submit Registration from Mobile App / Web (Public)
async function submitRegistration(req, res) {
  try {
    const {
      serial_no,
      date_of_admission,
      student_name,
      student_name_urdu,
      father_name,
      father_name_urdu,
      date_of_birth,
      dob_words,
      caste_tribe,
      father_occupation,
      residence,
      arrears_due,
      class_withdrawn,
      withdrawal_date,
      remarks,
      email,
      phone,
      password,
      class_name,
      gender,
      address,
      student_type,
      prev_school,
      photo_url,
      avatar_url,
      photo
    } = req.body;

    if (!student_name || !father_name) {
      return res.status(400).json({
        success: false,
        message: 'Student name and father name are required.'
      });
    }

    let assignedAvatar = null;
    if (req.file) {
      assignedAvatar = `/uploads/${req.file.filename}`;
    } else if (req.body?.photo_base64 || req.body?.photo) {
      try {
        const raw = String(req.body.photo_base64 || req.body.photo || '').trim();
        if (raw.startsWith('data:image')) {
          let ext = 'jpg';
          if (raw.startsWith('data:image/png')) ext = 'png';
          else if (raw.startsWith('data:image/webp')) ext = 'webp';
          else if (raw.startsWith('data:image/gif')) ext = 'gif';

          const commaIdx = raw.indexOf(',');
          const b64Data = commaIdx !== -1 ? raw.slice(commaIdx + 1) : raw;
          const cleanB64 = b64Data.replace(/\s+/g, '');
          const buffer = Buffer.from(cleanB64, 'base64');

          const uploadsDir = path.join(__dirname, '../uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const filename = `student_reg_${Date.now()}_${Math.floor(100 + Math.random() * 900)}.${ext}`;
          const filepath = path.join(uploadsDir, filename);
          fs.writeFileSync(filepath, buffer);
          assignedAvatar = `/uploads/${filename}`;
        }
      } catch (e) {
        console.warn('Base64 photo save warning in registration:', e.message);
      }
    }

    if (!assignedAvatar) {
      if (photo_url && !photo_url.includes('roman_profile') && !photo_url.includes('roman_real')) {
        assignedAvatar = photo_url;
      } else if (avatar_url && !avatar_url.includes('roman_profile') && !avatar_url.includes('roman_real')) {
        assignedAvatar = avatar_url;
      } else if (photo && !photo.includes('roman_profile') && !photo.includes('roman_real') && !photo.startsWith('data:image')) {
        assignedAvatar = photo;
      } else {
        assignedAvatar = null;
      }
    }

    const regId = Date.now();
    const newRegistration = {
      id: regId,
      serial_no: serial_no || `SR-${Math.floor(1000 + Math.random() * 9000)}`,
      date_of_admission: date_of_admission || new Date().toISOString().slice(0, 10),
      student_name: student_name.trim(),
      student_name_urdu: (student_name_urdu || '').trim(),
      father_name: father_name.trim(),
      father_name_urdu: (father_name_urdu || '').trim(),
      email: (email || '').trim().toLowerCase(),
      phone: (phone || '').trim(),
      password_hash: password ? await bcrypt.hash(password, 10) : null,
      class_name: class_name || 'Grade 1',
      gender: gender || 'Male',
      date_of_birth: date_of_birth || '2015-01-01',
      dob_words: (dob_words || '').trim(),
      caste_tribe: (caste_tribe || '').trim(),
      father_occupation: (father_occupation || '').trim(),
      residence: (residence || address || '').trim(),
      address: (residence || address || '').trim(),
      arrears_due: (arrears_due || '0').trim(),
      class_withdrawn: (class_withdrawn || '').trim(),
      withdrawal_date: (withdrawal_date || '').trim(),
      remarks: (remarks || '').trim(),
      student_type: student_type || 'Fresh / New Student',
      prev_school: prev_school || '',
      avatar_url: assignedAvatar,
      photo_url: assignedAvatar,
      source: 'Mobile App',
      status: 'PENDING',
      applied_date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      rejection_reason: null,
      approved_at: null,
      assigned_roll_no: null
    };

    const list = ensureApprovalsStore();
    list.unshift(newRegistration);
    saveStore();

    return res.json({
      success: true,
      message: 'Student account application submitted successfully. It will be active once approved by the Principal.',
      registration: newRegistration
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit registration.' });
  }
}

async function getRegistrations(req, res) {
  try {
    const statusFilter = req.query.status; // PENDING, APPROVED, REJECTED, or undefined
    const list = ensureApprovalsStore();

    let filtered = [...list];
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter(item => item.status?.toUpperCase() === statusFilter.toUpperCase());
    }

    const pendingCount = list.filter(item => item.status === 'PENDING').length;
    const approvedCount = list.filter(item => item.status === 'APPROVED').length;
    const rejectedCount = list.filter(item => item.status === 'REJECTED').length;

    return res.json({
      success: true,
      count: filtered.length,
      counts: {
        total: list.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      },
      registrations: filtered
    });
  } catch (err) {
    console.error('Get registrations error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve registrations.' });
  }
}

// 3. Approve Registration
async function approveRegistration(req, res) {
  try {
    const id = req.params.id;
    const { assigned_roll_no, remarks } = req.body;
    const list = ensureApprovalsStore();
    const item = list.find(r => String(r.id) === String(id));

    if (!item) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const rollNumber = assigned_roll_no || `HMS-${Math.floor(100 + Math.random() * 900)}`;

    item.status = 'APPROVED';
    item.approved_at = new Date().toISOString().replace('T', ' ').substring(0, 16);
    item.assigned_roll_no = rollNumber;
    item.rejection_reason = null;

    // Automatically create the student in the system
    const store = getFallbackStore();
    if (store && store.students) {
      const existingStudent = store.students.find(s => s.full_name?.toLowerCase() === item.student_name.toLowerCase());
      if (!existingStudent) {
        // Parse DOB to standard format if available
        const rawDob = item.date_of_birth || item.dob || '2018-03-10';
        let formattedDob = rawDob;
        if (rawDob.includes('/')) {
          const parts = rawDob.split('/');
          if (parts.length === 3) {
            // Check if DD/MM/YYYY or MM/DD/YYYY
            const y = parts[2].length === 4 ? parts[2] : parts[0];
            const m = parts[1].padStart(2, '0');
            const d = (parts[2].length === 4 ? parts[0] : parts[2]).padStart(2, '0');
            formattedDob = `${y}-${m}-${d}`;
          }
        }

        const newStudent = {
          id: Date.now(),
          serial_no: item.serial_no || `SR-${Math.floor(1000 + Math.random() * 9000)}`,
          admission_date: item.date_of_admission || new Date().toISOString().slice(0, 10),
          parent_id: Date.now() + 1,
          parent_user_id: Date.now() + 2,
          parent_email: item.email || `${item.student_name.toLowerCase().replace(/\s+/g, '')}@parent.school`,
          parent_name: item.father_name || 'Guardian',
          father_name: item.father_name || 'Guardian',
          father_name_urdu: item.father_name_urdu || '',
          parent_phone: item.phone || '',
          class_id: 1,
          class_name: item.class_name || 'Grade 1',
          roll_number: rollNumber,
          full_name: item.student_name,
          student_name_urdu: item.student_name_urdu || '',
          gender: item.gender || 'Male',
          dob: formattedDob,
          date_of_birth: formattedDob,
          dob_words: item.dob_words || '',
          caste_tribe: item.caste_tribe || '',
          father_occupation: item.father_occupation || '',
          residence: item.residence || item.address || 'Highlight Model School Area, Thall',
          address: item.residence || item.address || 'Highlight Model School Area, Thall',
          arrears_due: item.arrears_due || '0',
          class_withdrawn: item.class_withdrawn || '',
          withdrawal_date: item.withdrawal_date || '',
          remarks: item.remarks || '',
          admission_type: item.student_type || 'Fresh / New Student',
          prev_school: item.prev_school || '',
          fingerprint_device_id: `FP-${Math.floor(100 + Math.random() * 900)}`,
          status: 'Active',
          avatar_url: (item.photo_url && !item.photo_url.includes('roman_profile') && !item.photo_url.includes('roman_real'))
            ? item.photo_url
            : (item.avatar_url && !item.avatar_url.includes('roman_profile') && !item.avatar_url.includes('roman_real'))
              ? item.avatar_url
              : null
        };
        store.students.push(newStudent);
      }
    }

    saveStore();

    return res.json({
      success: true,
      message: `Account approved! ${item.student_name} has been enrolled with Roll No: ${rollNumber}.`,
      registration: item
    });
  } catch (err) {
    console.error('Approve registration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to approve application.' });
  }
}

// 4. Reject / Delete Registration (Permanently removes application from system)
async function rejectRegistration(req, res) {
  try {
    const id = req.params.id;
    const list = ensureApprovalsStore();
    const index = list.findIndex(r => String(r.id) === String(id));

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Registration record not found.' });
    }

    const [removed] = list.splice(index, 1);
    saveStore();

    if (isMySQLConnected()) {
      try {
        await query('DELETE FROM student_registrations WHERE id = ?', [id]);
      } catch (sqlErr) {
        console.warn('MySQL delete error:', sqlErr.message);
      }
    }

    return res.json({
      success: true,
      message: `Application for ${removed.student_name} has been rejected and permanently removed.`,
      deletedId: id,
      removedItem: removed
    });
  } catch (err) {
    console.error('Reject registration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reject and remove application.' });
  }
}


// 5. Check Registration Status (Public for Mobile App & Web)
async function checkRegistrationStatus(req, res) {
  try {
    const rawIdentifier = String(req.query.q || req.query.id || req.params.id || '').trim();
    if (!rawIdentifier) {
      return res.status(400).json({ success: false, message: 'Identifier or ID is required.' });
    }

    const cleanId = rawIdentifier.replace(/^HMS-REG-/i, '').trim().toLowerCase();
    const queryStr = rawIdentifier.toLowerCase();
    const cleanPhone = cleanId.replace(/[\s-+]/g, '');

    const list = ensureApprovalsStore();
    const item = list.find(r => {
      const idStr = String(r.id).toLowerCase();
      const name = (r.student_name || '').toLowerCase();
      const email = (r.email || '').toLowerCase();
      const phone = (r.phone || '').replace(/[\s-+]/g, '');
      const roll = (r.assigned_roll_no || '').toLowerCase();

      return (
        idStr === cleanId ||
        idStr === queryStr ||
        name === queryStr ||
        name === cleanId ||
        (email && (email === queryStr || email === cleanId)) ||
        (cleanPhone.length >= 6 && phone && phone.includes(cleanPhone)) ||
        (roll && (roll === queryStr || roll === cleanId))
      );
    });

    if (!item || item.status === 'DELETED') {
      return res.json({ success: true, exists: false, status: 'DELETED', message: 'Student account has been removed by the administration.' });
    }

    // If marked approved, verify student is actually still enrolled in store.students
    if (item.status === 'APPROVED') {
      const store = getFallbackStore();
      if (store && Array.isArray(store.students)) {
        const stillEnrolled = store.students.some(s =>
          String(s.id) === String(item.id) ||
          (s.roll_number && item.assigned_roll_no && s.roll_number.toLowerCase() === item.assigned_roll_no.toLowerCase()) ||
          (s.full_name && item.student_name && s.full_name.toLowerCase() === item.student_name.toLowerCase()) ||
          (s.parent_email && item.email && s.parent_email.toLowerCase() === item.email.toLowerCase())
        );
        if (!stillEnrolled) {
          item.status = 'DELETED';
          if (store.student_registrations) {
            store.student_registrations = store.student_registrations.filter(r => String(r.id) !== String(item.id));
          }
          saveStore();
          return res.json({ success: true, exists: false, status: 'DELETED', message: 'Student account has been removed by the administration.' });
        }
      }
    }

    return res.json({
      success: true,
      exists: true,
      status: item.status,
      registration: {
        id: item.id,
        student_name: item.student_name,
        father_name: item.father_name,
        class_name: item.class_name,
        assigned_roll_no: item.assigned_roll_no,
        approved_at: item.approved_at,
        status: item.status
      }
    });
  } catch (err) {
    console.error('Check status error:', err);
    return res.status(500).json({ success: false, message: 'Failed to check status.' });
  }
}

module.exports = {
  checkRegistrationStatus,
  submitRegistration,
  getRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteRegistration: rejectRegistration
};
