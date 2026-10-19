const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  getPublicAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement
} = require('../controllers/announcementController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Public endpoint for school website (no login required)
router.get('/public', getPublicAnnouncements);

router.use(authenticateToken);

router.get('/', getAnnouncements);
router.post('/', requireRole('PRINCIPAL_ADMIN'), createAnnouncement);
router.put('/:id', requireRole('PRINCIPAL_ADMIN'), updateAnnouncement);
router.delete('/:id', requireRole('PRINCIPAL_ADMIN'), deleteAnnouncement);

module.exports = router;
