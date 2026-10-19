const { query, isMySQLConnected, getFallbackStore } = require('../config/db');

async function getClasses(req, res) {
  try {
    if (isMySQLConnected()) {
      const classes = await query('SELECT * FROM classes ORDER BY id ASC');
      return res.json({ success: true, count: classes.length, classes });
    }

    const store = getFallbackStore();
    return res.json({ success: true, count: store.classes.length, classes: store.classes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = { getClasses };
