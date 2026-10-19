const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query, isMySQLConnected, getFallbackStore } = require('../config/db');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// User Login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    let user = null;
    let roleName = 'PARENT';

    if (isMySQLConnected()) {
      const rows = await query(
        `SELECT u.*, r.name as role_name 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.email = ? AND u.is_active = TRUE LIMIT 1`,
        [email]
      );
      if (rows && rows.length > 0) {
        user = rows[0];
        roleName = user.role_name;
      }
    } else {
      const store = getFallbackStore();
      if (store) {
        user = store.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) roleName = user.role_name;
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: roleName
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.full_name,
        role: roleName,
        phone: user.phone,
        avatar_url: user.avatar_url
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
}

// Get current profile
async function getCurrentUser(req, res) {
  try {
    const userId = req.user.id;
    let user = null;

    if (isMySQLConnected()) {
      const rows = await query(
        `SELECT u.id, u.email, u.full_name, u.phone, u.avatar_url, r.name as role 
         FROM users u 
         JOIN roles r ON u.role_id = r.id 
         WHERE u.id = ? LIMIT 1`,
        [userId]
      );
      if (rows && rows.length > 0) {
        user = {
          ...rows[0],
          name: rows[0].full_name
        };
      }
    } else {
      const store = getFallbackStore();
      const u = store.users.find(item => item.id === userId);
      if (u) {
        user = {
          id: u.id,
          email: u.email,
          name: u.full_name,
          full_name: u.full_name,
          phone: u.phone,
          avatar_url: u.avatar_url,
          role: u.role_name
        };
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  login,
  getCurrentUser
};
