const express = require('express');
const router = express.Router();
const {
  getTimetable,
  getTimetableTemplate,
  saveTimetable,
  deleteTimetable
} = require('../controllers/timetableController');

// Optional auth helper: if token provided, sets req.user, else allows through
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/authMiddleware');

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
      if (!err && decodedUser) {
        req.user = decodedUser;
      }
      next();
    });
  } else {
    next();
  }
}

// Routes
router.get('/', optionalAuth, getTimetable);
router.get('/template', optionalAuth, getTimetableTemplate);
router.post('/', optionalAuth, saveTimetable);
router.put('/:classId', optionalAuth, saveTimetable);
router.delete('/:classId', optionalAuth, deleteTimetable);

module.exports = router;
