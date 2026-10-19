const { query, isMySQLConnected, getFallbackStore } = require('../config/db');

// Get announcements
async function getAnnouncements(req, res) {
  try {
    const isParent = req.user.role === 'PARENT';

    if (isMySQLConnected()) {
      let sql = `
        SELECT a.*, u.full_name as author_name 
        FROM announcements a
        JOIN users u ON a.author_id = u.id
      `;
      const params = [];
      if (isParent) {
        sql += ' WHERE a.status = "Published"';
      }
      sql += ' ORDER BY a.announcement_date DESC, a.id DESC';

      const list = await query(sql, params);
      return res.json({ success: true, count: list.length, announcements: list });
    }

    const store = getFallbackStore();
    let list = [...(store.announcements || [])];
    if (isParent) {
      list = list.filter(a => a.status === 'Published');
    }
    return res.json({ success: true, count: list.length, announcements: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Create announcement (Admin)
async function createAnnouncement(req, res) {
  try {
    const { title, description, announcement_date, status = 'Published' } = req.body;
    const authorId = req.user.id;
    const dateVal = announcement_date || new Date().toISOString().slice(0, 10);

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    if (isMySQLConnected()) {
      const result = await query(
        `INSERT INTO announcements (title, description, announcement_date, status, author_id)
         VALUES (?, ?, ?, ?, ?)`,
        [title, description, dateVal, status, authorId]
      );

      // If published, notify parents
      if (status === 'Published') {
        const parents = await query('SELECT user_id FROM parents');
        for (const p of parents) {
          await query(
            `INSERT INTO notifications (user_id, title, message, type, action_url)
             VALUES (?, 'New Announcement', ?, 'Announcement', '/parent/announcements')`,
            [p.user_id, `A new announcement has been posted: ${title}`]
          );
        }
      }

      return res.status(201).json({ success: true, message: 'Announcement created successfully.', id: result.insertId });
    }

    const store = getFallbackStore();
    const newAnn = {
      id: Date.now(),
      title,
      description,
      announcement_date: dateVal,
      status,
      author_id: authorId,
      author_name: req.user.name || 'Admin Principal'
    };
    store.announcements.unshift(newAnn);

    if (status === 'Published') {
      store.notifications.unshift({
        id: Date.now(),
        user_id: 2, // Parent user ID
        title: 'New Announcement',
        message: `A new announcement has been posted: ${title}`,
        type: 'Announcement',
        is_read: 0,
        action_url: '/parent/announcements',
        created_at: new Date().toISOString()
      });
    }

    return res.status(201).json({ success: true, message: 'Announcement created successfully.', announcement: newAnn });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Update announcement
async function updateAnnouncement(req, res) {
  try {
    const { id } = req.params;
    const { title, description, announcement_date, status } = req.body;

    if (isMySQLConnected()) {
      await query(
        `UPDATE announcements 
         SET title = COALESCE(?, title),
             description = COALESCE(?, description),
             announcement_date = COALESCE(?, announcement_date),
             status = COALESCE(?, status),
             updated_at = NOW()
         WHERE id = ?`,
        [title, description, announcement_date, status, id]
      );
      return res.json({ success: true, message: 'Announcement updated successfully.' });
    }

    const store = getFallbackStore();
    const item = store.announcements.find(a => a.id === parseInt(id, 10));
    if (item) {
      if (title) item.title = title;
      if (description) item.description = description;
      if (announcement_date) item.announcement_date = announcement_date;
      if (status) item.status = status;
    }
    return res.json({ success: true, message: 'Announcement updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

// Delete announcement
async function deleteAnnouncement(req, res) {
  try {
    const { id } = req.params;

    if (isMySQLConnected()) {
      await query('DELETE FROM announcements WHERE id = ?', [id]);
      return res.json({ success: true, message: 'Announcement deleted successfully.' });
    }

    const store = getFallbackStore();
    store.announcements = store.announcements.filter(a => a.id !== parseInt(id, 10));
    return res.json({ success: true, message: 'Announcement deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}


// Public announcements for official school website
async function getPublicAnnouncements(req, res) {
  try {
    if (isMySQLConnected()) {
      const sql = `
        SELECT a.id, a.title, a.description, a.announcement_date, a.status, a.created_at, u.full_name as author_name 
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        WHERE a.status = 'Published'
        ORDER BY a.announcement_date DESC, a.id DESC
      `;
      const list = await query(sql);
      return res.json({ success: true, count: list.length, announcements: list });
    }

    const store = getFallbackStore();
    const list = (store.announcements || []).filter(a => a.status === 'Published');
    return res.json({ success: true, count: list.length, announcements: list });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

module.exports = {
  getPublicAnnouncements,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
};
