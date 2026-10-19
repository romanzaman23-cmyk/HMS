const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getWhatsAppLogs,
  testWhatsApp
} = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getNotifications);
router.get('/whatsapp-logs', getWhatsAppLogs);
router.post('/test-whatsapp', testWhatsApp);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);

module.exports = router;
