const express = require('express');
const router = express.Router();
const {
  getDevice,
  connect,
  disconnect,
  sync,
  updateSettings,
  getLogs,
  punch,
  mockToggle,
  getWhatsAppConfig,
  updateWhatsAppConfig,
  testWhatsApp,
  getWhatsAppLogs
} = require('../controllers/deviceController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getDevice);
router.post('/connect', requireRole('PRINCIPAL_ADMIN'), connect);
router.post('/disconnect', requireRole('PRINCIPAL_ADMIN'), disconnect);
router.post('/sync', requireRole('PRINCIPAL_ADMIN'), sync);
router.put('/settings', requireRole('PRINCIPAL_ADMIN'), updateSettings);
router.get('/logs', requireRole('PRINCIPAL_ADMIN'), getLogs);
router.post('/punch', punch); // Can be triggered by hardware webhook or admin simulator
router.post('/toggle-status', requireRole('PRINCIPAL_ADMIN'), mockToggle);

// WhatsApp Gateway Integration endpoints
router.get('/whatsapp-config', getWhatsAppConfig);
router.post('/whatsapp-config', requireRole('PRINCIPAL_ADMIN'), updateWhatsAppConfig);
router.post('/whatsapp-test', requireRole('PRINCIPAL_ADMIN'), testWhatsApp);
router.get('/whatsapp-logs', getWhatsAppLogs);

module.exports = router;
