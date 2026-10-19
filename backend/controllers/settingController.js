const bcrypt = require('bcryptjs');
const { query, isMySQLConnected, getFallbackStore, saveStore } = require('../config/db');

// Default initial settings
const DEFAULT_SETTINGS = {
  schoolName: 'Highlight Model School',
  tagline: 'Better Learning | Brighter Future',
  academicYear: '2025-2026',
  defaultPort: 4370,
  schoolStartTime: '08:00',
  schoolEndTime: '14:00',
  lateThreshold: '08:30',
  notificationsEnabled: true
};

// GET /api/settings
async function getSettings(req, res) {
  try {
    const store = getFallbackStore();
    if (!store.settings) {
      store.settings = { ...DEFAULT_SETTINGS };
      saveStore();
    }

    let principals = [];
    if (isMySQLConnected()) {
      const rows = await query(
        `SELECT id, email, full_name, phone, avatar_url, is_active, created_at 
         FROM users 
         WHERE role_id = 1 
         ORDER BY id ASC`
      );
      principals = rows || [];
    } else {
      principals = (store.users || [])
        .filter(u => u.role_id === 1 || u.role_name === 'PRINCIPAL_ADMIN')
        .map(({ password_hash, ...u }) => u);
    }

    return res.json({
      success: true,
      settings: store.settings,
      principals
    });
  } catch (err) {
    console.error('getSettings error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// PUT /api/settings
async function updateSettings(req, res) {
  try {
    const store = getFallbackStore();
    if (!store.settings) {
      store.settings = { ...DEFAULT_SETTINGS };
    }

    const {
      schoolName,
      tagline,
      academicYear,
      checkInStartTime,
      schoolStartTime,
      schoolEndTime,
      lateThreshold,
      defaultPort,
      notificationsEnabled
    } = req.body;

    if (schoolName !== undefined) store.settings.schoolName = schoolName;
    if (tagline !== undefined) store.settings.tagline = tagline;
    if (academicYear !== undefined) store.settings.academicYear = academicYear;
    if (checkInStartTime !== undefined) store.settings.checkInStartTime = checkInStartTime;
    if (schoolStartTime !== undefined) store.settings.schoolStartTime = schoolStartTime;
    if (schoolEndTime !== undefined) store.settings.schoolEndTime = schoolEndTime;
    if (lateThreshold !== undefined) store.settings.lateThreshold = lateThreshold;
    if (defaultPort !== undefined) store.settings.defaultPort = defaultPort;
    if (notificationsEnabled !== undefined) store.settings.notificationsEnabled = notificationsEnabled;

    saveStore();

    return res.json({
      success: true,
      message: 'School settings updated successfully.',
      settings: store.settings
    });
  } catch (err) {
    console.error('updateSettings error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// POST /api/settings/principals (Add Principal)
async function addPrincipal(req, res) {
  try {
    const { full_name, email, password, phone, avatar_url } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Principal full name, email, and password are required.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const hashedPassword = await bcrypt.hash(password.trim(), 10);
    const avatar = avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    if (isMySQLConnected()) {
      const existing = await query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
      if (existing && existing.length > 0) {
        return res.status(400).json({ success: false, message: 'User with this email already exists.' });
      }

      const result = await query(
        `INSERT INTO users (role_id, email, password_hash, full_name, phone, avatar_url, is_active)
         VALUES (1, ?, ?, ?, ?, ?, 1)`,
        [cleanEmail, hashedPassword, full_name.trim(), phone || null, avatar]
      );

      return res.status(201).json({
        success: true,
        message: 'Principal account created successfully.',
        principal: {
          id: result.insertId,
          role_id: 1,
          role_name: 'PRINCIPAL_ADMIN',
          full_name: full_name.trim(),
          email: cleanEmail,
          phone: phone || null,
          avatar_url: avatar
        }
      });
    }

    const store = getFallbackStore();
    const existing = (store.users || []).find(u => u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    const newPrincipal = {
      id: Date.now(),
      role_id: 1,
      role_name: 'PRINCIPAL_ADMIN',
      email: cleanEmail,
      password_hash: hashedPassword,
      full_name: full_name.trim(),
      phone: phone || '+1 555-0100',
      avatar_url: avatar,
      is_active: 1,
      created_at: new Date().toISOString()
    };

    store.users.push(newPrincipal);
    saveStore();

    const { password_hash, ...safePrincipal } = newPrincipal;
    return res.status(201).json({
      success: true,
      message: 'Principal added successfully.',
      principal: safePrincipal
    });
  } catch (err) {
    console.error('addPrincipal error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

// DELETE /api/settings/principals/:id
async function deletePrincipal(req, res) {
  try {
    const { id } = req.params;
    const pid = parseInt(id, 10);
    const isSelf = req.user && (String(req.user.id) === String(id) || req.user.id === pid);

    if (isMySQLConnected()) {
      const countRows = await query('SELECT COUNT(*) as count FROM users WHERE role_id = 1');
      if (countRows && countRows[0].count <= 1) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete the only remaining Principal account. School must have at least one administrator.'
        });
      }

      await query('DELETE FROM users WHERE id = ? AND role_id = 1', [id]);
      return res.json({
        success: true,
        message: 'Principal account deleted successfully.',
        isSelf
      });
    }

    const store = getFallbackStore();
    const adminCount = (store.users || []).filter(u => u.role_id === 1 || u.role_name === 'PRINCIPAL_ADMIN').length;
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only remaining Principal account. School must have at least one administrator.'
      });
    }

    store.users = (store.users || []).filter(u => String(u.id) !== String(id) && u.id !== pid);
    saveStore();

    return res.json({
      success: true,
      message: 'Principal account deleted successfully.',
      isSelf
    });
  } catch (err) {
    console.error('deletePrincipal error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getSettings,
  updateSettings,
  addPrincipal,
  deletePrincipal
};
